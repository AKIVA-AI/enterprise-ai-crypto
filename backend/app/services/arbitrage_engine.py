"""
Arbitrage Engine - generates arbitrage opportunities and execution plans.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import structlog

from app.models.domain import OrderSide
from app.models.opportunity import ExecutionLeg, ExecutionMode, ExecutionPlan, Opportunity, OpportunityType

logger = structlog.get_logger()


class ArbitrageEngine:
    """Opportunity generator for cross-venue and basis arbitrage."""

    def __init__(self, price_provider=None):
        self._price_provider = price_provider

    async def scan_cross_venue(
        self,
        instrument: str,
        venues: List[str],
        min_profit_bps: float = 5.0,
        max_leg_slippage_bps: float = 10.0,
        max_time_between_legs_ms: int = 1000,
    ) -> List[Opportunity]:
        opportunities = []
        if len(venues) < 2:
            return opportunities

        quotes = await self._get_quotes(instrument, venues)
        if not quotes:
            return opportunities

        for buy_venue in venues:
            for sell_venue in venues:
                if buy_venue == sell_venue:
                    continue
                buy_quote = quotes.get(buy_venue)
                sell_quote = quotes.get(sell_venue)
                if not buy_quote or not sell_quote:
                    continue
                buy_ask = buy_quote.get("ask")
                sell_bid = sell_quote.get("bid")
                if not buy_ask or not sell_bid:
                    continue
                profit_bps = (sell_bid - buy_ask) / buy_ask * 10000
                if profit_bps < min_profit_bps:
                    continue

                plan = ExecutionPlan(
                    mode=ExecutionMode.LEGGED,
                    legs=[
                        ExecutionLeg(
                            venue=buy_venue,
                            instrument=instrument,
                            side=OrderSide.BUY,
                            size=0.0,
                            max_slippage_bps=max_leg_slippage_bps,
                        ),
                        ExecutionLeg(
                            venue=sell_venue,
                            instrument=instrument,
                            side=OrderSide.SELL,
                            size=0.0,
                            max_slippage_bps=max_leg_slippage_bps,
                        ),
                    ],
                    max_leg_slippage_bps=max_leg_slippage_bps,
                    max_time_between_legs_ms=max_time_between_legs_ms,
                    unwind_on_fail=True,
                    metadata={"type": "cross_venue"},
                )

                opportunities.append(
                    Opportunity(
                        type=OpportunityType.ARBITRAGE,
                        instrument=instrument,
                        direction=OrderSide.BUY,
                        venue=buy_venue,
                        confidence=min(1.0, profit_bps / 50.0),
                        expected_edge_bps=profit_bps,
                        horizon_minutes=5,
                        execution_plan=plan,
                        explanation=f"Cross-venue spread {profit_bps:.1f} bps",
                        metadata={
                            "sell_venue": sell_venue,
                            "profit_bps": profit_bps,
                            "mode": "cross_venue",
                        },
                    )
                )

        return opportunities

    async def scan_basis(
        self,
        spot_instrument: str,
        perp_instrument: str,
        venues: List[str],
        min_profit_bps: float = 8.0,
    ) -> List[Opportunity]:
        opportunities = []
        if not venues:
            return opportunities

        quotes = await self._get_quotes(spot_instrument, venues)
        perp_quotes = await self._get_quotes(perp_instrument, venues)
        if not quotes or not perp_quotes:
            return opportunities

        for venue in venues:
            spot_quote = quotes.get(venue)
            perp_quote = perp_quotes.get(venue)
            if not spot_quote or not perp_quote:
                continue
            spot_price = spot_quote.get("mid")
            perp_price = perp_quote.get("mid")
            if not spot_price or not perp_price:
                continue
            basis_bps = (perp_price - spot_price) / spot_price * 10000
            if abs(basis_bps) < min_profit_bps:
                continue

            direction = OrderSide.BUY if basis_bps > 0 else OrderSide.SELL
            opportunities.append(
                Opportunity(
                    type=OpportunityType.ARBITRAGE,
                    instrument=spot_instrument,
                    direction=direction,
                    venue=venue,
                    confidence=min(1.0, abs(basis_bps) / 50.0),
                    expected_edge_bps=abs(basis_bps),
                    horizon_minutes=60,
                    explanation=f"Basis {basis_bps:.1f} bps between spot/perp",
                    metadata={
                        "perp_instrument": perp_instrument,
                        "basis_bps": basis_bps,
                        "mode": "basis",
                    },
                )
            )

        return opportunities

    async def _get_quotes(self, instrument: str, venues: List[str]) -> Dict[str, Dict]:
        quotes = {}
        for venue in venues:
            quote = None
            if self._price_provider:
                quote = await self._price_provider(venue, instrument)
            if quote:
                quotes[venue] = quote
        return quotes
