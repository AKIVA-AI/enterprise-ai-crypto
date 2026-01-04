"""
Edge and Cost Model - evaluates expected edge vs execution costs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

from app.models.domain import TradeIntent


@dataclass
class EdgeCostBreakdown:
    fee_bps: float
    spread_bps: float
    slippage_bps: float
    latency_bps: float
    funding_bps: float
    basis_bps: float
    total_cost_bps: float


@dataclass
class EdgeCostResult:
    allowed: bool
    reason: str
    expected_edge_bps: float
    min_edge_bps: float
    breakdown: EdgeCostBreakdown


class EdgeCostModel:
    """
    Estimate all-in execution costs and compare to expected edge.
    """

    def __init__(self, min_edge_buffer_bps: float = 10.0):
        self.min_edge_buffer_bps = min_edge_buffer_bps

    def evaluate_intent(
        self,
        intent: TradeIntent,
        market_snapshot: Optional[Dict],
        venue_fees_bps: Optional[Dict[str, float]] = None,
        latency_ms: Optional[int] = None,
    ) -> EdgeCostResult:
        expected_edge_bps = self._estimate_edge_bps(intent)
        spread_bps = float(market_snapshot.get("spread_bps", 5.0)) if market_snapshot else 5.0
        volatility_bps = float(market_snapshot.get("volatility_bps", 15.0)) if market_snapshot else 15.0
        volume_usd = float(market_snapshot.get("volume_24h", 1_000_000)) if market_snapshot else 1_000_000

        fee_bps = self._estimate_fees(intent, venue_fees_bps or {})
        slippage_bps = self._estimate_slippage(
            spread_bps=spread_bps,
            volatility_bps=volatility_bps,
            size_usd=intent.target_exposure_usd,
            volume_usd=volume_usd,
        )
        latency_bps = self._estimate_latency_penalty(latency_ms or 0)
        funding_bps = float(intent.metadata.get("funding_rate_bps", 0.0))
        basis_bps = float(intent.metadata.get("basis_risk_bps", 0.0))

        total_cost_bps = fee_bps + spread_bps + slippage_bps + latency_bps + funding_bps + basis_bps
        min_edge_bps = total_cost_bps + self.min_edge_buffer_bps

        allowed = expected_edge_bps >= min_edge_bps
        reason = "ok" if allowed else (
            f"Expected edge ({expected_edge_bps:.1f} bps) < required minimum ({min_edge_bps:.1f} bps)"
        )

        breakdown = EdgeCostBreakdown(
            fee_bps=fee_bps,
            spread_bps=spread_bps,
            slippage_bps=slippage_bps,
            latency_bps=latency_bps,
            funding_bps=funding_bps,
            basis_bps=basis_bps,
            total_cost_bps=total_cost_bps,
        )

        return EdgeCostResult(
            allowed=allowed,
            reason=reason,
            expected_edge_bps=expected_edge_bps,
            min_edge_bps=min_edge_bps,
            breakdown=breakdown,
        )

    def _estimate_edge_bps(self, intent: TradeIntent) -> float:
        meta = intent.metadata or {}
        for key in ("expected_edge_bps", "edge_bps", "expected_return_bps"):
            if key in meta:
                return float(meta[key])
        return float(intent.confidence) * 100

    def _estimate_fees(self, intent: TradeIntent, venue_fees_bps: Dict[str, float]) -> float:
        meta = intent.metadata or {}
        if "fee_bps" in meta:
            return float(meta["fee_bps"])
        if meta.get("order_style") == "maker":
            return float(venue_fees_bps.get("maker", 5.0))
        return float(venue_fees_bps.get("taker", 10.0))

    def _estimate_slippage(
        self,
        spread_bps: float,
        volatility_bps: float,
        size_usd: float,
        volume_usd: float,
    ) -> float:
        if volume_usd <= 0:
            return min(30.0, spread_bps + volatility_bps)
        liquidity_ratio = size_usd / volume_usd
        impact_bps = min(30.0, liquidity_ratio * 10_000)
        return min(50.0, spread_bps * 0.5 + volatility_bps * 0.25 + impact_bps)

    def _estimate_latency_penalty(self, latency_ms: int) -> float:
        if latency_ms <= 200:
            return 0.0
        return min(10.0, (latency_ms - 200) / 100.0)
