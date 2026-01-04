"""
Order simulator with slippage and fees.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID, uuid4


@dataclass
class OrderFill:
    """Represents a fill event."""
    quantity: float
    price: float
    fee: float
    timestamp: datetime


@dataclass
class Order:
    """Order representation."""
    id: UUID
    instrument: str
    side: str  # 'buy' or 'sell'
    order_type: str  # 'market', 'limit', 'stop'
    quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    status: str = "new"
    filled_quantity: float = 0.0
    avg_fill_price: float = 0.0
    fees: float = 0.0
    fills: List[OrderFill] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class OrderSimulator:
    """Simulate order execution with slippage and fees."""

    def __init__(self, slippage_bps: float = 5.0, fee_bps: float = 10.0) -> None:
        self.slippage_bps = slippage_bps
        self.fee_bps = fee_bps
        self._orders: Dict[UUID, Order] = {}

    def submit_order(
        self,
        instrument: str,
        side: str,
        order_type: str,
        quantity: float,
        limit_price: Optional[float] = None,
        stop_price: Optional[float] = None,
    ) -> Order:
        """Create and register a new order."""
        if side not in ("buy", "sell"):
            raise ValueError("Order side must be 'buy' or 'sell'")
        if order_type not in ("market", "limit", "stop"):
            raise ValueError("Order type must be 'market', 'limit', or 'stop'")
        if order_type == "limit" and limit_price is None:
            raise ValueError("Limit orders require limit_price")
        if order_type == "stop" and stop_price is None:
            raise ValueError("Stop orders require stop_price")

        order = Order(
            id=uuid4(),
            instrument=instrument,
            side=side,
            order_type=order_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
        )
        self._orders[order.id] = order
        return order

    def process_order(
        self,
        order_id: UUID,
        market_price: float,
        liquidity: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ) -> Order:
        """
        Process an order using current market price.

        Args:
            order_id: Identifier of order to process.
            market_price: Current market price.
            liquidity: Optional available quantity for partial fills.
        """
        if order_id not in self._orders:
            raise ValueError("Order not found")

        order = self._orders[order_id]
        timestamp = timestamp or datetime.now(timezone.utc)

        remaining = order.quantity - order.filled_quantity
        if remaining <= 0:
            return order

        fill_qty = remaining
        if liquidity is not None:
            fill_qty = min(remaining, max(liquidity, 0.0))
            if fill_qty <= 0:
                return order

        effective_price = self._apply_slippage(order.side, market_price)

        if order.order_type == "limit":
            if not self._limit_fill_allowed(order.side, effective_price, order.limit_price):
                return order
            fill_price = self._limit_fill_price(order.side, effective_price, order.limit_price)
        elif order.order_type == "stop":
            if not self._stop_triggered(order.side, market_price, order.stop_price):
                return order
            fill_price = effective_price
        else:
            fill_price = effective_price

        fee = fill_price * fill_qty * (self.fee_bps / 10000)

        order.fills.append(
            OrderFill(
                quantity=fill_qty,
                price=fill_price,
                fee=fee,
                timestamp=timestamp,
            )
        )
        order.fees += fee
        order.filled_quantity += fill_qty
        order.avg_fill_price = self._weighted_avg_fill(order)

        if order.filled_quantity >= order.quantity:
            order.status = "filled"
        else:
            order.status = "partially_filled"

        return order

    def get_order(self, order_id: UUID) -> Optional[Order]:
        """Retrieve order by ID."""
        return self._orders.get(order_id)

    def list_orders(self) -> List[Order]:
        """Return all orders."""
        return list(self._orders.values())

    def clear(self) -> None:
        """Clear all orders (useful for tests)."""
        self._orders.clear()

    def _apply_slippage(self, side: str, market_price: float) -> float:
        slippage = market_price * (self.slippage_bps / 10000)
        return market_price + slippage if side == "buy" else market_price - slippage

    @staticmethod
    def _limit_fill_allowed(side: str, effective_price: float, limit_price: Optional[float]) -> bool:
        if limit_price is None:
            return False
        if side == "buy":
            return effective_price <= limit_price
        return effective_price >= limit_price

    @staticmethod
    def _limit_fill_price(side: str, effective_price: float, limit_price: Optional[float]) -> float:
        if limit_price is None:
            return effective_price
        if side == "buy":
            return min(limit_price, effective_price)
        return max(limit_price, effective_price)

    @staticmethod
    def _stop_triggered(side: str, market_price: float, stop_price: Optional[float]) -> bool:
        if stop_price is None:
            return False
        if side == "buy":
            return market_price >= stop_price
        return market_price <= stop_price

    @staticmethod
    def _weighted_avg_fill(order: Order) -> float:
        total_qty = sum(fill.quantity for fill in order.fills)
        if total_qty <= 0:
            return 0.0
        total_value = sum(fill.quantity * fill.price for fill in order.fills)
        return total_value / total_qty
