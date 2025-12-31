# Multi-Agent Trading System
# Uses Redis pub/sub for low-latency inter-agent communication

from .base_agent import BaseAgent, AgentMessage, AgentChannel
from .signal_agent import SignalAgent
from .risk_agent import RiskAgent
from .execution_agent import ExecutionAgent
from .agent_orchestrator import AgentOrchestrator

__all__ = [
    'BaseAgent',
    'AgentMessage', 
    'AgentChannel',
    'SignalAgent',
    'RiskAgent',
    'ExecutionAgent',
    'AgentOrchestrator',
]
