import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from uuid import uuid4

import pandas as pd

from app.models.backtest_result import (
    BacktestResult,
    EquityPoint,
    TradeRecord,
)
from app.services.performance_metrics import PerformanceMetricsCalculator

logger = logging.getLogger(__name__)


@dataclass
class BacktestConfig:
    """Configuration for a backtest run."""
    strategy_name: str
    instruments: List[str]
    start_date: datetime
    end_date: datetime
    initial_capital: float = 100000.0
    timeframe: str = "1h"

    # Execution costs (in basis points)
    slippage_bps: float = 5.0      # 5 bps = 0.05%
    commission_bps: float = 10.0   # 10 bps round-trip = 0.10%

    # Data splits for walk-forward validation
    train_ratio: float = 0.6       # 60% in-sample
    validate_ratio: float = 0.2    # 20% validation
    test_ratio: float = 0.2        # 20% out-of-sample

    # Position sizing
    max_position_pct: float = 0.1  # Max 10% of capital per position

    def __post_init__(self):
        """Validate configuration."""
        ratio_sum = self.train_ratio + self.validate_ratio + self.test_ratio
        if not (0.99 <= ratio_sum <= 1.01):
            raise ValueError("Data split ratios must sum to 1.0")
        if self.initial_capital <= 0:
            raise ValueError("Initial capital must be positive")
        if self.start_date >= self.end_date:
            raise ValueError("Start date must be before end date")


@dataclass
class Position:
    """Tracks an open position."""
    instrument: str
    side: str  # 'long' or 'short'
    size: float
    entry_price: float
    entry_time: datetime
    entry_fees: float


