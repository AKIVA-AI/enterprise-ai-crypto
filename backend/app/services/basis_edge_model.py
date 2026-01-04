"""
Basis Edge Model - expected return net of costs for cash-and-carry.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

from app.models.basis import BasisEdgeInputs, BasisEdgeResult


@dataclass
class BasisEdgeConfig:
    latency_buffer_bps: float = 2.0
    unwind_risk_buffer_bps: float = 5.0
    default_slippage_bps: float = 8.0
    default_fee_bps: float = 10.0
    basis_convergence_weight: float = 0.4


class BasisEdgeModel:
    """Compute expected return net of costs for a basis trade."""

    def __init__(self, config: Optional[BasisEdgeConfig] = None):
        self.config = config or BasisEdgeConfig()

    def compute_expected_return(
        self,
        expected_funding_bps: float,
        basis_bps_mid: float,
        fee_bps: Optional[float] = None,
        slippage_bps: Optional[float] = None,
        latency_buffer_bps: Optional[float] = None,
        unwind_risk_buffer_bps: Optional[float] = None,
    ) -> BasisEdgeResult:
        fee_bps = fee_bps if fee_bps is not None else self.config.default_fee_bps
        slippage_bps = slippage_bps if slippage_bps is not None else self.config.default_slippage_bps
        latency_buffer_bps = latency_buffer_bps if latency_buffer_bps is not None else self.config.latency_buffer_bps
        unwind_risk_buffer_bps = (
            unwind_risk_buffer_bps if unwind_risk_buffer_bps is not None else self.config.unwind_risk_buffer_bps
        )

        expected_basis_convergence_bps = basis_bps_mid * self.config.basis_convergence_weight

        expected_return_bps = (
            expected_funding_bps
            + expected_basis_convergence_bps
            - fee_bps
            - slippage_bps
            - latency_buffer_bps
            - unwind_risk_buffer_bps
        )

        return BasisEdgeResult(
            expected_return_bps=expected_return_bps,
            inputs=BasisEdgeInputs(
                expected_funding_bps=expected_funding_bps,
                expected_basis_convergence_bps=expected_basis_convergence_bps,
                fee_bps=fee_bps,
                slippage_bps=slippage_bps,
                latency_buffer_bps=latency_buffer_bps,
                unwind_risk_buffer_bps=unwind_risk_buffer_bps,
            ),
        )
