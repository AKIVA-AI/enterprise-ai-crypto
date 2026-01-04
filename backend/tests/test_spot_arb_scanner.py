import pytest
from uuid import uuid4
from datetime import datetime

from app.config import settings
from app.models.domain import Book, BookType
from app.services.spot_arb_scanner import SpotArbScanner
from app.services.spot_quote_service import SpotQuote


@pytest.mark.asyncio
async def test_spot_arb_scanner_generates_intent(monkeypatch):
    settings.tenant_id = "tenant-1"
    scanner = SpotArbScanner()

    async def fake_quotes(*args, **kwargs):
        return [
            SpotQuote(
                venue="coinbase",
                instrument="BTC-USD",
                bid_price=100.0,
                ask_price=101.0,
                bid_size=1.0,
                ask_size=1.0,
                spread_bps=10.0,
                timestamp=datetime.utcnow(),
                age_ms=10,
            ),
            SpotQuote(
                venue="kraken",
                instrument="BTC-USD",
                bid_price=103.0,
                ask_price=104.0,
                bid_size=1.0,
                ask_size=1.0,
                spread_bps=10.0,
                timestamp=datetime.utcnow(),
                age_ms=10,
            ),
        ]

    monkeypatch.setattr("app.services.spot_arb_scanner.spot_quote_service.get_quotes", fake_quotes)
    monkeypatch.setattr(scanner, "_get_inventory", lambda *args, **kwargs: 10.0)
    monkeypatch.setattr(scanner, "_store_spread", lambda *args, **kwargs: None)

    book = Book(
        id=uuid4(),
        name="Spot Arb",
        type=BookType.PROP,
        capital_allocated=100000,
        current_exposure=0,
        max_drawdown_limit=0.2,
        risk_tier=1,
        status="active",
    )

    intents = await scanner.generate_intents([book])
    assert intents
    assert intents[0].metadata["execution_mode"] in ("inventory", "legged")
