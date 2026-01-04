"""
Basis Quote Service - builds basis quotes for spot vs derivatives.
"""
from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional, Tuple

import structlog

from app.config import settings
from app.database import get_supabase
from app.models.basis import BasisQuote
from app.services.market_data import market_data_service

logger = structlog.get_logger()


@dataclass
class BasisQuoteConfig:
    window: int = 50
    min_samples: int = 10


class BasisQuoteService:
    """Builds and stores basis quotes with rolling z-score."""

    def __init__(self, config: Optional[BasisQuoteConfig] = None):
        self.config = config or BasisQuoteConfig()
        self._history: Dict[Tuple[str, str, str], Deque[float]] = defaultdict(
            lambda: deque(maxlen=self.config.window)
        )
        self._venue_cache: Dict[str, str] = {}
        self._instrument_cache: Dict[Tuple[str, str], str] = {}

    async def build_quotes(
        self,
        instruments: List[str],
        spot_venue: str,
        deriv_venue: str,
        tenant_id: Optional[str] = None,
    ) -> List[BasisQuote]:
        tenant_id = tenant_id or settings.tenant_id
        if not tenant_id:
            logger.warning("basis_quote_missing_tenant")
            return []

        spot_venue_id = self._get_venue_id(spot_venue)
        deriv_venue_id = self._get_venue_id(deriv_venue)
        if not spot_venue_id or not deriv_venue_id:
            return []

        quotes = []
        for instrument in instruments:
            spot_quote = await market_data_service.get_price(spot_venue, instrument)
            deriv_quote = await market_data_service.get_price(deriv_venue, instrument)
            if not spot_quote or not deriv_quote:
                continue

            spot_bid = float(spot_quote.get("bid", 0))
            spot_ask = float(spot_quote.get("ask", 0))
            perp_bid = float(deriv_quote.get("bid", 0))
            perp_ask = float(deriv_quote.get("ask", 0))
            if not spot_bid or not spot_ask or not perp_bid or not perp_ask:
                continue

            spot_mid = (spot_bid + spot_ask) / 2
            perp_mid = (perp_bid + perp_ask) / 2

            basis_bps_mid = (perp_mid - spot_mid) / spot_mid * 10000
            basis_bps_bid = (perp_bid - spot_ask) / spot_ask * 10000
            basis_bps_ask = (perp_ask - spot_bid) / spot_bid * 10000

            key = (instrument, spot_venue, deriv_venue)
            history = self._history[key]
            history.append(basis_bps_mid)
            basis_z = self._calculate_zscore(history, basis_bps_mid)

            quote = BasisQuote(
                instrument=instrument,
                spot_venue=spot_venue,
                deriv_venue=deriv_venue,
                spot_bid=spot_bid,
                spot_ask=spot_ask,
                perp_bid=perp_bid,
                perp_ask=perp_ask,
                basis_bps_mid=basis_bps_mid,
                basis_bps_bid=basis_bps_bid,
                basis_bps_ask=basis_bps_ask,
                basis_z=basis_z,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "spot_mid": spot_mid,
                    "perp_mid": perp_mid,
                },
            )

            instrument_id = self._get_instrument_id(tenant_id, spot_venue_id, instrument)
            if instrument_id:
                self._store_quote(
                    tenant_id=tenant_id,
                    spot_venue_id=spot_venue_id,
                    deriv_venue_id=deriv_venue_id,
                    instrument_id=instrument_id,
                    quote=quote,
                )

            quotes.append(quote)

        return quotes

    def _calculate_zscore(self, history: Deque[float], latest: float) -> float:
        if len(history) < self.config.min_samples:
            return 0.0
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        if variance == 0:
            return 0.0
        return (latest - mean) / variance ** 0.5

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
            logger.warning("basis_quote_venue_lookup_failed", venue=venue_name, error=str(exc))
        return None

    def _get_instrument_id(self, tenant_id: str, venue_id: str, symbol: str) -> Optional[str]:
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
            logger.warning("basis_quote_instrument_lookup_failed", symbol=symbol, error=str(exc))
        return None

    def _store_quote(
        self,
        tenant_id: str,
        spot_venue_id: str,
        deriv_venue_id: str,
        instrument_id: str,
        quote: BasisQuote,
    ) -> None:
        try:
            supabase = get_supabase()
            supabase.table("basis_quotes").insert({
                "tenant_id": tenant_id,
                "spot_venue_id": spot_venue_id,
                "deriv_venue_id": deriv_venue_id,
                "instrument_id": instrument_id,
                "spot_bid": quote.spot_bid,
                "spot_ask": quote.spot_ask,
                "perp_bid": quote.perp_bid,
                "perp_ask": quote.perp_ask,
                "basis_bps": quote.basis_bps_bid,
                "basis_z": quote.basis_z,
                "ts": quote.timestamp.isoformat(),
            }).execute()
        except Exception as exc:
            logger.warning("basis_quote_store_failed", error=str(exc))