class InstitutionalBacktester:
    """
    Professional-grade backtesting engine.

    Features:
    - In-sample/out-of-sample data splits (60/20/20)
    - Realistic slippage and commission modeling
    - Position sizing with risk limits
    - Comprehensive performance metrics
    - Walk-forward validation ready
    """

    def __init__(self, config: BacktestConfig):
        """
        Initialize backtester with configuration.

        Args:
            config: BacktestConfig with all settings
        """
        self.config = config
        self.metrics_calculator = PerformanceMetricsCalculator()

        # State tracking
        self._cash: float = 0.0
        self._positions: Dict[str, Position] = {}
        self._equity_curve: List[EquityPoint] = []
        self._trades: List[TradeRecord] = []
        self._equity_peak: float = 0.0

    def run_backtest(
        self,
        strategy: Any,
        data: pd.DataFrame,
    ) -> BacktestResult:
        """
        Run complete backtest with validation splits.

        Args:
            strategy: Strategy object with populate_indicators(),
                     populate_entry_trend(), populate_exit_trend() methods
            data: OHLCV DataFrame with columns:
                  ['date', 'open', 'high', 'low', 'close', 'volume']

        Returns:
            BacktestResult with full metrics for all splits
        """
        start_time = datetime.now(timezone.utc)

        # 1. Validate data
        self._validate_data(data)

        # 2. Split data into train/validate/test
        train_data, validate_data, test_data = self._split_data(data)

        # 3. Run backtest on each split
        train_result = self._run_single_backtest(strategy, train_data, "train")
        validate_result = self._run_single_backtest(strategy, validate_data, "validate")
        test_result = self._run_single_backtest(strategy, test_data, "test")

        # 4. Combine results
        all_equity = (
            train_result["equity"]
            + validate_result["equity"]
            + test_result["equity"]
        )
        all_trades = (
            train_result["trades"]
            + validate_result["trades"]
            + test_result["trades"]
        )

        # 5. Calculate overall metrics
        overall_metrics = self.metrics_calculator.calculate_all(
            all_equity, all_trades, self.config.initial_capital
        )

        # 6. Build result
        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return BacktestResult(
            id=uuid4(),
            strategy_name=self.config.strategy_name,
            strategy_config={},
            start_date=self.config.start_date,
            end_date=self.config.end_date,
            initial_capital=self.config.initial_capital,
            instruments=self.config.instruments,
            timeframe=self.config.timeframe,
            final_equity=(
                all_equity[-1].equity
                if all_equity
                else self.config.initial_capital
            ),
            equity_curve=all_equity,
            trades=all_trades,
            metrics=overall_metrics,
            created_at=datetime.now(timezone.utc),
            execution_time_seconds=execution_time,
            in_sample_metrics=train_result["metrics"],
            out_sample_metrics=test_result["metrics"],
            validation_metrics=validate_result["metrics"],
        )

    def _validate_data(self, data: pd.DataFrame) -> None:
        """Validate input data has required columns."""
        required_columns = ["date", "open", "high", "low", "close", "volume"]
        missing = set(required_columns) - set(data.columns)
        if missing:
            raise ValueError(f"Data missing required columns: {missing}")
        if data.empty:
            raise ValueError("Data cannot be empty")

    def _split_data(
        self,
        data: pd.DataFrame,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data into train/validate/test sets.

        Args:
            data: Full OHLCV DataFrame

        Returns:
            Tuple of (train_data, validate_data, test_data)
        """
        n = len(data)
        train_end = int(n * self.config.train_ratio)
        validate_end = int(n * (self.config.train_ratio + self.config.validate_ratio))

        train_data = data.iloc[:train_end].copy()
        validate_data = data.iloc[train_end:validate_end].copy()
        test_data = data.iloc[validate_end:].copy()

        logger.info(
            "Data split: train=%s, validate=%s, test=%s",
            len(train_data),
            len(validate_data),
            len(test_data),
        )

        return train_data, validate_data, test_data

    def _run_single_backtest(
        self,
        strategy: Any,
        data: pd.DataFrame,
        split_name: str,
    ) -> Dict:
        """
        Run backtest on a single data split.

        Args:
            strategy: Strategy object
            data: OHLCV DataFrame for this split
            split_name: Name of split for logging

        Returns:
            Dict with 'equity', 'trades', 'metrics'
        """
        if data.empty:
            return {
                "equity": [],
                "trades": [],
                "metrics": None,
            }

        # Reset state
        self._cash = self.config.initial_capital
        self._positions = {}
        self._equity_curve = []
        self._trades = []
        self._equity_peak = self.config.initial_capital

        # Populate strategy indicators
        df = strategy.populate_indicators(
            data.copy(), {"pair": self.config.instruments[0]}
        )
        df = strategy.populate_entry_trend(df, {"pair": self.config.instruments[0]})
        df = strategy.populate_exit_trend(df, {"pair": self.config.instruments[0]})

        # Iterate through bars
        for i in range(1, len(df)):
            row = df.iloc[i]
            prev_row = df.iloc[i - 1]

            current_time = pd.to_datetime(row["date"])
            current_price = row["close"]

            # Check for exit signals first
            self._process_exits(row, prev_row, current_time, current_price)

            # Check for entry signals
            self._process_entries(row, prev_row, current_time, current_price)

            # Record equity point
            self._record_equity(current_time, current_price)

        # Close any remaining positions at end
        self._close_all_positions(df.iloc[-1])

        # Calculate metrics for this split
        metrics = None
        if self._equity_curve and self._trades:
            metrics = self.metrics_calculator.calculate_all(
                self._equity_curve,
                self._trades,
                self.config.initial_capital,
            )

        logger.info(
            "[%s] Completed: %s trades, final equity: %.2f",
            split_name,
            len(self._trades),
            self._cash,
        )

        return {
            "equity": self._equity_curve.copy(),
            "trades": self._trades.copy(),
            "metrics": metrics,
        }

    def _process_entries(
        self,
        row: pd.Series,
        prev_row: pd.Series,
        current_time: datetime,
        current_price: float,
    ) -> None:
        """Process entry signals."""
        instrument = self.config.instruments[0]

        # Check for long entry
        if prev_row.get("enter_long", 0) == 1 and instrument not in self._positions:
            self._open_position(instrument, "long", current_time, current_price)

        # Check for short entry
        elif prev_row.get("enter_short", 0) == 1 and instrument not in self._positions:
            self._open_position(instrument, "short", current_time, current_price)

    def _process_exits(
        self,
        row: pd.Series,
        prev_row: pd.Series,
        current_time: datetime,
        current_price: float,
    ) -> None:
        """Process exit signals."""
        instrument = self.config.instruments[0]

        if instrument not in self._positions:
            return

        position = self._positions[instrument]
        should_exit = False

        # Check for exit signal
        if position.side == "long" and prev_row.get("exit_long", 0) == 1:
            should_exit = True
        elif position.side == "short" and prev_row.get("exit_short", 0) == 1:
            should_exit = True

        if should_exit:
            self._close_position(instrument, current_time, current_price)

    def _open_position(
        self,
        instrument: str,
        side: str,
        entry_time: datetime,
        price: float,
    ) -> None:
        """Open a new position with slippage and fees."""
        # Calculate position size
        position_value = self._cash * self.config.max_position_pct

        # Apply slippage
        slippage = price * (self.config.slippage_bps / 10000)
        entry_price = price + slippage if side == "long" else price - slippage

        # Calculate size and fees
        fees = position_value * (self.config.commission_bps / 10000 / 2)
        size = (position_value - fees) / entry_price

        # Update cash
        self._cash -= position_value

        # Create position
        self._positions[instrument] = Position(
            instrument=instrument,
            side=side,
            size=size,
            entry_price=entry_price,
            entry_time=entry_time,
            entry_fees=fees,
        )

        logger.debug("Opened %s position: %s @ %.2f", side, instrument, entry_price)

    def _close_position(
        self,
        instrument: str,
        exit_time: datetime,
        price: float,
    ) -> None:
        """Close an existing position."""
        if instrument not in self._positions:
            return

        position = self._positions[instrument]

        # Apply slippage
        slippage = price * (self.config.slippage_bps / 10000)
        exit_price = price - slippage if position.side == "long" else price + slippage

        # Calculate PnL
        if position.side == "long":
            pnl = (exit_price - position.entry_price) * position.size
        else:
            pnl = (position.entry_price - exit_price) * position.size

        # Calculate fees
        exit_fees = (
            exit_price * position.size * (self.config.commission_bps / 10000 / 2)
        )
        total_fees = position.entry_fees + exit_fees

        # Net PnL
        net_pnl = pnl - exit_fees
        pnl_percent = net_pnl / (position.entry_price * position.size)

        # Update cash
        self._cash += (exit_price * position.size) - exit_fees

        # Record trade
        self._trades.append(
            TradeRecord(
                id=uuid4(),
                timestamp_open=position.entry_time,
                timestamp_close=exit_time,
                instrument=instrument,
                side=position.side,
                size=position.size,
                entry_price=position.entry_price,
                exit_price=exit_price,
                pnl=net_pnl,
                pnl_percent=pnl_percent,
                fees=total_fees,
                slippage=slippage * 2,  # Entry + exit
            )
        )

        # Remove position
        del self._positions[instrument]

        logger.debug(
            "Closed %s position: %s @ %.2f, PnL: %.2f",
            position.side,
            instrument,
            exit_price,
            net_pnl,
        )

    def _close_all_positions(self, final_row: pd.Series) -> None:
        """Close all remaining positions at end of backtest."""
        current_time = pd.to_datetime(final_row["date"])
        current_price = final_row["close"]

        for instrument in list(self._positions.keys()):
            self._close_position(instrument, current_time, current_price)

    def _record_equity(self, timestamp: datetime, current_price: float) -> None:
        """Record current equity point."""
        # Calculate position value
        position_value = 0.0
        for pos in self._positions.values():
            if pos.side == "long":
                position_value += pos.size * current_price
            else:
                position_value += pos.size * (2 * pos.entry_price - current_price)

        total_equity = self._cash + position_value

        # Calculate drawdown
        # Track peak incrementally to avoid scanning the full curve each step.
        if total_equity > self._equity_peak:
            self._equity_peak = total_equity
        if self._equity_peak > 0:
            drawdown = max(0.0, (self._equity_peak - total_equity) / self._equity_peak)
        else:
            drawdown = 0.0

        self._equity_curve.append(
            EquityPoint(
                timestamp=timestamp,
                equity=total_equity,
                drawdown=drawdown,
                position_value=position_value,
                cash=self._cash,
            )
        )
