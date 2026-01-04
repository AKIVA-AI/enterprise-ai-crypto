"""
Position manager for tracking open and closed positions.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID, uuid4


@dataclass
class Position:
    """Position representation."""
    id: UUID
    instrument: str
    side: str  # 'long' or 'short'
    size: float
    entry_price: float
    entry_time: datetime
    entry_fees: float = 0.0
    exit_price: Optional[float] = None
    exit_time: Optional[datetime] = None
    exit_fees: float = 0.0
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    status: str = "open"


class PositionManager:
    """Tracks open and closed positions during a backtest."""

    def __init__(self) -> None:
        self._open_positions: Dict[UUID, Position] = {}
        self._closed_positions: List[Position] = []

    def open_position(
        self,
        instrument: str,
        side: str,
        size: float,
        entry_price: float,
        entry_time: datetime,
        entry_fees: float = 0.0,
    ) -> Position:
        """
        Open a new position.

        Returns:
            The created Position.
        """
        if side not in ("long", "short"):
            raise ValueError("Position side must be 'long' or 'short'")

        position = Position(
            id=uuid4(),
            instrument=instrument,
            side=side,
            size=size,
            entry_price=entry_price,
            entry_time=entry_time,
            entry_fees=entry_fees,
        )
        self._open_positions[position.id] = position
        return position

    def close_position(
        self,
        position_id: UUID,
        exit_price: float,
        exit_time: datetime,
        exit_fees: float = 0.0,
    ) -> Position:
        """
        Close an open position and calculate P&L.

        Returns:
            The closed Position.
        """
        if position_id not in self._open_positions:
            raise ValueError("Position not found")

        position = self._open_positions.pop(position_id)
        position.exit_price = exit_price
        position.exit_time = exit_time
        position.exit_fees = exit_fees

        if position.side == "long":
            gross_pnl = (exit_price - position.entry_price) * position.size
        else:
            gross_pnl = (position.entry_price - exit_price) * position.size

        net_pnl = gross_pnl - position.entry_fees - exit_fees
        position.pnl = net_pnl

        denom = position.entry_price * position.size
        position.pnl_percent = net_pnl / denom if denom else 0.0
        position.status = "closed"

        self._closed_positions.append(position)
        return position

    def get_positions(self, include_closed: bool = True) -> Dict[str, List[Position]]:
        """
        Return tracked positions.

        Args:
            include_closed: Include closed positions in response.
        """
        data = {
            "open": list(self._open_positions.values()),
        }
        if include_closed:
            data["closed"] = list(self._closed_positions)
        return data

    def clear(self) -> None:
        """Clear tracked positions (useful for tests)."""
        self._open_positions.clear()
        self._closed_positions.clear()
