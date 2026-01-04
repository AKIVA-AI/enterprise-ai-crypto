"""
Regime Detection Service - classifies market regime for allocator.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime
from typing import Deque, Dict, Optional

import structlog

from app.config import settings
from app.database import get_supabase
from app.services.market_data import market_data_service

logger = structlog.get_logger()


@dataclass
class RegimeState:
    direction: str
    volatility: str
    liquidity: str
    risk_bias: str
    details: Dict


class RegimeDetectionService:
    """Detects directional, volatility, and liquidity regimes."""

    def __init__(self, max_samples: int = 60):
        self._price_history: Dict[str, Deque[float]] = {
            "BTC-USD": deque(maxlen=max_samples),
            "ETH-USD": deque(maxlen=max_samples),
        }

    async def detect(self, venue: str = "coinbase") -> RegimeState:
        btc_price = await self._get_price(venue, "BTC-USD")
        eth_price = await self._get_price(venue, "ETH-USD")

        direction = self._directional_regime(btc_price)
        volatility = self._volatility_regime()
        liquidity = await self._liquidity_regime()
        risk_bias = self._risk_bias(direction, volatility, liquidity)

        state = RegimeState(
            direction=direction,
            volatility=volatility,
            liquidity=liquidity,
            risk_bias=risk_bias,
            details={
                "btc_price": btc_price,
                "eth_price": eth_price,
            },
        )

        await self._store_regime(state)
        return state

    async def _get_price(self, venue: str, instrument: str) -> Optional[float]:
        data = await market_data_service.get_price(venue, instrument)
        if not data:
            return None
        price = data.get("last") or data.get("mid") or data.get("bid")
        if price:
            self._price_history[instrument].append(float(price))
            return float(price)
        return None

    def _directional_regime(self, btc_price: Optional[float]) -> str:
        series = self._price_history["BTC-USD"]
        if len(series) < 10:
            return "range_bound"
        start = series[0]
        end = series[-1]
        change_pct = (end - start) / start if start else 0
        if change_pct > 0.02:
            return "trending_up"
        if change_pct < -0.02:
            return "trending_down"
        return "range_bound"

    def _volatility_regime(self) -> str:
        series = self._price_history["BTC-USD"]
        if len(series) < 10:
            return "medium_vol"
        returns = [
            (series[i] - series[i - 1]) / series[i - 1]
            for i in range(1, len(series))
            if series[i - 1]
        ]
        if not returns:
            return "medium_vol"
        vol = (sum(r * r for r in returns) / len(returns)) ** 0.5
        if vol > 0.02:
            return "high_vol"
        if vol < 0.005:
            return "low_vol"
        return "medium_vol"

    async def _liquidity_regime(self) -> str:
        try:
            supabase = get_supabase()
            result = supabase.table("arb_spreads").select("liquidity_score").order(
                "ts", desc=True
            ).limit(20).execute()
            if result.data:
                avg_liquidity = sum(row["liquidity_score"] for row in result.data) / len(result.data)
                if avg_liquidity > 10:
                    return "deep_liquidity"
                if avg_liquidity < 1:
                    return "thin"
            return "normal"
        except Exception as exc:
            logger.warning("liquidity_regime_failed", error=str(exc))
            return "normal"

    def _risk_bias(self, direction: str, volatility: str, liquidity: str) -> str:
        if volatility == "high_vol" or liquidity == "thin":
            return "risk_off"
        if direction in ("trending_up", "trending_down") and volatility != "high_vol":
            return "risk_on"
        return "neutral"

    async def _store_regime(self, state: RegimeState) -> None:
        tenant_id = settings.tenant_id
        if not tenant_id:
            return
        try:
            supabase = get_supabase()
            supabase.table("market_regimes").insert({
                "tenant_id": tenant_id,
                "direction": state.direction,
                "volatility": state.volatility,
                "liquidity": state.liquidity,
                "risk_bias": state.risk_bias,
                "regime_state": state.details,
                "ts": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as exc:
            logger.warning("regime_store_failed", error=str(exc))


regime_detection_service = RegimeDetectionService()
