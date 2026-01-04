# Architecture Review Document
> For validation by another agent or engineer before proceeding

**Date:** 2026-01-03
**Status:** GAPS CLOSED - READY FOR FULL AUDIT
**Project:** akiva-ai-crypto (Crypto Trading Platform)

---

## 📋 Executive Summary

This is a multi-agent crypto trading system with:
- **Frontend:** React/TypeScript + Vite (21 pages, 100+ components)
- **Backend:** FastAPI (Python) + Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL with RLS
- **Trading:** FreqTrade integration for backtesting/execution

---

## ✅ What's Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend UI** | ✅ Solid | Clean component structure, shadcn/ui |
| **Supabase Integration** | ✅ Working | Auth, RLS, Edge Functions deployed |
| **Architecture Design** | ✅ Good | Multi-agent with trading gate, risk agent |
| **Screener Logic** | ✅ Exists | Backend + Supabase scoring system |
| **Documentation** | ✅ Extensive | ARCHITECTURE.md, MANIFESTO.md, etc. |

---

## 🟡 Areas Needing Attention

### 1. **Two Parallel Backend Systems**
- **FastAPI (Python):** `backend/app/` - Not running/deployed
- **Supabase Edge Functions:** `supabase/functions/` - Active

**Question:** Which is the source of truth? Should we consolidate?

### 2. **Exchange API Integration**
- Adapters exist: `coinbase_adapter.py`, `mexc_adapter.py`
- **But:** No actual API key storage/management in UI
- **Risk:** Credentials hardcoded in `.env` only

### 3. **Frontend-Backend Mismatch**
- Many frontend hooks call `/api/screener/` (Python backend)
- But Python backend may not be running
- Some hooks call Supabase Edge Functions directly

### 4. **Simplified Pages Lost Functionality**
- `Arbitrage.tsx` was simplified but lost:
  - Kill switch integration
  - P&L limits
  - Execution history
  - Auto-execute settings

---

## 🔴 Critical Questions for Reviewer

1. **Deployment Strategy:**
   - Is FastAPI backend meant to run locally only?
   - Or should everything go through Supabase Edge Functions?

2. **Data Flow Clarity:**
   - Frontend → Edge Function → DB (current)
   - Frontend → Python API → DB (designed but not deployed?)

3. **Exchange Integration:**
   - How should API keys be securely stored?
   - Per-user credentials vs. system-level?

4. **Feature Priority:**
   - Arbitrage scanner (needs real price feeds)
   - Strategy screener (has backend logic)
   - Signal scoring (has Supabase function)

---

## 📁 Key File Locations

```
akiva-ai-crypto/
├── src/                     # React frontend
│   ├── pages/              # 21 page components
│   ├── components/         # 100+ UI components
│   └── hooks/              # React Query hooks
├── backend/                # Python FastAPI
│   └── app/
│       ├── services/       # Core business logic
│       ├── adapters/       # Exchange adapters
│       └── api/            # API routes
├── supabase/
│   ├── functions/          # Edge functions (active)
│   └── migrations/         # 21 migration files
├── user_data/              # FreqTrade configs
└── docs/                   # Extensive documentation
```

---

## 🎯 Recommended Next Steps (Pending Review)

1. **Decide on backend architecture** - Python vs Edge Functions
2. **Wire up exchange API management** - Secure key storage
3. **Re-enable Arbitrage features** - But cleaner
4. **Test screener end-to-end** - Verify backend runs
5. **Document data flow** - Which service handles what

---

## 📊 Database Tables (Supabase)

Key tables from migrations:
- `orders` - Trade orders
- `positions` - Open positions  
- `trade_intents` - Strategy signals
- `books` - Trading book configs
- `global_settings` - Kill switch, etc.
- `audit_events` - Audit trail
- `intelligence_signals` - Scored signals
- `tradeable_instruments` - Coin universe
- `arbitrage_executions` - Arb trade history

---

## 📦 Component Inventory

### Frontend Hooks (34 total)
```
useArbitrageEngine.ts       useFundingArbitrage.ts
useArbitrageHistory.ts      useHyperliquid.ts
useBinanceUSTrading.ts      useKrakenTrading.ts
useBooks.ts                 useLiveOrderBook.ts
useCoinbaseTrading.ts       useLivePriceFeed.ts
useControlPlane.ts          useLiveTrading.ts
useCrossExchangeArbitrage.ts useMarketIntelligence.ts
useDashboardMetrics.ts      useOrderFlowAnalysis.ts
useDecisionTraces.ts        useTradingGate.ts
useDerivativesData.ts       useTradingMode.ts
useEngineControl.ts         useUnifiedPortfolio.ts
useFreqTradeStrategies.ts   useUserRoles.ts + more...
```

### Supabase Edge Functions (30 total)
```
ai-trading-copilot     kill-switch
analyze-signal         kraken-trading
binance-us-trading     live-trading
coinbase-trading       market-data
cross-exchange-arbitrage market-intelligence
derivatives-data       signal-scoring
funding-arbitrage      telegram-alerts
hyperliquid            whale-alerts + more...
```

### Backend Services (Python)
```
backend/app/services/
├── risk_engine.py
├── portfolio_engine.py
├── oms_execution.py
├── reconciliation.py
├── market_data.py
├── meme_venture.py
└── strategy_screener.py
```

---

## 🔍 Review Checklist

- [ ] Is the dual-backend (Python + Edge Functions) intentional?
- [ ] Should we consolidate to one backend approach?
- [ ] Are the 34 hooks all necessary or can we simplify?
- [ ] Is the database schema complete for MVP?
- [ ] What's the deployment plan (local Python vs. serverless)?
- [ ] Are there any security concerns with current setup?

---

*Please review and provide feedback on architecture decisions before we continue implementation.*

