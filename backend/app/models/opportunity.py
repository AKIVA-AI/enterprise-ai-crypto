"""
Opportunity schemas for multi-venue scanning and execution planning.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.domain import OrderSide


class OpportunityType(str, Enum):
    SPOT = "spot"
    FUTURES = "futures"
    ARBITRAGE = "arbitrage"


class ExecutionMode(str, Enum):
    ATOMIC = "atomic"
    LEGGED = "legged"


class ExecutionLeg(BaseModel):
    """Single execution leg for a multi-leg plan."""
    id: UUID = Field(default_factory=uuid4)
    venue: str
    instrument: str
    side: OrderSide
    size: float
    order_type: str = "market"
    limit_price: Optional[float] = None
    max_slippage_bps: Optional[float] = None
    leg_type: Optional[str] = None


class ExecutionPlan(BaseModel):
    """Execution plan for a trade intent."""
    id: UUID = Field(default_factory=uuid4)
    mode: ExecutionMode = ExecutionMode.LEGGED
    legs: List[ExecutionLeg]
    max_leg_slippage_bps: float = 10.0
    max_time_between_legs_ms: int = 1000
    unwind_on_fail: bool = True
    metadata: Dict = Field(default_factory=dict)


class SignalStack(BaseModel):
    """Multi-timeframe signal stack for opportunity reasoning."""
    fast_timeframe: str
    medium_timeframe: str
    slow_timeframe: str
    fast_direction: str
    medium_direction: str
    slow_direction: str
    confidence: float
    expected_edge_bps: float
    explanation: str


class Opportunity(BaseModel):
    """Unified opportunity returned by the scanner."""
    id: UUID = Field(default_factory=uuid4)
    type: OpportunityType
    instrument: str
    direction: OrderSide
    venue: str
    confidence: float = Field(ge=0.0, le=1.0)
    expected_edge_bps: float
    horizon_minutes: int = 60
    data_quality: str = "realtime"
    signal_stack: Optional[SignalStack] = None
    execution_plan: Optional[ExecutionPlan] = None
    explanation: str = ""
    metadata: Dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
