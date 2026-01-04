"""
Performance metrics calculator for backtest results.
"""
from __future__ import annotations

from datetime import datetime
from typing import List

import numpy as np
import pandas as pd

from app.models.backtest_result import EquityPoint, PerformanceMetrics, TradeRecord


class PerformanceMetricsCalculator:
    """
    Calculate institutional-grade performance metrics.

    All ratios are annualized assuming 252 trading days.
    """

    TRADING_DAYS_PER_YEAR = 252

    def __init__(self, risk_free_rate: float = 0.02):
        """
        Initialize calculator.

        Args:
            risk_free_rate: Annual risk-free rate (default 2%)
        """
        self.risk_free_rate = risk_free_rate

    def calculate_all(
        self,
        equity_curve: List[EquityPoint],
        trades: List[TradeRecord],
        initial_capital: float,
    ) -> PerformanceMetrics:
        """
        Calculate all performance metrics from backtest results.

        Args:
            equity_curve: List of equity points over time
            trades: List of executed trades
            initial_capital: Starting capital

        Returns:
            PerformanceMetrics with all values populated
        """
        equity_series = self._equity_curve_to_series(equity_curve)
        returns = self.calculate_returns(equity_series)

        final_equity = (
            float(equity_series.iloc[-1]) if not equity_series.empty else initial_capital
        )
        total_return = (final_equity / initial_capital) - 1.0 if initial_capital else 0.0
        annualized_return = self._annualized_return(
            total_return, equity_series.index
        )

        sharpe_ratio = self.calculate_sharpe_ratio(returns)
        sortino_ratio = self.calculate_sortino_ratio(returns)
        max_drawdown = self.calculate_max_drawdown(equity_series)
        max_drawdown_duration_days = self.calculate_max_drawdown_duration(
            equity_series
        )
        avg_drawdown = self._average_drawdown(equity_series)
        calmar_ratio = self.calculate_calmar_ratio(annualized_return, max_drawdown)

        trade_stats = self.calculate_trade_statistics(trades)

        volatility = self.calculate_volatility(returns)
        downside_volatility = self.calculate_downside_volatility(returns)
        var_95 = self.calculate_var(returns, 0.95)
        cvar_95 = self.calculate_cvar(returns, 0.95)

        return PerformanceMetrics(
            total_return=total_return,
            annualized_return=annualized_return,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            max_drawdown=max_drawdown,
            max_drawdown_duration_days=max_drawdown_duration_days,
            avg_drawdown=avg_drawdown,
            total_trades=trade_stats["total_trades"],
            winning_trades=trade_stats["winning_trades"],
            losing_trades=trade_stats["losing_trades"],
            win_rate=trade_stats["win_rate"],
            profit_factor=trade_stats["profit_factor"],
            avg_win=trade_stats["avg_win"],
            avg_loss=trade_stats["avg_loss"],
            largest_win=trade_stats["largest_win"],
            largest_loss=trade_stats["largest_loss"],
            avg_trade_duration_hours=trade_stats["avg_trade_duration_hours"],
            volatility=volatility,
            downside_volatility=downside_volatility,
            var_95=var_95,
            cvar_95=cvar_95,
        )

    def calculate_returns(self, equity_curve: pd.Series) -> pd.Series:
        """Calculate period returns from equity curve."""
        if equity_curve.empty or len(equity_curve) < 2:
            return pd.Series(dtype=float)
        returns = equity_curve.pct_change().dropna()
        return returns.replace([np.inf, -np.inf], np.nan).dropna()

    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """
        Calculate annualized Sharpe ratio.

        Formula: (mean_return - risk_free_rate) / std_dev * sqrt(252)

        Args:
            returns: Series of period returns

        Returns:
            Annualized Sharpe ratio (0.0 if std is zero)
        """
        if returns.empty:
            return 0.0
        daily_rf = self.risk_free_rate / self.TRADING_DAYS_PER_YEAR
        excess = returns - daily_rf
        std = excess.std()
        if std == 0 or np.isnan(std):
            return 0.0
        sharpe = excess.mean() / std * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        return float(sharpe) if np.isfinite(sharpe) else 0.0

    def calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """
        Calculate annualized Sortino ratio.

        Like Sharpe but only penalizes downside volatility.

        Formula: (mean_return - risk_free_rate) / downside_std * sqrt(252)

        Args:
            returns: Series of period returns

        Returns:
            Annualized Sortino ratio (0.0 if downside std is zero)
        """
        if returns.empty:
            return 0.0
        daily_rf = self.risk_free_rate / self.TRADING_DAYS_PER_YEAR
        excess = returns - daily_rf
        downside = np.minimum(excess, 0)
        downside_deviation = np.sqrt(np.mean(np.square(downside)))
        if downside_deviation == 0 or np.isnan(downside_deviation):
            return 0.0
        sortino = (
            excess.mean()
            / downside_deviation
            * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        )
        return float(sortino) if np.isfinite(sortino) else 0.0

    def calculate_calmar_ratio(
        self,
        annualized_return: float,
        max_drawdown: float,
    ) -> float:
        """
        Calculate Calmar ratio.

        Formula: annualized_return / abs(max_drawdown)

        Args:
            annualized_return: Annualized return as decimal
            max_drawdown: Maximum drawdown as decimal (e.g., 0.20 for 20%)

        Returns:
            Calmar ratio (0.0 if max_drawdown is zero)
        """
        if max_drawdown <= 0:
            return 0.0
        ratio = annualized_return / abs(max_drawdown)
        return float(ratio) if np.isfinite(ratio) else 0.0

    def calculate_max_drawdown(self, equity_curve: pd.Series) -> float:
        """
        Calculate maximum peak-to-trough drawdown.

        Args:
            equity_curve: Series of equity values

        Returns:
            Maximum drawdown as decimal (e.g., 0.25 for 25% drawdown)
        """
        if equity_curve.empty:
            return 0.0
        rolling_max = equity_curve.expanding().max()
        drawdowns = (equity_curve - rolling_max) / rolling_max
        if drawdowns.empty:
            return 0.0
        max_dd = abs(drawdowns.min())
        return float(max_dd) if np.isfinite(max_dd) else 0.0

    def calculate_max_drawdown_duration(self, equity_curve: pd.Series) -> int:
        """
        Calculate longest drawdown duration in days.

        Args:
            equity_curve: Series of equity values with datetime index

        Returns:
            Duration in days of longest drawdown period
        """
        if equity_curve.empty or not isinstance(equity_curve.index, pd.DatetimeIndex):
            return 0

        rolling_max = equity_curve.expanding().max()
        in_drawdown = equity_curve < rolling_max
        if not in_drawdown.any():
            return 0

        max_duration_days = 0
        drawdown_start = None
        last_peak_time = equity_curve.index[0]

        for timestamp, is_down in in_drawdown.items():
            if not is_down:
                if drawdown_start is not None:
                    duration = timestamp - drawdown_start
                    max_duration_days = max(
                        max_duration_days, int(duration.total_seconds() // 86400)
                    )
                    drawdown_start = None
                last_peak_time = timestamp
                continue

            if drawdown_start is None:
                drawdown_start = last_peak_time

        if drawdown_start is not None:
            duration = equity_curve.index[-1] - drawdown_start
            max_duration_days = max(
                max_duration_days, int(duration.total_seconds() // 86400)
            )

        return max_duration_days

    def calculate_var(self, returns: pd.Series, confidence: float = 0.95) -> float:
        """
        Calculate Value at Risk (VaR).

        The maximum expected loss at given confidence level.

        Args:
            returns: Series of period returns
            confidence: Confidence level (default 95%)

        Returns:
            VaR as positive decimal (e.g., 0.05 for 5% loss)
        """
        if returns.empty:
            return 0.0
        percentile = (1.0 - confidence) * 100.0
        var = np.percentile(returns, percentile)
        var_value = abs(var)
        return float(var_value) if np.isfinite(var_value) else 0.0

    def calculate_cvar(self, returns: pd.Series, confidence: float = 0.95) -> float:
        """
        Calculate Conditional VaR (Expected Shortfall).

        Average loss when loss exceeds VaR.

        Args:
            returns: Series of period returns
            confidence: Confidence level (default 95%)

        Returns:
            CVaR as positive decimal
        """
        if returns.empty:
            return 0.0
        percentile = (1.0 - confidence) * 100.0
        threshold = np.percentile(returns, percentile)
        tail_losses = returns[returns <= threshold]
        if tail_losses.empty:
            return 0.0
        cvar = abs(tail_losses.mean())
        return float(cvar) if np.isfinite(cvar) else 0.0

    def calculate_trade_statistics(self, trades: List[TradeRecord]) -> dict:
        """
        Calculate trade-level statistics.

        Returns dict with:
            - total_trades
            - winning_trades
            - losing_trades
            - win_rate
            - profit_factor
            - avg_win
            - avg_loss
            - largest_win
            - largest_loss
            - avg_trade_duration_hours
        """
        total_trades = len(trades)
        if total_trades == 0:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0.0,
                "profit_factor": 0.0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
                "largest_win": 0.0,
                "largest_loss": 0.0,
                "avg_trade_duration_hours": 0.0,
            }

        pnls = []
        durations = []
        for trade in trades:
            pnl = trade.pnl
            if pnl is None and trade.exit_price is not None:
                if trade.side.lower() == "short":
                    pnl = (trade.entry_price - trade.exit_price) * trade.size
                else:
                    pnl = (trade.exit_price - trade.entry_price) * trade.size
            if pnl is not None:
                pnls.append(float(pnl))
            if trade.timestamp_close is not None:
                duration = trade.timestamp_close - trade.timestamp_open
                durations.append(duration.total_seconds() / 3600.0)

        pnls_array = np.array(pnls, dtype=float) if pnls else np.array([], dtype=float)
        wins = pnls_array[pnls_array > 0]
        losses = pnls_array[pnls_array < 0]

        winning_trades = int(len(wins))
        losing_trades = int(len(losses))
        win_rate = winning_trades / total_trades if total_trades else 0.0

        gross_profit = wins.sum() if wins.size > 0 else 0.0
        gross_loss = abs(losses.sum()) if losses.size > 0 else 0.0
        profit_factor = (
            gross_profit / gross_loss if gross_loss > 0 else 0.0
        )
        avg_win = wins.mean() if wins.size > 0 else 0.0
        avg_loss = losses.mean() if losses.size > 0 else 0.0
        largest_win = wins.max() if wins.size > 0 else 0.0
        largest_loss = losses.min() if losses.size > 0 else 0.0

        avg_trade_duration_hours = (
            float(np.mean(durations)) if durations else 0.0
        )

        return {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": float(win_rate),
            "profit_factor": float(profit_factor),
            "avg_win": float(avg_win),
            "avg_loss": float(avg_loss),
            "largest_win": float(largest_win),
            "largest_loss": float(largest_loss),
            "avg_trade_duration_hours": float(avg_trade_duration_hours),
        }

    def calculate_volatility(self, returns: pd.Series) -> float:
        """Calculate annualized volatility."""
        if returns.empty:
            return 0.0
        volatility = returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        return float(volatility) if np.isfinite(volatility) else 0.0

    def calculate_downside_volatility(self, returns: pd.Series) -> float:
        """Calculate annualized downside volatility (negative returns only)."""
        if returns.empty:
            return 0.0
        downside = returns[returns < 0]
        if downside.empty:
            return 0.0
        volatility = downside.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        return float(volatility) if np.isfinite(volatility) else 0.0

    def _equity_curve_to_series(self, equity_curve: List[EquityPoint]) -> pd.Series:
        if not equity_curve:
            return pd.Series(dtype=float)
        data = {point.timestamp: point.equity for point in equity_curve}
        series = pd.Series(data).sort_index()
        series = series[~series.index.duplicated(keep="last")]
        return series

    def _annualized_return(
        self, total_return: float, index: pd.Index
    ) -> float:
        if index.empty or not isinstance(index, pd.DatetimeIndex):
            return 0.0
        start = index[0]
        end = index[-1]
        if not isinstance(start, datetime) or not isinstance(end, datetime):
            return 0.0
        days = max((end - start).days, 0)
        if days == 0:
            return 0.0
        annualized = (1.0 + total_return) ** (
            self.TRADING_DAYS_PER_YEAR / days
        ) - 1.0
        return float(annualized) if np.isfinite(annualized) else 0.0

    def _average_drawdown(self, equity_curve: pd.Series) -> float:
        if equity_curve.empty:
            return 0.0
        rolling_max = equity_curve.expanding().max()
        drawdowns = (equity_curve - rolling_max) / rolling_max
        negatives = drawdowns[drawdowns < 0]
        if negatives.empty:
            return 0.0
        avg = abs(negatives.mean())
        return float(avg) if np.isfinite(avg) else 0.0
