"""
Spot Quote Service - normalizes best bid/ask across venues.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

import structlog

from app.config import settings
from app.database import get_supabase
from app.services.market_data import market_data_service

logger = structlog.get_logger()


@dataclass
class SpotQuote:
    venue: str
    instrument: str
    bid_price: float
    ask_price: float
    bid_size: float
    ask_size: float
    spread_bps: float
    timestamp: datetime
    age_ms: int


class SpotQuoteService:
    """Build and persist spot quotes for arbitrage scanning."""

    def __init__(self):
        self._venue_cache: Dict[str, str] = {}
        self._instrument_cache: Dict[tuple[str, str], str] = {}

    async def get_quotes(self, venues: List[str], instruments: List[str]) -> List[SpotQuote]:
        quotes: List[SpotQuote] = []
        now = datetime.utcnow()

        for venue in venues:
            for instrument in instruments:
                data = await market_data_service.get_price(venue, instrument)
                if not data:
                    continue
                bid = float(data.get("bid", 0))
                ask = float(data.get("ask", 0))
                if not bid or not ask:
                    continue
                bid_size = float(data.get("bid_size", 0) or 0)
                ask_size = float(data.get("ask_size", 0) or 0)
                spread_bps = float(data.get("spread_bps", 0))
                event_time = data.get("event_time")
                if event_time:
                    try:
                        event_dt = datetime.fromisoformat(event_time)
                    except ValueError:
                        event_dt = now
                else:
                    event_dt = now
                age_ms = int((now - event_dt).total_seconds() * 1000)

                quote = SpotQuote(
                    venue=venue,
                    instrument=instrument,
                    bid_price=bid,
                    ask_price=ask,
                    bid_size=bid_size,
                    ask_size=ask_size,
                    spread_bps=spread_bps,
                    timestamp=now,
                    age_ms=age_ms,
                )
                quotes.append(quote)

        await self._store_quotes(quotes)
        return quotes

    async def _store_quotes(self, quotes: List[SpotQuote]) -> None:
        tenant_id = settings.tenant_id
        if not tenant_id or not quotes:
            return
        try:
            supabase = get_supabase()
            for quote in quotes:
                venue_id = self._get_venue_id(quote.venue)
                instrument_id = self._get_instrument_id(tenant_id, venue_id, quote.instrument)
                if not venue_id or not instrument_id:
                    continue
                supabase.table("spot_quotes").insert({
                    "tenant_id": tenant_id,
                    "venue_id": venue_id,
                    "instrument_id": instrument_id,
                    "bid_price": quote.bid_price,
                    "ask_price": quote.ask_price,
                    "bid_size": quote.bid_size,
                    "ask_size": quote.ask_size,
                    "spread_bps": quote.spread_bps,
                    "ts": quote.timestamp.isoformat(),
                }).execute()
        except Exception as exc:
            logger.warning("spot_quote_store_failed", error=str(exc))

    def _get_venue_id(self, venue_name: str) -> Optional[str]:
        if venue_name in self._venue_cache:
            return self._venue_cache[venue_name]
        try:
            supabase = get_supabase()
            result = supabase.table("venues").select("id").ilike("name", venue_name).single().execute()
            if result.data:
                self._venue_cache[venue_name] = result.data["id"]
                return result.data["id"]
        except Exception as exc:
            logger.warning("spot_quote_venue_lookup_failed", venue=venue_name, error=str(exc))
        return None

    def _get_instrument_id(self, tenant_id: str, venue_id: Optional[str], symbol: str) -> Optional[str]:
        if not venue_id:
            return None
        cache_key = (venue_id, symbol)
        if cache_key in self._instrument_cache:
            return self._instrument_cache[cache_key]
        try:
            supabase = get_supabase()
            result = supabase.table("instruments").select("id").eq(
                "tenant_id", tenant_id
            ).eq("venue_id", venue_id).ilike("venue_symbol", symbol).single().execute()
            if result.data:
                self._instrument_cache[cache_key] = result.data["id"]
                return result.data["id"]
        except Exception as exc:
            logger.warning("spot_quote_instrument_lookup_failed", symbol=symbol, error=str(exc))
        return None


spot_quote_service = SpotQuoteService()
