"""
Basis arbitrage models.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional


@dataclass
class BasisQuote:
    instrument: str
    spot_venue: str
    deriv_venue: str
    spot_bid: float
    spot_ask: float
    perp_bid: float
    perp_ask: float
    basis_bps_mid: float
    basis_bps_bid: float
    basis_bps_ask: float
    basis_z: float
    timestamp: datetime
    metadata: Dict[str, float]


@dataclass
class BasisEdgeInputs:
    expected_funding_bps: float
    expected_basis_convergence_bps: float
    fee_bps: float
    slippage_bps: float
    latency_buffer_bps: float
    unwind_risk_buffer_bps: float


@dataclass
class BasisEdgeResult:
    expected_return_bps: float
    inputs: BasisEdgeInputs


@dataclass
class BasisHedgePolicy:
    target_hedged_ratio: float = 1.0
    tolerance_min: float = 0.98
    tolerance_max: float = 1.02
    max_time_between_legs_ms: int = 1500
    max_leg_slippage_bps: float = 15.0
    unwind_on_fail: bool = True
