# ADR-003: Centralized Risk Engine with Per-Strategy Limits

**Status:** Accepted
**Date:** 2026-02-01
**Decision Makers:** Platform Architecture Team, Risk Management Lead

## Context

The Enterprise Crypto platform executes multiple trading strategies simultaneously across multiple exchanges. Each strategy has different risk characteristics (trend following vs. mean reversion vs. arbitrage), and each trading book has its own capital allocation and drawdown limits.

We needed to decide how to structure risk management:

1. **Distributed risk (per-strategy):** Each strategy agent embeds its own risk logic and enforces its own limits independently.
2. **Centralized risk engine:** A single risk engine validates all trades before execution, with per-strategy and per-book parameterization.
3. **Hybrid:** Strategy agents do basic checks; a central engine does final validation.

Key requirements:
- No trade executes without risk validation (fail-closed)
- Kill switch must halt all trading instantly across all strategies
- Circuit breakers must trigger automatically on P&L breaches
- Risk limits must be adjustable per-book and per-strategy without code changes
- Full audit trail of every risk decision

## Decision

We chose a **centralized risk engine** (`backend/app/services/risk_engine.py` and `advanced_risk_engine.py`) with per-strategy limits stored in the database.

Architecture:
- **Pre-trade validation:** Every order passes through the Risk Agent before reaching the Execution Agent. The Risk Agent calls the centralized risk engine, which checks: kill switch state, circuit breaker status, position limits, daily loss limits, drawdown limits, exposure limits, and velocity limits.
- **Per-book configuration:** Risk limits are stored in the `risk_limits` table with foreign keys to `books`. Each book has its own max drawdown, position limits, and daily loss thresholds.
- **Kill switch:** A global flag in `global_settings` that, when activated, blocks all new orders instantly. Enforced at both the API level (middleware) and the database level (edge function checks).
- **Circuit breakers:** PostgreSQL triggers on the `positions` and fill events tables automatically check daily P&L and freeze books when limits are breached. This runs at the database layer so it cannot be bypassed by application code.
- **Advanced risk analytics:** `advanced_risk_engine.py` provides VaR (historical, parametric, Monte Carlo), portfolio optimization, stress testing, and risk attribution as supplementary tools.

## Consequences

**Positive:**
- Single point of enforcement: no trade can bypass risk checks regardless of which strategy or agent initiated it
- Kill switch is instant and global; no need to coordinate across distributed strategy agents
- Risk limits are database-driven and can be adjusted by ops/CIO without deployments
- Circuit breaker triggers at the PostgreSQL level provide defense in depth independent of application state
- Full audit trail: every risk decision (approve, reject, modify) is logged with reason codes
- New strategies automatically inherit the risk framework without additional risk code

**Negative:**
- Central risk engine is a bottleneck: if it is slow or down, no trades execute (this is intentional -- fail-closed)
- Adding a new risk check type requires modifying the central engine rather than just the strategy
- Pre-trade validation adds latency to every order (measured at 15-45ms, acceptable for our timeframes)
- The risk engine must understand all instrument types and venue characteristics

**Risks Accepted:**
- In extreme market conditions, the risk engine's queue could back up; we accept slightly delayed executions over bypassing risk
- VaR calculations use historical data that may not reflect tail events; stress testing supplements but does not replace VaR
- Database-level circuit breakers fire after the trade is recorded, not before; the kill switch handles the "prevent before" case
