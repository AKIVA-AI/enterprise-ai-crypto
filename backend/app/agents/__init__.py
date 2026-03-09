# Multi-Agent Trading System
# Uses Redis pub/sub for low-latency inter-agent communication

from .base_agent import BaseAgent, AgentMessage, AgentChannel
from .signal_agent import SignalAgent
from .risk_agent import RiskAgent
from .execution_agent import ExecutionAgent
from .agent_orchestrator import AgentOrchestrator
from .freqtrade_signal_agent import FreqTradeSignalAgent
from .meta_decision_agent import MetaDecisionAgent
from .capital_allocation_agent import CapitalAllocationAgent
from .arbitrage_agent import ArbitrageAgent

__all__ = [
    "BaseAgent",
    "AgentMessage",
    "AgentChannel",
    "SignalAgent",
    "RiskAgent",
    "ExecutionAgent",
    "AgentOrchestrator",
    "FreqTradeSignalAgent",
    "MetaDecisionAgent",
    "CapitalAllocationAgent",
    "ArbitrageAgent",
]
