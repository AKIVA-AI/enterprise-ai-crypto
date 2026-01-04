# AKIVA AI Crypto - System Overview

> **Understanding what this system is, how it works, and how to use it.**

## What Is This?

AKIVA AI Crypto is a **dual-engine institutional trading platform** that combines:

1. **Custom Python Backend** - Enterprise features (risk, compliance, multi-agent AI)
2. **FreqTrade Engine** - Battle-tested algorithmic trading
3. **React Dashboard** - Professional observability and control

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AKIVA AI TRADING PLATFORM                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐ │
│  │  REACT FRONTEND  │────▶│  PYTHON BACKEND  │────▶│    FREQTRADE    │ │
│  │    (Dashboard)   │     │   (FastAPI)      │     │    (Trading)    │ │
│  │                  │     │                  │     │                 │ │
│  │  - Portfolio     │     │  - Multi-Agent   │     │  - Strategies   │ │
│  │  - Risk View     │     │  - Risk Engine   │     │  - Backtesting  │ │
│  │  - Audit Trail   │     │  - Compliance    │     │  - Live Trading │ │
│  │  - Controls      │     │  - API Routes    │     │  - Exchanges    │ │
│  └──────────────────┘     └──────────────────┘     └─────────────────┘ │
│           │                        │                        │          │
│           └────────────────────────┼────────────────────────┘          │
│                                    ▼                                    │
│                           ┌──────────────────┐                         │
│                           │     SUPABASE     │                         │
│                           │   (Database)     │                         │
│                           └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Two Engines

### Engine 1: Custom Python Backend (`backend/`)

**Port:** 8000 | **Tech:** FastAPI, Python

Provides enterprise-grade features that FreqTrade doesn't have:
- **Multi-Agent Decision System** - Signal, Risk, Meta-Decision, Execution agents
- **Enterprise Risk Controls** - Kill switch, position limits, VaR calculations
- **Compliance & Audit** - Full audit trail, role-based access
- **Portfolio Analytics** - Cross-strategy attribution, correlation analysis
- **Arbitrage Detection** - Cross-exchange, funding rate, triangular

**Use when:** You need institutional controls, compliance, or advanced analytics.

### Engine 2: FreqTrade (`user_data/`, `run_bot.py`)

**Port:** 8080 | **Tech:** FreqTrade framework

Battle-tested algorithmic trading with our enhancements:
- **WhaleFlowScalper Strategy** - Our optimized trading strategy
- **Coinbase Advanced Futures** - Custom integration (US-friendly)
- **Backtesting & Hyperopt** - Strategy optimization
- **Multiple Exchanges** - Coinbase, Kraken, Binance (with limits)

**Use when:** You want automated strategy execution and backtesting.

## How They Work Together

```
1. STRATEGY DEVELOPMENT
   └─▶ Create/optimize in FreqTrade (backtest, hyperopt)
   
2. RISK VALIDATION
   └─▶ Backend validates strategy against enterprise limits
   
3. EXECUTION
   └─▶ FreqTrade executes trades (can run independently)
   └─▶ OR Backend orchestrates via FreqTrade integration
   
4. MONITORING
   └─▶ Frontend dashboard shows unified view
   └─▶ Backend provides analytics and alerts
```

## Frontend-Backend Connection

The **React frontend** connects to the **Python backend**, NOT directly to FreqTrade.

```typescript
// Frontend API calls go to backend (port 8000)
const API_BASE_URL = 'http://localhost:8000/api';

// Backend exposes FreqTrade data via its own API
GET /api/strategies/      → List FreqTrade strategies
POST /api/strategies/backtest → Run backtest
GET /api/trading/positions → Get positions
```

FreqTrade's native API (port 8080) is for advanced/CLI use only.

## Quick Start

### Option A: Full Platform (Recommended)
```bash
# 1. Start Backend
cd backend && uvicorn app.main:app --reload --port 8000

# 2. Start FreqTrade (dry-run)
python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run

# 3. Start Frontend
npm run dev
```

### Option B: FreqTrade Only
```bash
# Just run the trading bot
python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run
```

### Option C: Dashboard Only (Paper Trading)
```bash
npm run dev  # Connect to Supabase for paper trading
```

## Key Files

| File/Directory | Purpose |
|----------------|---------|
| `run_bot.py` | Custom FreqTrade launcher with Coinbase futures |
| `backend/app/` | Python backend (FastAPI) |
| `src/` | React frontend |
| `user_data/strategies/` | Trading strategies |
| `user_data/config_*.json` | Exchange configurations |
| `docs/ARCHITECTURE.md` | Detailed technical architecture |
| `docs/MANIFESTO.md` | Core values and philosophy |

## Who Is This For?

- **Individual Traders** - Want institutional-grade tools
- **Small Funds** - Need compliance and audit features  
- **Developers** - Building on FreqTrade framework
- **US Traders** - Need Coinbase Futures support

## Key Value Propositions

1. **Enterprise Risk Controls** - Kill switch, position limits, daily loss limits
2. **Multi-Agent AI** - Not just a bot, intelligent decision layering
3. **FreqTrade Power** - Proven engine, extensive backtesting
4. **US-Friendly** - Coinbase Advanced Futures support
5. **Full Observability** - Audit trails, decision traces, analytics

## Next Steps

1. **Understand the architecture:** Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Learn our values:** Read [MANIFESTO.md](./MANIFESTO.md)
3. **Set up Coinbase:** Read [COINBASE_SETUP_GUIDE.md](./COINBASE_SETUP_GUIDE.md)
4. **Deploy:** Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

*AKIVA AI - Institutional trading, simplified.*

