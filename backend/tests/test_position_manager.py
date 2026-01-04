from datetime import datetime, timedelta, timezone

from app.services.position_manager import PositionManager


def test_open_close_long_position_pnl():
    manager = PositionManager()
    entry_time = datetime.now(timezone.utc)
    position = manager.open_position(
        instrument="BTC-USD",
        side="long",
        size=1.0,
        entry_price=100.0,
        entry_time=entry_time,
    )

    closed = manager.close_position(
        position_id=position.id,
        exit_price=110.0,
        exit_time=entry_time + timedelta(hours=1),
        exit_fees=1.0,
    )

    assert closed.status == "closed"
    assert closed.pnl is not None
    assert closed.pnl > 0
    assert closed.pnl_percent is not None


def test_open_close_short_position_pnl():
    manager = PositionManager()
    entry_time = datetime.now(timezone.utc)
    position = manager.open_position(
        instrument="ETH-USD",
        side="short",
        size=2.0,
        entry_price=200.0,
        entry_time=entry_time,
    )

    closed = manager.close_position(
        position_id=position.id,
        exit_price=180.0,
        exit_time=entry_time + timedelta(hours=2),
    )

    assert closed.pnl is not None
    assert closed.pnl > 0


def test_get_positions_includes_closed():
    manager = PositionManager()
    entry_time = datetime.now(timezone.utc)
    position = manager.open_position(
        instrument="SOL-USD",
        side="long",
        size=1.0,
        entry_price=50.0,
        entry_time=entry_time,
    )
    manager.close_position(
        position_id=position.id,
        exit_price=55.0,
        exit_time=entry_time + timedelta(hours=1),
    )

    positions = manager.get_positions()
    assert len(positions["open"]) == 0
    assert len(positions["closed"]) == 1
