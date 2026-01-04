"""
Backtest result data models for strategy evaluation.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4


def _serialize_datetime(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat()


def _parse_datetime(value: Optional[object]) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        text = value.strip()
        if text.endswith("Z"):
            text = f"{text[:-1]}+00:00"
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return None
    return None


def _serialize_uuid(value: Optional[UUID]) -> Optional[str]:
    if value is None:
        return None
    return str(value)


def _parse_uuid(value: Optional[object]) -> Optional[UUID]:
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    if isinstance(value, str):
        try:
            return UUID(value)
        except ValueError:
            return None
    return None


def _coalesce_number(value: Optional[float], default: float) -> float:
    return default if value is None else float(value)


@dataclass
class EquityPoint:
    """Single point on equity curve."""
    timestamp: datetime
    equity: float
    drawdown: float
    position_value: float
    cash: float


@dataclass
class TradeRecord:
    """Record of a single trade."""
    id: UUID
    timestamp_open: datetime
    timestamp_close: Optional[datetime]
    instrument: str
    side: str  # 'long' or 'short'
    size: float
    entry_price: float
    exit_price: Optional[float]
    pnl: Optional[float]
    pnl_percent: Optional[float]
    fees: float
    slippage: float


@dataclass
class PerformanceMetrics:
    """Comprehensive performance metrics."""
    # Returns
    total_return: float
    annualized_return: float

    # Risk-adjusted
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float

    # Drawdown
    max_drawdown: float
    max_drawdown_duration_days: int
    avg_drawdown: float

    # Trade stats
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    avg_trade_duration_hours: float

    # Risk
    volatility: float
    downside_volatility: float
    var_95: float
    cvar_95: float

    def to_dict(self) -> dict:
        """Convert metrics to a dictionary."""
        return {
            "total_return": self.total_return,
            "annualized_return": self.annualized_return,
            "sharpe_ratio": self.sharpe_ratio,
            "sortino_ratio": self.sortino_ratio,
            "calmar_ratio": self.calmar_ratio,
            "max_drawdown": self.max_drawdown,
            "max_drawdown_duration_days": self.max_drawdown_duration_days,
            "avg_drawdown": self.avg_drawdown,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate": self.win_rate,
            "profit_factor": self.profit_factor,
            "avg_win": self.avg_win,
            "avg_loss": self.avg_loss,
            "largest_win": self.largest_win,
            "largest_loss": self.largest_loss,
            "avg_trade_duration_hours": self.avg_trade_duration_hours,
            "volatility": self.volatility,
            "downside_volatility": self.downside_volatility,
            "var_95": self.var_95,
            "cvar_95": self.cvar_95,
        }

    @classmethod
    def from_dict(cls, data: Optional[dict]) -> Optional["PerformanceMetrics"]:
        """Create metrics from a dictionary."""
        if data is None:
            return None
        if isinstance(data, PerformanceMetrics):
            return data
        return cls(
            total_return=_coalesce_number(data.get("total_return"), 0.0),
            annualized_return=_coalesce_number(data.get("annualized_return"), 0.0),
            sharpe_ratio=_coalesce_number(data.get("sharpe_ratio"), 0.0),
            sortino_ratio=_coalesce_number(data.get("sortino_ratio"), 0.0),
            calmar_ratio=_coalesce_number(data.get("calmar_ratio"), 0.0),
            max_drawdown=_coalesce_number(data.get("max_drawdown"), 0.0),
            max_drawdown_duration_days=int(data.get("max_drawdown_duration_days") or 0),
            avg_drawdown=_coalesce_number(data.get("avg_drawdown"), 0.0),
            total_trades=int(data.get("total_trades") or 0),
            winning_trades=int(data.get("winning_trades") or 0),
            losing_trades=int(data.get("losing_trades") or 0),
            win_rate=_coalesce_number(data.get("win_rate"), 0.0),
            profit_factor=_coalesce_number(data.get("profit_factor"), 0.0),
            avg_win=_coalesce_number(data.get("avg_win"), 0.0),
            avg_loss=_coalesce_number(data.get("avg_loss"), 0.0),
            largest_win=_coalesce_number(data.get("largest_win"), 0.0),
            largest_loss=_coalesce_number(data.get("largest_loss"), 0.0),
            avg_trade_duration_hours=_coalesce_number(
                data.get("avg_trade_duration_hours"), 0.0
            ),
            volatility=_coalesce_number(data.get("volatility"), 0.0),
            downside_volatility=_coalesce_number(data.get("downside_volatility"), 0.0),
            var_95=_coalesce_number(data.get("var_95"), 0.0),
            cvar_95=_coalesce_number(data.get("cvar_95"), 0.0),
        )


@dataclass
class BacktestResult:
    """Complete backtest result."""
    id: UUID = field(default_factory=uuid4)
    strategy_name: str = ""
    strategy_config: dict = field(default_factory=dict)

    # Time range
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Configuration
    initial_capital: float = 100000.0
    instruments: List[str] = field(default_factory=list)
    timeframe: str = "1h"

    # Results
    final_equity: float = 0.0
    equity_curve: List[EquityPoint] = field(default_factory=list)
    trades: List[TradeRecord] = field(default_factory=list)
    metrics: Optional[PerformanceMetrics] = None

    # Metadata
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    execution_time_seconds: float = 0.0

    # Validation splits
    in_sample_metrics: Optional[PerformanceMetrics] = None
    out_sample_metrics: Optional[PerformanceMetrics] = None
    validation_metrics: Optional[PerformanceMetrics] = None

    def to_dict(self) -> dict:
        """Convert the backtest result to a dictionary."""
        equity_curve = self.equity_curve or []
        trades = self.trades or []
        instruments = self.instruments or []

        return {
            "id": _serialize_uuid(self.id),
            "strategy_name": self.strategy_name,
            "strategy_config": self.strategy_config or {},
            "start_date": _serialize_datetime(self.start_date),
            "end_date": _serialize_datetime(self.end_date),
            "initial_capital": self.initial_capital,
            "instruments": list(instruments),
            "timeframe": self.timeframe,
            "final_equity": self.final_equity,
            "equity_curve": [
                {
                    "timestamp": _serialize_datetime(point.timestamp),
                    "equity": point.equity,
                    "drawdown": point.drawdown,
                    "position_value": point.position_value,
                    "cash": point.cash,
                }
                for point in equity_curve
            ],
            "trades": [
                {
                    "id": _serialize_uuid(trade.id),
                    "timestamp_open": _serialize_datetime(trade.timestamp_open),
                    "timestamp_close": _serialize_datetime(trade.timestamp_close),
                    "instrument": trade.instrument,
                    "side": trade.side,
                    "size": trade.size,
                    "entry_price": trade.entry_price,
                    "exit_price": trade.exit_price,
                    "pnl": trade.pnl,
                    "pnl_percent": trade.pnl_percent,
                    "fees": trade.fees,
                    "slippage": trade.slippage,
                }
                for trade in trades
            ],
            "metrics": self.metrics.to_dict() if self.metrics else None,
            "created_at": _serialize_datetime(self.created_at),
            "execution_time_seconds": self.execution_time_seconds,
            "in_sample_metrics": (
                self.in_sample_metrics.to_dict() if self.in_sample_metrics else None
            ),
            "out_sample_metrics": (
                self.out_sample_metrics.to_dict() if self.out_sample_metrics else None
            ),
            "validation_metrics": (
                self.validation_metrics.to_dict() if self.validation_metrics else None
            ),
        }

    @classmethod
    def from_dict(cls, data: Optional[dict]) -> Optional["BacktestResult"]:
        """Create a backtest result from a dictionary."""
        if data is None:
            return None
        if isinstance(data, BacktestResult):
            return data

        equity_curve = []
        for point in data.get("equity_curve") or []:
            if isinstance(point, EquityPoint):
                equity_curve.append(point)
                continue
            if not isinstance(point, dict):
                continue
            equity_curve.append(
                EquityPoint(
                    timestamp=_parse_datetime(point.get("timestamp")) or datetime.now(timezone.utc),
                    equity=_coalesce_number(point.get("equity"), 0.0),
                    drawdown=_coalesce_number(point.get("drawdown"), 0.0),
                    position_value=_coalesce_number(point.get("position_value"), 0.0),
                    cash=_coalesce_number(point.get("cash"), 0.0),
                )
            )

        trades = []
        for trade in data.get("trades") or []:
            if isinstance(trade, TradeRecord):
                trades.append(trade)
                continue
            if not isinstance(trade, dict):
                continue
            trades.append(
                TradeRecord(
                    id=_parse_uuid(trade.get("id")) or uuid4(),
                    timestamp_open=(
                        _parse_datetime(trade.get("timestamp_open")) or datetime.now(timezone.utc)
                    ),
                    timestamp_close=_parse_datetime(trade.get("timestamp_close")),
                    instrument=trade.get("instrument") or "",
                    side=trade.get("side") or "",
                    size=_coalesce_number(trade.get("size"), 0.0),
                    entry_price=_coalesce_number(trade.get("entry_price"), 0.0),
                    exit_price=trade.get("exit_price"),
                    pnl=trade.get("pnl"),
                    pnl_percent=trade.get("pnl_percent"),
                    fees=_coalesce_number(trade.get("fees"), 0.0),
                    slippage=_coalesce_number(trade.get("slippage"), 0.0),
                )
            )

        metrics = PerformanceMetrics.from_dict(data.get("metrics"))
        in_sample_metrics = PerformanceMetrics.from_dict(data.get("in_sample_metrics"))
        out_sample_metrics = PerformanceMetrics.from_dict(data.get("out_sample_metrics"))
        validation_metrics = PerformanceMetrics.from_dict(data.get("validation_metrics"))

        return cls(
            id=_parse_uuid(data.get("id")) or uuid4(),
            strategy_name=data.get("strategy_name") or "",
            strategy_config=data.get("strategy_config") or {},
            start_date=_parse_datetime(data.get("start_date")),
            end_date=_parse_datetime(data.get("end_date")),
            initial_capital=_coalesce_number(data.get("initial_capital"), 100000.0),
            instruments=list(data.get("instruments") or []),
            timeframe=data.get("timeframe") or "1h",
            final_equity=_coalesce_number(data.get("final_equity"), 0.0),
            equity_curve=equity_curve,
            trades=trades,
            metrics=metrics,
            created_at=_parse_datetime(data.get("created_at")) or datetime.now(timezone.utc),
            execution_time_seconds=_coalesce_number(
                data.get("execution_time_seconds"), 0.0
            ),
            in_sample_metrics=in_sample_metrics,
            out_sample_metrics=out_sample_metrics,
            validation_metrics=validation_metrics,
        )
