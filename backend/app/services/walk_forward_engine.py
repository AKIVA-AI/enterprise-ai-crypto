"""
Walk-forward optimization engine.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pandas as pd

from app.models.backtest_result import BacktestResult, PerformanceMetrics
from app.services.institutional_backtester import BacktestConfig, InstitutionalBacktester
from app.services.performance_metrics import PerformanceMetricsCalculator


@dataclass
class WalkForwardConfig:
    """Configuration for walk-forward analysis."""
    train_window: int
    test_window: int
    step_size: int
    initial_capital: float = 100000.0
    timeframe: str = "1h"
    slippage_bps: float = 5.0
    commission_bps: float = 10.0


@dataclass
class WalkForwardResult:
    """Aggregated walk-forward results."""
    window_results: List[BacktestResult]
    aggregate_metrics: Optional[PerformanceMetrics]
    total_windows: int


class WalkForwardEngine:
    """Split data into windows, run backtests, and aggregate results."""

    def __init__(self, config: WalkForwardConfig) -> None:
        self.config = config
        self.metrics_calculator = PerformanceMetricsCalculator()

    def run(
        self,
        strategy: Any,
        data: pd.DataFrame,
        base_config: BacktestConfig,
    ) -> WalkForwardResult:
        """
        Run walk-forward analysis.

        Args:
            strategy: Strategy object with populate_* methods.
            data: OHLCV DataFrame.
            base_config: Base backtest configuration (instrument/time range).
        """
        window_results: List[BacktestResult] = []
        all_equity = []
        all_trades = []

        for start, end in self._window_indices(len(data)):
            window_data = data.iloc[start:end].copy()
            if window_data.empty:
                continue

            start_date = pd.to_datetime(window_data.iloc[0]["date"])
            end_date = pd.to_datetime(window_data.iloc[-1]["date"])

            train_ratio = self.config.train_window / (self.config.train_window + self.config.test_window)
            test_ratio = self.config.test_window / (self.config.train_window + self.config.test_window)

            window_config = BacktestConfig(
                strategy_name=base_config.strategy_name,
                instruments=base_config.instruments,
                start_date=start_date,
                end_date=end_date,
                initial_capital=self.config.initial_capital,
                timeframe=self.config.timeframe,
                slippage_bps=self.config.slippage_bps,
                commission_bps=self.config.commission_bps,
                train_ratio=train_ratio,
                validate_ratio=0.0,
                test_ratio=test_ratio,
                max_position_pct=base_config.max_position_pct,
            )

            backtester = InstitutionalBacktester(window_config)
            result = backtester.run_backtest(strategy, window_data)
            window_results.append(result)

            all_equity.extend(result.equity_curve)
            all_trades.extend(result.trades)

        aggregate_metrics = None
        if all_equity:
            aggregate_metrics = self.metrics_calculator.calculate_all(
                all_equity,
                all_trades,
                self.config.initial_capital,
            )

        return WalkForwardResult(
            window_results=window_results,
            aggregate_metrics=aggregate_metrics,
            total_windows=len(window_results),
        )

    def _window_indices(self, total_rows: int) -> List[tuple[int, int]]:
        window_size = self.config.train_window + self.config.test_window
        if total_rows < window_size:
            return []

        indices = []
        for start in range(0, total_rows - window_size + 1, self.config.step_size):
            end = start + window_size
            indices.append((start, end))
        return indices
