"""
Spot Arbitrage Edge Model - net edge after fees and buffers.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class SpotArbEdgeInputs:
    buy_fee_bps: float
    sell_fee_bps: float
    slippage_buffer_bps: float
    latency_risk_buffer_bps: float


@dataclass
class SpotArbEdgeResult:
    net_edge_bps: float
    executable_spread_bps: float
    inputs: SpotArbEdgeInputs


@dataclass
class SpotArbEdgeConfig:
    slippage_buffer_bps: float = 8.0
    latency_risk_buffer_bps: float = 3.0
    default_fee_bps: float = 10.0


class SpotArbEdgeModel:
    """Compute net edge for spot arbitrage."""

    def __init__(self, config: Optional[SpotArbEdgeConfig] = None):
        self.config = config or SpotArbEdgeConfig()

    def compute(
        self,
        buy_ask: float,
        sell_bid: float,
        buy_fee_bps: Optional[float] = None,
        sell_fee_bps: Optional[float] = None,
        slippage_buffer_bps: Optional[float] = None,
        latency_risk_buffer_bps: Optional[float] = None,
    ) -> SpotArbEdgeResult:
        executable_spread_bps = (sell_bid / buy_ask - 1) * 10000
        buy_fee_bps = buy_fee_bps if buy_fee_bps is not None else self.config.default_fee_bps
        sell_fee_bps = sell_fee_bps if sell_fee_bps is not None else self.config.default_fee_bps
        slippage_buffer_bps = (
            slippage_buffer_bps if slippage_buffer_bps is not None else self.config.slippage_buffer_bps
        )
        latency_risk_buffer_bps = (
            latency_risk_buffer_bps
            if latency_risk_buffer_bps is not None
            else self.config.latency_risk_buffer_bps
        )

        net_edge_bps = (
            executable_spread_bps
            - buy_fee_bps
            - sell_fee_bps
            - slippage_buffer_bps
            - latency_risk_buffer_bps
        )

        return SpotArbEdgeResult(
            net_edge_bps=net_edge_bps,
            executable_spread_bps=executable_spread_bps,
            inputs=SpotArbEdgeInputs(
                buy_fee_bps=buy_fee_bps,
                sell_fee_bps=sell_fee_bps,
                slippage_buffer_bps=slippage_buffer_bps,
                latency_risk_buffer_bps=latency_risk_buffer_bps,
            ),
        )
