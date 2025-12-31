"""
Base Agent class for the multi-agent trading system.
All agents inherit from this class and communicate via Redis pub/sub.
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from uuid import UUID, uuid4

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class AgentChannel(str, Enum):
    """Redis pub/sub channels for agent communication"""
    MARKET_DATA = "agent:market_data"
    SIGNALS = "agent:signals"
    RISK_CHECK = "agent:risk_check"
    RISK_APPROVED = "agent:risk_approved"
    RISK_REJECTED = "agent:risk_rejected"
    EXECUTION = "agent:execution"
    FILLS = "agent:fills"
    HEARTBEAT = "agent:heartbeat"
    CONTROL = "agent:control"
    ALERTS = "agent:alerts"


@dataclass
class AgentMessage:
    """Standard message format for inter-agent communication"""
    id: str
    timestamp: str
    source_agent: str
    target_agent: Optional[str]
    channel: str
    payload: Dict[str, Any]
    correlation_id: Optional[str] = None
    
    def to_json(self) -> str:
        return json.dumps(asdict(self))
    
    @classmethod
    def from_json(cls, data: str) -> 'AgentMessage':
        parsed = json.loads(data)
        return cls(**parsed)
    
    @classmethod
    def create(
        cls,
        source: str,
        channel: AgentChannel,
        payload: Dict[str, Any],
        target: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> 'AgentMessage':
        return cls(
            id=str(uuid4()),
            timestamp=datetime.utcnow().isoformat(),
            source_agent=source,
            target_agent=target,
            channel=channel.value,
            payload=payload,
            correlation_id=correlation_id or str(uuid4())
        )


class BaseAgent(ABC):
    """
    Base class for all trading agents.
    Provides Redis pub/sub connectivity and message handling.
    """
    
    def __init__(
        self,
        agent_id: str,
        agent_type: str,
        redis_url: str = "redis://localhost:6379",
        subscribed_channels: Optional[List[AgentChannel]] = None
    ):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.redis_url = redis_url
        self.subscribed_channels = subscribed_channels or []
        
        self._redis: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None
        self._running = False
        self._message_handlers: Dict[str, Callable] = {}
        self._metrics = {
            "messages_received": 0,
            "messages_sent": 0,
            "errors": 0,
            "last_heartbeat": None
        }
        
    async def connect(self):
        """Establish Redis connection"""
        try:
            self._redis = redis.from_url(self.redis_url)
            self._pubsub = self._redis.pubsub()
            
            # Subscribe to channels
            if self.subscribed_channels:
                channels = [ch.value for ch in self.subscribed_channels]
                await self._pubsub.subscribe(*channels)
                logger.info(f"[{self.agent_id}] Subscribed to channels: {channels}")
            
            # Always subscribe to control and heartbeat
            await self._pubsub.subscribe(
                AgentChannel.CONTROL.value,
                AgentChannel.HEARTBEAT.value
            )
            
            logger.info(f"[{self.agent_id}] Connected to Redis")
            
        except Exception as e:
            logger.error(f"[{self.agent_id}] Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Clean up Redis connection"""
        self._running = False
        if self._pubsub:
            await self._pubsub.unsubscribe()
            await self._pubsub.close()
        if self._redis:
            await self._redis.close()
        logger.info(f"[{self.agent_id}] Disconnected from Redis")
    
    async def publish(self, channel: AgentChannel, payload: Dict[str, Any], correlation_id: Optional[str] = None):
        """Publish a message to a channel"""
        if not self._redis:
            raise RuntimeError("Not connected to Redis")
        
        message = AgentMessage.create(
            source=self.agent_id,
            channel=channel,
            payload=payload,
            correlation_id=correlation_id
        )
        
        await self._redis.publish(channel.value, message.to_json())
        self._metrics["messages_sent"] += 1
        logger.debug(f"[{self.agent_id}] Published to {channel.value}: {message.id}")
    
    async def send_heartbeat(self):
        """Send heartbeat to indicate agent is alive"""
        await self.publish(
            AgentChannel.HEARTBEAT,
            {
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "status": "online",
                "metrics": self._metrics
            }
        )
        self._metrics["last_heartbeat"] = datetime.utcnow().isoformat()
    
    async def send_alert(self, severity: str, title: str, message: str, metadata: Optional[Dict] = None):
        """Send an alert to the alerts channel"""
        await self.publish(
            AgentChannel.ALERTS,
            {
                "severity": severity,
                "title": title,
                "message": message,
                "metadata": metadata or {}
            }
        )
    
    def register_handler(self, channel: AgentChannel, handler: Callable):
        """Register a message handler for a specific channel"""
        self._message_handlers[channel.value] = handler
    
    async def _process_message(self, raw_message: Dict):
        """Process incoming message from pub/sub"""
        try:
            if raw_message["type"] != "message":
                return
            
            channel = raw_message["channel"]
            if isinstance(channel, bytes):
                channel = channel.decode()
            
            data = raw_message["data"]
            if isinstance(data, bytes):
                data = data.decode()
            
            message = AgentMessage.from_json(data)
            self._metrics["messages_received"] += 1
            
            # Handle control messages
            if channel == AgentChannel.CONTROL.value:
                await self._handle_control(message)
                return
            
            # Call registered handler
            if channel in self._message_handlers:
                await self._message_handlers[channel](message)
            else:
                # Default to abstract handle_message
                await self.handle_message(message)
                
        except Exception as e:
            logger.error(f"[{self.agent_id}] Error processing message: {e}")
            self._metrics["errors"] += 1
    
    async def _handle_control(self, message: AgentMessage):
        """Handle control messages (pause, resume, shutdown)"""
        command = message.payload.get("command")
        
        if command == "shutdown":
            logger.info(f"[{self.agent_id}] Received shutdown command")
            self._running = False
        elif command == "pause":
            logger.info(f"[{self.agent_id}] Received pause command")
            await self.on_pause()
        elif command == "resume":
            logger.info(f"[{self.agent_id}] Received resume command")
            await self.on_resume()
    
    async def run(self):
        """Main agent loop"""
        await self.connect()
        self._running = True
        
        logger.info(f"[{self.agent_id}] Starting agent loop")
        
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        
        try:
            await self.on_start()
            
            while self._running:
                message = await self._pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=0.1
                )
                if message:
                    await self._process_message(message)
                
                # Run agent-specific cycle
                await self.cycle()
                
        except asyncio.CancelledError:
            logger.info(f"[{self.agent_id}] Agent cancelled")
        except Exception as e:
            logger.error(f"[{self.agent_id}] Agent error: {e}")
            await self.send_alert("critical", f"Agent Error: {self.agent_id}", str(e))
        finally:
            heartbeat_task.cancel()
            await self.on_stop()
            await self.disconnect()
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeats"""
        while self._running:
            await self.send_heartbeat()
            await asyncio.sleep(5)
    
    # Abstract methods to be implemented by subclasses
    
    @abstractmethod
    async def handle_message(self, message: AgentMessage):
        """Handle incoming message"""
        pass
    
    @abstractmethod
    async def cycle(self):
        """Run one agent cycle"""
        pass
    
    async def on_start(self):
        """Called when agent starts"""
        pass
    
    async def on_stop(self):
        """Called when agent stops"""
        pass
    
    async def on_pause(self):
        """Called when agent is paused"""
        pass
    
    async def on_resume(self):
        """Called when agent resumes"""
        pass
