from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.models.backtest_result import (
    BacktestResult,
    EquityPoint,
    PerformanceMetrics,
    TradeRecord,
)


def _make_metrics() -> PerformanceMetrics:
    return PerformanceMetrics(
        total_return=0.25,
        annualized_return=0.30,
        sharpe_ratio=1.5,
        sortino_ratio=1.8,
        calmar_ratio=2.1,
        max_drawdown=0.12,
        max_drawdown_duration_days=15,
        avg_drawdown=0.05,
        total_trades=20,
        winning_trades=12,
        losing_trades=8,
        win_rate=0.6,
        profit_factor=1.8,
        avg_win=150.0,
        avg_loss=-80.0,
        largest_win=500.0,
        largest_loss=-200.0,
        avg_trade_duration_hours=4.5,
        volatility=0.25,
        downside_volatility=0.18,
        var_95=-0.04,
        cvar_95=-0.06,
    )


def test_equity_point_creation():
    now = datetime.now(timezone.utc)
    point = EquityPoint(
        timestamp=now,
        equity=105000.0,
        drawdown=0.02,
        position_value=50000.0,
        cash=55000.0,
    )

    assert point.timestamp == now
    assert point.equity == 105000.0
    assert point.drawdown == 0.02
    assert point.position_value == 50000.0
    assert point.cash == 55000.0


def test_trade_record_creation():
    trade_id = uuid4()
    opened = datetime.now(timezone.utc)
    trade = TradeRecord(
        id=trade_id,
        timestamp_open=opened,
        timestamp_close=None,
        instrument="BTC-USD",
        side="long",
        size=1.5,
        entry_price=40000.0,
        exit_price=None,
        pnl=None,
        pnl_percent=None,
        fees=5.0,
        slippage=2.0,
    )

    assert trade.id == trade_id
    assert trade.timestamp_open == opened
    assert trade.timestamp_close is None
    assert trade.instrument == "BTC-USD"
    assert trade.side == "long"
    assert trade.size == 1.5
    assert trade.entry_price == 40000.0
    assert trade.exit_price is None
    assert trade.pnl is None
    assert trade.pnl_percent is None
    assert trade.fees == 5.0
    assert trade.slippage == 2.0


def test_performance_metrics_creation():
    metrics = _make_metrics()

    assert metrics.total_return == 0.25
    assert metrics.annualized_return == 0.30
    assert metrics.sharpe_ratio == 1.5
    assert metrics.sortino_ratio == 1.8
    assert metrics.calmar_ratio == 2.1
    assert metrics.max_drawdown == 0.12
    assert metrics.max_drawdown_duration_days == 15
    assert metrics.avg_drawdown == 0.05
    assert metrics.total_trades == 20
    assert metrics.winning_trades == 12
    assert metrics.losing_trades == 8
    assert metrics.win_rate == 0.6
    assert metrics.profit_factor == 1.8
    assert metrics.avg_win == 150.0
    assert metrics.avg_loss == -80.0
    assert metrics.largest_win == 500.0
    assert metrics.largest_loss == -200.0
    assert metrics.avg_trade_duration_hours == 4.5
    assert metrics.volatility == 0.25
    assert metrics.downside_volatility == 0.18
    assert metrics.var_95 == -0.04
    assert metrics.cvar_95 == -0.06


def test_backtest_result_creation():
    now = datetime.now(timezone.utc)
    trade_id = uuid4()
    metrics = _make_metrics()
    equity_point = EquityPoint(
        timestamp=now,
        equity=100000.0,
        drawdown=0.0,
        position_value=0.0,
        cash=100000.0,
    )
    trade = TradeRecord(
        id=trade_id,
        timestamp_open=now,
        timestamp_close=now,
        instrument="ETH-USD",
        side="short",
        size=2.0,
        entry_price=2000.0,
        exit_price=1900.0,
        pnl=200.0,
        pnl_percent=0.1,
        fees=10.0,
        slippage=1.0,
    )

    result = BacktestResult(
        strategy_name="MeanReversion",
        strategy_config={"window": 20},
        start_date=now,
        end_date=now,
        initial_capital=100000.0,
        instruments=["ETH-USD"],
        timeframe="1h",
        final_equity=101000.0,
        equity_curve=[equity_point],
        trades=[trade],
        metrics=metrics,
        execution_time_seconds=2.5,
    )

    assert result.strategy_name == "MeanReversion"
    assert result.strategy_config["window"] == 20
    assert result.start_date == now
    assert result.end_date == now
    assert result.initial_capital == 100000.0
    assert result.instruments == ["ETH-USD"]
    assert result.timeframe == "1h"
    assert result.final_equity == 101000.0
    assert result.equity_curve[0] == equity_point
    assert result.trades[0] == trade
    assert result.metrics == metrics
    assert result.execution_time_seconds == 2.5


def test_backtest_result_default_values():
    result = BacktestResult()

    assert isinstance(result.id, UUID)
    assert result.strategy_name == ""
    assert result.strategy_config == {}
    assert result.start_date is None
    assert result.end_date is None
    assert result.initial_capital == 100000.0
    assert result.instruments == []
    assert result.timeframe == "1h"
    assert result.final_equity == 0.0
    assert result.equity_curve == []
    assert result.trades == []
    assert result.metrics is None
    assert isinstance(result.created_at, datetime)
    assert result.execution_time_seconds == 0.0
    assert result.in_sample_metrics is None
    assert result.out_sample_metrics is None
    assert result.validation_metrics is None


