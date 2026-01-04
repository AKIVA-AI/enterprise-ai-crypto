import pytest
from uuid import uuid4
from datetime import datetime

from app.config import settings
from app.models.basis import BasisQuote
from app.models.domain import Book, BookType, RiskCheckResult, RiskDecision, Order, OrderStatus
from app.services.basis_opportunity_scanner import basis_opportunity_scanner
from app.services.market_data import market_data_service
from app.services.oms_execution import oms_service


@pytest.mark.asyncio
async def test_basis_scanner_to_oms_unwind(monkeypatch):
    settings.tenant_id = "tenant-1"

    quote = BasisQuote(
        instrument="BTC-USD",
        spot_venue="coinbase",
        deriv_venue="bybit",
        spot_bid=100.0,
        spot_ask=101.0,
        perp_bid=103.0,
        perp_ask=104.0,
        basis_bps_mid=250.0,
        basis_bps_bid=200.0,
        basis_bps_ask=150.0,
        basis_z=1.5,
        timestamp=datetime.utcnow(),
        metadata={"spot_mid": 100.5, "perp_mid": 103.5},
    )

    async def fake_build_quotes(*args, **kwargs):
        return [quote]

    async def fake_funding(*args, **kwargs):
        return 8.0

    monkeypatch.setattr(basis_opportunity_scanner.quote_service, "build_quotes", fake_build_quotes)
    monkeypatch.setattr(basis_opportunity_scanner, "_get_funding_bps", fake_funding)

    book = Book(
        id=uuid4(),
        name="Basis Book",
        type=BookType.PROP,
        capital_allocated=100000,
        current_exposure=0,
        max_drawdown_limit=0.2,
        risk_tier=1,
        status="active",
    )

    intents = await basis_opportunity_scanner.generate_intents([book])
    assert intents

    async def allow_kill_switch():
        return True, ""

    async def fake_get_book(_book_id):
        return book

    async def fake_check_intent(*args, **kwargs):
        return RiskCheckResult(
            decision=RiskDecision.APPROVE,
            intent_id=intents[0].id,
            original_intent=intents[0],
        )

    class Adapter:
        def __init__(self, fail=False):
            self.fail = fail
            self.orders = []

        async def place_order(self, order: Order) -> Order:
            if self.fail:
                raise RuntimeError("leg failed")
            order.status = OrderStatus.FILLED
            order.filled_size = order.size
            self.orders.append(order)
            return order

    oms_service._adapters = {
        "bybit": Adapter(fail=False),
        "coinbase": Adapter(fail=True),
    }

    market_data_service.update_price(
        venue="coinbase",
        instrument="BTC-USD",
        bid=100.0,
        ask=100.1,
        last=100.05,
        volume_24h=1_000_000,
    )

    monkeypatch.setattr("app.services.oms_execution.check_kill_switch_for_trading", allow_kill_switch)
    monkeypatch.setattr("app.services.oms_execution.portfolio_engine.get_book", fake_get_book)
    monkeypatch.setattr("app.services.oms_execution.risk_engine.check_intent", fake_check_intent)
    monkeypatch.setattr(oms_service, "_resolve_venue_id", lambda venue: str(uuid4()))
    async def noop_async(*args, **kwargs):
        return None

    monkeypatch.setattr(oms_service, "_record_multi_leg_intent", noop_async)
    monkeypatch.setattr(oms_service, "_record_leg_event", noop_async)
    monkeypatch.setattr(oms_service, "_update_basis_strategy_positions", noop_async)

    order = await oms_service.execute_intent(intents[0], uuid4(), "coinbase")

    assert order is None
    assert oms_service._adapters["bybit"].orders
