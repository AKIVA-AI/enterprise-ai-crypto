# Page Functionality Audit

## Overview

This document audits each page's functionality status, identifying what's real vs simulated.

---

## Dashboard (/)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Portfolio metrics | ✅ Real | Supabase `positions` table |
| P&L chart | ✅ Real | Supabase `positions.unrealized_pnl` |
| Positions table | ✅ Real | Supabase `positions` |
| Recent events | ✅ Real | Supabase `audit_events` |
| Risk gauge | ✅ Real | Calculated from positions |
| Agent status | ✅ Real | Supabase `agents` table |

---

## Trade (/trade)
**Status**: ⚠️ Partially Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Order ticket | ✅ Real | `coinbase-trading` edge function |
| Live prices | ✅ Real | Binance WebSocket |
| Order book | ✅ Real | Binance WebSocket |
| Place order (paper) | ✅ Real | Simulates fills, saves to DB |
| Place order (live) | ⚠️ Needs API keys | Requires `COINBASE_API_KEY` |
| Order history | ✅ Real | Supabase `orders` table |

---

## Positions (/positions)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Open positions | ✅ Real | Supabase `positions` |
| Close position | ✅ Real | Creates sell order |
| P&L tracking | ✅ Real | Real-time calculation |
| Position sizing | ✅ Real | Book capital constraints |

---

## Strategies (/strategies)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Strategy list | ✅ Real | Supabase `strategies` |
| Toggle status | ✅ Real | `toggle-strategy` edge function |
| Deploy strategy | ✅ Real | Creates `deployments` record |
| Strategy templates | ✅ Real | Pre-defined in code |

---

## Risk (/risk)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Risk dashboard | ✅ Real | Supabase `risk_limits` |
| Kill switch | ✅ Real | `kill-switch` edge function |
| Risk breaches | ✅ Real | Supabase `risk_breaches` |
| VaR calculation | ✅ Real | Calculated from positions |

---

## Arbitrage (/arbitrage)
**Status**: ⚠️ Partially Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Opportunity detection | ⚠️ Simulated | Demo data, needs multi-exchange prices |
| Execution | ⚠️ Needs API keys | Requires exchange credentials |
| P&L tracking | ✅ Real | Supabase `arbitrage_executions` |

---

## Meme Ventures (/launch)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Project pipeline | ✅ Real | Supabase `meme_projects` |
| Project scores | ✅ Real | Stored in `meme_projects` |
| Go/No-Go approval | ✅ Real | `approve-meme-launch` edge function |
| Task management | ✅ Real | Supabase `meme_tasks` |
| Stage transitions | ✅ Real | DB updates on approval |
| On-chain metrics | ⚠️ Simulated | `token-metrics` uses mock data |
| Role-based approval | ✅ Real | Admin/CIO only via RLS |

**Meme Ventures Workflow**:
1. Create project → `opportunity` stage
2. Move to `build` stage for due diligence
3. Admin/CIO approves → moves to `launch` stage
4. Or rejects → moves to `completed` stage
5. Tasks auto-created on approval

---

## Engine (/engine)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Book management | ✅ Real | Supabase `books` |
| Trade intents | ✅ Real | Supabase `trade_intents` |
| Signals | ✅ Real | Supabase `strategy_signals` |
| Freeze book | ✅ Real | `freeze-book` edge function |

---

## Agents (/agents)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Agent list | ✅ Real | Supabase `agents` |
| Agent status | ✅ Real | Heartbeat monitoring |
| Agent metrics | ✅ Real | CPU/memory from `agents` |

---

## Markets (/markets)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Live prices | ✅ Real | Binance WebSocket |
| Market intelligence | ⚠️ Mixed | Real signals + simulated sources |
| News feed | ⚠️ Simulated | Mock data, needs API |
| Social sentiment | ⚠️ Needs API | Requires `LUNARCRUSH_API_KEY` |

---

## Settings (/settings)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| User roles | ✅ Real | Supabase `user_roles` |
| Notification channels | ✅ Real | Supabase `notification_channels` |
| Trading mode toggle | ✅ Real | `global_settings.paper_trading_mode` |
| Exchange API manager | ⚠️ UI only | Secrets managed externally |

---

## Crypto CoPilot (Sidebar)
**Status**: ✅ Fully Functional

| Feature | Status | Backend |
|---------|--------|---------|
| Chat interface | ✅ Real | `trading-copilot` edge function |
| Quick actions | ✅ Real | Pre-defined prompts |
| Context awareness | ✅ Real | Current page context sent |
| Conversation history | ✅ Real | Last 10 messages sent |

---

## Summary

### Fully Functional (13 features)
- Dashboard, Positions, Strategies, Risk, Engine, Agents, Settings
- Meme Ventures approval workflow
- Crypto CoPilot

### Needs API Keys (3 features)
- Live trading on Coinbase/Kraken
- Social sentiment (LunarCrush)
- Real news feed

### Simulated Data (2 features)
- On-chain token metrics
- Arbitrage opportunities

---

## Quick Actions Audit

All CoPilot quick actions call `trading-copilot` edge function which:
- ✅ Analyzes market conditions
- ✅ Generates trading insights
- ✅ Returns structured responses with:
  - Message text
  - Mentioned instruments
  - Suggested actions (BUY/SELL/HOLD)
  - Risk level
  - Confidence score
