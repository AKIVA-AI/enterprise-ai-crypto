# Agent Responsibility Matrix

> **Clarity on who does what, who can stop what, and who answers to whom.**

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORITY HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 KILL SWITCH (Human/System)                                  │
│      │                                                          │
│      ▼                                                          │
│  🛡️ RISK AGENT (Absolute Veto)                                  │
│      │                                                          │
│      ▼                                                          │
│  🎯 META-DECISION AGENT (Regime Veto)                           │
│      │                                                          │
│      ▼                                                          │
│  💰 CAPITAL ALLOCATION AGENT (Size Control)                     │
│      │                                                          │
│      ▼                                                          │
│  📊 STRATEGY AGENTS (Proposals Only)                            │
│      │                                                          │
│      ▼                                                          │
│  ⚡ EXECUTION AGENT (Obey or Abort)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Responsibilities

### 1. Strategy Agents (Signal Generation)

**Location:** `backend/app/agents/signal_agent.py`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Generate trade ideas based on market analysis |
| **Authority Level** | Advisory only - cannot execute anything |
| **Outputs** | Trade Intents with confidence scores |
| **Can Propose** | ✅ Trade ideas, entry/exit signals |
| **Can Veto** | ❌ No veto power |
| **Can Execute** | ❌ Absolutely not |
| **Failure Mode** | Signals ignored - system continues safely |

**Key Principle:** Strategy agents are idea generators, not decision makers.

---

### 2. Meta-Decision Agent (Regime Filtering)

**Location:** `backend/app/agents/meta_decision_agent.py`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Determine if market conditions allow trading |
| **Authority Level** | Regime-level veto power |
| **Inputs** | Market regime, volatility, liquidity, correlation |
| **Outputs** | Trading allowed/forbidden with intensity level |
| **Can Veto** | ✅ Can block all trading during adverse regimes |
| **Can Execute** | ❌ No |
| **Failure Mode** | Trading pauses (conservative default) |

**Key Principle:** If uncertain, the answer is "no trading."

---

### 3. Capital Allocation Agent

**Location:** `backend/app/agents/capital_allocation_agent.py`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Decide how much capital per strategy/book |
| **Authority Level** | Allocative control |
| **Inputs** | Strategy performance, correlations, book limits |
| **Outputs** | Capital allocation percentages |
| **Can Reduce Size** | ✅ Can shrink any allocation |
| **Can Increase Size** | ✅ Within limits |
| **Can Execute** | ❌ No |
| **Failure Mode** | Conservative allocation (reduce to minimum) |

**Key Principle:** Capital is precious - allocate conservatively.

---

### 4. Risk Agent (ABSOLUTE AUTHORITY)

**Location:** `backend/app/agents/risk_agent.py`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Final gatekeeper for all trades |
| **Authority Level** | **ABSOLUTE VETO - CANNOT BE OVERRIDDEN** |
| **Checks** | Kill switch, position limits, exposure, daily loss, regime |
| **Outputs** | PASS or BLOCK (no middle ground) |
| **Can Veto** | ✅ Any trade, any time, for any reason |
| **Can Execute** | ❌ No |
| **Failure Mode** | All trading halts |

**SACRED RULE:** If Risk Agent says no, the answer is NO. Period.

---

### 5. Execution Agent

**Location:** `backend/app/agents/execution_agent.py`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Execute approved trades with precision |
| **Authority Level** | Executory only (no discretion) |
| **Requirement** | Must pass execution cost gate first |
| **Can Veto** | ❌ No |
| **Can Execute** | ✅ Only approved trades |
| **Failure Mode** | Abort trade (never force execution) |

**Key Principle:** Execute precisely, or not at all.

---

### 6. Order Management System (OMS)

**Location:** `supabase/functions/live-trading/index.ts`

| Aspect | Details |
|--------|---------|
| **Primary Role** | Single point of order creation |
| **Authority Level** | Database writer (exclusive) |
| **CRITICAL INVARIANT** | Only OMS writes to `orders` table |
| **Pre-execution Checks** | Kill switch, book status, venue health, risk limits |
| **Post-execution** | Update positions, create fills, record audit |
| **Failure Mode** | Order rejected with reason |

---

## Decision Flow Diagram

```
┌──────────────┐
│   SIGNAL     │  Strategy agent generates trade idea
│   AGENT      │  Output: TradeIntent { instrument, direction, confidence }
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ META-DECISION│  Is the market regime suitable?
│    AGENT     │  Checks: volatility, liquidity, correlation
└──────┬───────┘
       │ ALLOW?
       │ ├─ NO  → Intent discarded (logged)
       │ └─ YES ↓
       ▼
┌──────────────┐
│   CAPITAL    │  How much should we risk?
│  ALLOCATION  │  Checks: strategy allocation, book limits
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ ⚠️ RISK AGENT│  FINAL CHECK - Can this trade happen?
│  (ABSOLUTE)  │  Checks: kill switch, position limits, exposure, P&L
└──────┬───────┘
       │ APPROVE?
       │ ├─ NO  → Trade BLOCKED (audit logged)
       │ └─ YES ↓
       ▼
┌──────────────┐
│  EXECUTION   │  Is the trade worth the costs?
│  COST GATE   │  Check: Expected Edge > Total Costs
└──────┬───────┘
       │ PROFITABLE?
       │ ├─ NO  → Trade BLOCKED (not profitable)
       │ └─ YES ↓
       ▼
┌──────────────┐
│  EXECUTION   │  Execute with precision
│    AGENT     │  Route to venue, handle fills
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     OMS      │  Record order, update position
│              │  Create fills, audit trail
└──────────────┘
```

---

## Veto Authority Summary

| Agent | Can Veto | Veto Scope | Override Possible? |
|-------|----------|------------|-------------------|
| Strategy Agent | ❌ | N/A | N/A |
| Meta-Decision Agent | ✅ | Regime-wide | By Risk Agent only |
| Capital Allocation | ❌ (can reduce) | N/A | N/A |
| **Risk Agent** | **✅** | **ANY TRADE** | **NEVER** |
| Execution Agent | ❌ | N/A | N/A |

---

## Failure Mode Behavior

| Agent | If Crashes | If Data Missing | If Disagrees |
|-------|-----------|-----------------|--------------|
| Strategy Agent | No signals (safe) | No proposals | Loses vote |
| Meta-Decision | Trading pauses | Conservative (no trade) | Risk Agent decides |
| Capital Allocation | Conservative allocation | Minimum allocation | Risk Agent decides |
| Risk Agent | **ALL TRADING HALTS** | **ALL TRADING HALTS** | N/A (final authority) |
| Execution Agent | Trade aborts | Trade aborts | Aborts (no discretion) |

---

## Key Invariants (MUST ALWAYS BE TRUE)

1. **Risk Agent veto is absolute** - No code path exists to bypass
2. **Kill switch stops everything** - Immediately, globally
3. **OMS is single writer** - No other component writes orders
4. **Price must resolve** - Zero/null prices block trading
5. **Simulated data blocks trading** - `dataQuality: 'simulated'` → no execution
6. **Audit trail is immutable** - Every decision is recorded

---

## Anti-Patterns (NEVER DO THESE)

❌ **Never bypass Risk Agent for "just this one trade"**  
❌ **Never allow Strategy Agents to execute directly**  
❌ **Never skip price resolution**  
❌ **Never trade on mock/simulated data**  
❌ **Never let the frontend override backend policy**  
❌ **Never create multiple order-writing paths**  

---

*This matrix is the law. If the code doesn't match this document, the code is wrong.*
