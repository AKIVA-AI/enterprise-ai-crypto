"""
Execution Agent - Handles order routing and execution.
Receives risk-approved signals and executes them on venues.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from .base_agent import BaseAgent, AgentChannel, AgentMessage

logger = logging.getLogger(__name__)


class ExecutionAgent(BaseAgent):
    """
    Execution agent that routes orders to venues,
    manages order lifecycle, and reports fills.
    """
    
    def __init__(
        self,
        agent_id: str = "execution-agent-01",
        redis_url: str = "redis://localhost:6379",
        venues: Optional[List[str]] = None
    ):
        super().__init__(
            agent_id=agent_id,
            agent_type="execution",
            redis_url=redis_url,
            subscribed_channels=[AgentChannel.RISK_APPROVED, AgentChannel.EXECUTION]
        )
        
        self.venues = venues or ["coinbase", "binance", "kraken"]
        
        # Order tracking
        self._pending_orders: Dict[str, Dict] = {}
        self._order_history: List[Dict] = []
        
        # Execution config
        self._execution_config = {
            "default_slippage_tolerance": 0.002,  # 0.2%
            "max_retries": 3,
            "retry_delay_ms": 100,
            "use_twap": False,
            "twap_duration_minutes": 5,
            "prefer_maker": True
        }
        
        # Venue status
        self._venue_status = {venue: "healthy" for venue in self.venues}
        
        # Execution metrics
        self._metrics = {
            "orders_received": 0,
            "orders_filled": 0,
            "orders_failed": 0,
            "total_volume_usd": 0,
            "avg_slippage": 0,
            "avg_latency_ms": 0
        }
        
        self._paused = False
    
    async def handle_message(self, message: AgentMessage):
        """Process risk-approved signals and execution commands"""
        if message.channel == AgentChannel.RISK_APPROVED.value:
            await self._process_approved_signal(message)
        elif message.channel == AgentChannel.EXECUTION.value:
            await self._process_execution_command(message)
    
    async def _process_approved_signal(self, message: AgentMessage):
        """Execute a risk-approved trade"""
        self._metrics["orders_received"] += 1
        
        payload = message.payload
        signal = payload.get("signal", {})
        adjusted_size = payload.get("adjusted_size", signal.get("target_exposure_usd"))
        
        logger.info(
            f"[{self.agent_id}] Executing approved signal: "
            f"{signal.get('direction')} {signal.get('instrument')} ${adjusted_size}"
        )
        
        if self._paused:
            logger.warning(f"[{self.agent_id}] Execution paused, skipping order")
            return
        
        # Create order
        order = await self._create_order(signal, adjusted_size, message.correlation_id)
        
        # Select best venue
        venue = await self._select_venue(signal.get("instrument"), adjusted_size)
        
        # Execute order
        result = await self._execute_order(order, venue)
        
        if result["success"]:
            self._metrics["orders_filled"] += 1
            self._metrics["total_volume_usd"] += adjusted_size
            await self._report_fill(order, result, venue)
        else:
            self._metrics["orders_failed"] += 1
            await self._report_failure(order, result, venue)
    
    async def _create_order(
        self,
        signal: Dict,
        size_usd: float,
        correlation_id: Optional[str]
    ) -> Dict:
        """Create order from signal"""
        order_id = str(uuid4())
        price = signal.get("entry_price", 0)
        
        # Calculate size in base asset
        size_base = size_usd / price if price > 0 else 0
        
        order = {
            "id": order_id,
            "correlation_id": correlation_id,
            "instrument": signal.get("instrument"),
            "side": signal.get("direction"),
            "type": "limit" if self._execution_config["prefer_maker"] else "market",
            "size_usd": size_usd,
            "size_base": size_base,
            "limit_price": price,
            "stop_loss": price * (1 - signal.get("stop_loss_pct", 0.02)),
            "take_profit": price * (1 + signal.get("take_profit_pct", 0.04)),
            "strategy": signal.get("strategy"),
            "created_at": datetime.utcnow().isoformat(),
            "status": "pending"
        }
        
        self._pending_orders[order_id] = order
        return order
    
    async def _select_venue(self, instrument: str, size_usd: float) -> str:
        """Select optimal venue for execution"""
        # In production, this would consider:
        # - Order book depth
        # - Fees
        # - Latency
        # - Current venue health
        
        healthy_venues = [
            v for v in self.venues
            if self._venue_status.get(v) == "healthy"
        ]
        
        if not healthy_venues:
            logger.warning(f"[{self.agent_id}] No healthy venues available")
            return self.venues[0]  # Fallback to first venue
        
        # Prefer Coinbase for this example
        if "coinbase" in healthy_venues:
            return "coinbase"
        
        return healthy_venues[0]
    
    async def _execute_order(self, order: Dict, venue: str) -> Dict:
        """Execute order on venue"""
        start_time = datetime.utcnow()
        
        # Simulated execution (would call actual venue adapter in production)
        # This is where you'd integrate with the Coinbase adapter
        
        try:
            # Simulate execution latency
            await asyncio.sleep(0.05)  # 50ms simulated latency
            
            # Simulate fill with slight slippage
            import random
            slippage = random.uniform(-0.001, 0.002)  # -0.1% to +0.2%
            
            filled_price = order["limit_price"] * (1 + slippage)
            
            # Update latency metric
            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._update_latency_metric(latency_ms)
            self._update_slippage_metric(slippage)
            
            return {
                "success": True,
                "order_id": order["id"],
                "venue_order_id": f"{venue}_{uuid4().hex[:8]}",
                "filled_price": filled_price,
                "filled_size": order["size_base"],
                "slippage": slippage,
                "latency_ms": latency_ms,
                "fee": order["size_usd"] * 0.001,  # 0.1% fee
                "executed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"[{self.agent_id}] Execution error: {e}")
            return {
                "success": False,
                "order_id": order["id"],
                "error": str(e),
                "retryable": True
            }
    
    async def _report_fill(self, order: Dict, result: Dict, venue: str):
        """Report fill to risk agent and update tracking"""
        order["status"] = "filled"
        order["filled_price"] = result["filled_price"]
        order["filled_at"] = result["executed_at"]
        order["venue"] = venue
        
        # Move to history
        if order["id"] in self._pending_orders:
            del self._pending_orders[order["id"]]
        self._order_history.append(order)
        
        # Publish fill event
        await self.publish(
            AgentChannel.FILLS,
            {
                "type": "fill",
                "order_id": order["id"],
                "instrument": order["instrument"],
                "side": order["side"],
                "size_usd": order["size_usd"],
                "filled_price": result["filled_price"],
                "slippage": result["slippage"],
                "fee": result["fee"],
                "venue": venue,
                "pnl": 0,  # No realized P&L on entry
                "executed_at": result["executed_at"]
            },
            correlation_id=order.get("correlation_id")
        )
        
        logger.info(
            f"[{self.agent_id}] Order filled: {order['side']} {order['instrument']} "
            f"@ {result['filled_price']:.2f} (slippage: {result['slippage']*100:.3f}%)"
        )
    
    async def _report_failure(self, order: Dict, result: Dict, venue: str):
        """Report execution failure"""
        order["status"] = "failed"
        order["error"] = result.get("error")
        
        # Send alert
        await self.send_alert(
            "warning",
            f"Order Execution Failed: {order['instrument']}",
            result.get("error", "Unknown error"),
            {"order_id": order["id"], "venue": venue}
        )
        
        logger.error(
            f"[{self.agent_id}] Order failed: {order['id']} - {result.get('error')}"
        )
    
    async def _process_execution_command(self, message: AgentMessage):
        """Handle execution commands (cancel, modify, etc.)"""
        command = message.payload.get("command")
        order_id = message.payload.get("order_id")
        
        if command == "cancel":
            await self._cancel_order(order_id)
        elif command == "cancel_all":
            await self._cancel_all_orders()
    
    async def _cancel_order(self, order_id: str):
        """Cancel a pending order"""
        if order_id in self._pending_orders:
            order = self._pending_orders.pop(order_id)
            order["status"] = "cancelled"
            self._order_history.append(order)
            logger.info(f"[{self.agent_id}] Order cancelled: {order_id}")
    
    async def _cancel_all_orders(self):
        """Cancel all pending orders"""
        for order_id in list(self._pending_orders.keys()):
            await self._cancel_order(order_id)
        logger.warning(f"[{self.agent_id}] All pending orders cancelled")
    
    def _update_latency_metric(self, latency_ms: float):
        """Update rolling average latency"""
        current = self._metrics["avg_latency_ms"]
        count = self._metrics["orders_filled"]
        if count > 0:
            self._metrics["avg_latency_ms"] = (current * (count - 1) + latency_ms) / count
        else:
            self._metrics["avg_latency_ms"] = latency_ms
    
    def _update_slippage_metric(self, slippage: float):
        """Update rolling average slippage"""
        current = self._metrics["avg_slippage"]
        count = self._metrics["orders_filled"]
        if count > 0:
            self._metrics["avg_slippage"] = (current * (count - 1) + slippage) / count
        else:
            self._metrics["avg_slippage"] = slippage
    
    async def cycle(self):
        """Execution monitoring cycle"""
        # Check pending orders for timeouts
        # Monitor venue health
        # Update order book snapshots
        
        await asyncio.sleep(0.1)  # 100ms cycle
    
    async def on_start(self):
        """Initialize execution agent"""
        logger.info(f"[{self.agent_id}] Execution agent starting with venues: {self.venues}")
    
    async def on_pause(self):
        """Pause execution"""
        self._paused = True
        logger.warning(f"[{self.agent_id}] Execution PAUSED - cancelling pending orders")
        await self._cancel_all_orders()
    
    async def on_resume(self):
        """Resume execution"""
        self._paused = False
        logger.info(f"[{self.agent_id}] Execution resumed")