def test_backtest_result_to_dict():
    now = datetime.now(timezone.utc)
    metrics = _make_metrics()
    result = BacktestResult(
        strategy_name="Breakout",
        strategy_config={"threshold": 1.5},
        start_date=now,
        end_date=now,
        initial_capital=50000.0,
        instruments=["BTC-USD", "ETH-USD"],
        timeframe="4h",
        final_equity=55000.0,
        equity_curve=[
            EquityPoint(
                timestamp=now,
                equity=50000.0,
                drawdown=0.0,
                position_value=0.0,
                cash=50000.0,
            )
        ],
        trades=[
            TradeRecord(
                id=uuid4(),
                timestamp_open=now,
                timestamp_close=None,
                instrument="BTC-USD",
                side="long",
                size=0.5,
                entry_price=42000.0,
                exit_price=None,
                pnl=None,
                pnl_percent=None,
                fees=1.0,
                slippage=0.5,
            )
        ],
        metrics=metrics,
        execution_time_seconds=3.0,
    )

    data = result.to_dict()

    assert data["strategy_name"] == "Breakout"
    assert data["strategy_config"]["threshold"] == 1.5
    assert data["start_date"] == now.isoformat()
    assert data["end_date"] == now.isoformat()
    assert data["initial_capital"] == 50000.0
    assert data["instruments"] == ["BTC-USD", "ETH-USD"]
    assert data["timeframe"] == "4h"
    assert data["final_equity"] == 55000.0
    assert data["metrics"]["sharpe_ratio"] == metrics.sharpe_ratio
    assert data["equity_curve"][0]["equity"] == 50000.0
    assert data["trades"][0]["instrument"] == "BTC-USD"
    assert isinstance(data["id"], str)
    assert isinstance(data["created_at"], str)


def test_backtest_result_from_dict():
    now = datetime.now(timezone.utc)
    metrics = _make_metrics()
    payload = {
        "id": str(uuid4()),
        "strategy_name": "Momentum",
        "strategy_config": {"alpha": 0.3},
        "start_date": now.isoformat(),
        "end_date": now.isoformat(),
        "initial_capital": 75000.0,
        "instruments": ["SOL-USD"],
        "timeframe": "1h",
        "final_equity": 76000.0,
        "equity_curve": [
            {
                "timestamp": now.isoformat(),
                "equity": 75000.0,
                "drawdown": 0.01,
                "position_value": 1000.0,
                "cash": 74000.0,
            }
        ],
        "trades": [
            {
                "id": str(uuid4()),
                "timestamp_open": now.isoformat(),
                "timestamp_close": None,
                "instrument": "SOL-USD",
                "side": "long",
                "size": 10.0,
                "entry_price": 100.0,
                "exit_price": None,
                "pnl": None,
                "pnl_percent": None,
                "fees": 2.0,
                "slippage": 0.2,
            }
        ],
        "metrics": metrics.to_dict(),
        "execution_time_seconds": 1.2,
    }

    result = BacktestResult.from_dict(payload)

    assert result is not None
    assert isinstance(result.id, UUID)
    assert result.strategy_name == "Momentum"
    assert result.strategy_config["alpha"] == 0.3
    assert result.start_date == now
    assert result.end_date == now
    assert result.initial_capital == 75000.0
    assert result.instruments == ["SOL-USD"]
    assert result.timeframe == "1h"
    assert result.final_equity == 76000.0
    assert result.equity_curve[0].equity == 75000.0
    assert result.trades[0].instrument == "SOL-USD"
    assert result.metrics is not None
    assert result.metrics.sharpe_ratio == metrics.sharpe_ratio
    assert result.execution_time_seconds == 1.2


def test_performance_metrics_to_dict():
    metrics = _make_metrics()
    data = metrics.to_dict()

    assert data["total_return"] == 0.25
    assert data["annualized_return"] == 0.30
    assert data["sharpe_ratio"] == 1.5
    assert data["sortino_ratio"] == 1.8
    assert data["calmar_ratio"] == 2.1
    assert data["max_drawdown"] == 0.12
    assert data["max_drawdown_duration_days"] == 15
    assert data["avg_drawdown"] == 0.05
    assert data["total_trades"] == 20
    assert data["winning_trades"] == 12
    assert data["losing_trades"] == 8
    assert data["win_rate"] == 0.6
    assert data["profit_factor"] == 1.8
    assert data["avg_win"] == 150.0
    assert data["avg_loss"] == -80.0
    assert data["largest_win"] == 500.0
    assert data["largest_loss"] == -200.0
    assert data["avg_trade_duration_hours"] == 4.5
    assert data["volatility"] == 0.25
    assert data["downside_volatility"] == 0.18
    assert data["var_95"] == -0.04
    assert data["cvar_95"] == -0.06


def test_performance_metrics_from_dict():
    payload = _make_metrics().to_dict()
    metrics = PerformanceMetrics.from_dict(payload)

    assert metrics is not None
    assert metrics.total_return == 0.25
    assert metrics.annualized_return == 0.30
    assert metrics.sharpe_ratio == 1.5
    assert metrics.sortino_ratio == 1.8
    assert metrics.calmar_ratio == 2.1
    assert metrics.max_drawdown == 0.12
    assert metrics.max_drawdown_duration_days == 15
    assert metrics.avg_drawdown == 0.05
    assert metrics.total_trades == 20
    assert metrics.winning_trades == 12
    assert metrics.losing_trades == 8
    assert metrics.win_rate == 0.6
    assert metrics.profit_factor == 1.8
    assert metrics.avg_win == 150.0
    assert metrics.avg_loss == -80.0
    assert metrics.largest_win == 500.0
    assert metrics.largest_loss == -200.0
    assert metrics.avg_trade_duration_hours == 4.5
    assert metrics.volatility == 0.25
    assert metrics.downside_volatility == 0.18
    assert metrics.var_95 == -0.04
    assert metrics.cvar_95 == -0.06
