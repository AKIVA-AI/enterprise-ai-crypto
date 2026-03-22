# ADR-001: Event-Driven Agent Communication

**Status:** Accepted
**Date:** 2026-01-15
**Decision Makers:** Platform Architecture Team

## Context

The Enterprise Crypto platform uses a multi-agent architecture with 10+ autonomous agents (strategy, risk, execution, capital allocation, meta-decision, etc.). Each agent has distinct responsibilities and must communicate decisions, signals, and control messages in near real-time.

We evaluated two primary communication patterns:

1. **Request-Response (synchronous):** Each agent calls another agent's API endpoint directly and waits for a response before proceeding.
2. **Event-Driven (pub/sub via Redis):** Agents publish events to named channels and subscribe to channels relevant to their role. No direct coupling between agents.

Key requirements:
- Sub-second latency for trading decisions
- Agents must operate independently (one agent crash must not cascade)
- Full auditability of every decision in the chain
- Support for fan-out (one signal consumed by multiple agents)
- Graceful degradation when agents are offline

## Decision

We chose **event-driven communication via Redis pub/sub** with message queue fallback.

Agents communicate through named Redis channels:
- `agent:signals` -- strategy signals
- `agent:risk_check` -- pre-trade risk validation requests
- `agent:risk_approved` -- approved trades
- `agent:execution` -- execution orders
- `agent:fills` -- fill confirmations
- `agent:control` -- pause/resume/shutdown commands
- `agent:heartbeat` -- liveness monitoring

Each agent extends `BaseAgent`, which provides:
- Redis pub/sub with automatic reconnection (exponential backoff 1s to 30s)
- In-memory message queue fallback (max 1000 messages) when Redis is unavailable
- Supabase heartbeat writes every 30s (CPU, memory, status)
- Control channel subscription for lifecycle management

## Consequences

**Positive:**
- Agents are fully decoupled; adding a new agent requires zero changes to existing agents
- Natural fan-out: a single signal can trigger risk check, audit logging, and dashboard update simultaneously
- Agents survive peer failures; the risk agent crashing does not kill the strategy agent
- Message queue fallback provides resilience during Redis reconnection
- Every published message is a structured event, creating a natural audit trail
- Latency is consistently under 5ms for channel delivery

**Negative:**
- Debugging distributed flows requires correlation IDs and structured logging (implemented via `X-Request-ID` binding)
- Message ordering is not globally guaranteed across channels (acceptable for our use case since each flow follows a defined channel sequence)
- Redis is a single point of failure for real-time communication (mitigated by in-memory fallback queue)
- Testing requires Redis mocks or an integration test environment

**Risks Accepted:**
- If Redis is down for > 30 seconds, the in-memory queue (1000 messages) may overflow; agents will log dropped messages and resume when reconnected
