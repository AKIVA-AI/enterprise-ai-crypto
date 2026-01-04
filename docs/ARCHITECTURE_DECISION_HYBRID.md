# Architecture Decision Record: Hybrid Backend

**Date:** 2026-01-03  
**Status:** APPROVED  
**Decision Maker:** CJ (User)

---

## Decision

We will use a **Hybrid Backend Architecture** combining:
1. **Supabase Edge Functions** (Deno) - for real-time, auth, and CRUD
2. **Python Backend on NorthFlank** - for AI/ML, agents, and heavy computation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                        │
│                    Hosted: Lovable / Vercel / Netlify               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────────┐
│   SUPABASE EDGE FUNCTIONS   │   │    PYTHON BACKEND (NorthFlank)  │
│   (Deno/TypeScript)          │   │    (FastAPI)                     │
│                              │   │                                  │
│   Responsibilities:          │   │   Responsibilities:              │
│   • Authentication           │   │   • Multi-agent orchestration   │
│   • Authorization (RLS)      │   │   • AI/ML models (FreqAI)       │
│   • Real-time subscriptions  │   │   • FreqTrade integration       │
│   • CRUD operations          │   │   • Strategy backtesting        │
│   • Kill switch              │   │   • Heavy analytics             │
│   • Simple trading execution │   │   • Market data processing      │
│   • User settings            │   │   • Signal prediction           │
│   • Exchange key validation  │   │   • Raw data feeds              │
│                              │   │                                  │
│   Latency: <100ms            │   │   Latency: <500ms               │
│   Scaling: Auto              │   │   Scaling: Manual/K8s           │
└──────────────┬───────────────┘   └─────────────┬───────────────────┘
               │                                  │
               └──────────────┬───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                               │
│                    (Single Source of Truth)                          │
│                                                                      │
│   • All persistent data                                              │
│   • Real-time subscriptions                                          │
│   • Row Level Security                                               │
│   • Audit logging                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Boundaries

### Edge Functions Own:
| Domain | Tables | Functions |
|--------|--------|-----------|
| Auth | user_roles | JWT validation |
| Trading UI | orders, positions | CRUD, real-time |
| Settings | global_settings, user_exchange_keys | Config management |
| Safety | global_settings | kill-switch |
| Validation | user_exchange_keys | exchange-validate |

### Python Backend Owns:
| Domain | Responsibilities |
|--------|------------------|
| Agents | Risk, Strategy, Execution, Meta-Decision |
| AI/ML | FreqAI models, signal prediction |
| FreqTrade | Bot execution, backtesting |
| Analytics | Performance metrics, reporting |
| Data | Raw market feeds, historical data |

---

## Communication Patterns

### Frontend → Edge Functions
- Direct Supabase client calls
- Real-time subscriptions
- Authentication handled automatically

### Frontend → Python Backend
- REST API calls via `api_base_url` setting
- WebSocket for streaming (optional)
- JWT passed in Authorization header

### Edge Functions → Python Backend
- Internal API calls for agent coordination
- Async job queuing (future)

### Python Backend → Supabase
- Service role key for database access
- No RLS bypass for user data
- Audit logging for all operations

---

## Deployment

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Frontend | Lovable | `*.lovableproject.com` |
| Edge Functions | Supabase | Auto-deployed |
| Python Backend | NorthFlank | `api.trading.yourdomain.com` |
| Database | Supabase | Managed PostgreSQL |

---

## Why Hybrid?

| Requirement | Edge Functions | Python | Winner |
|-------------|----------------|--------|--------|
| Auth/RLS | ✅ Native | ⚠️ Manual | Edge |
| Real-time | ✅ Built-in | ⚠️ WebSocket | Edge |
| AI/ML | ❌ Limited | ✅ Full ecosystem | Python |
| FreqTrade | ❌ Not possible | ✅ Native | Python |
| Backtesting | ❌ Too slow | ✅ GPU support | Python |
| Low latency CRUD | ✅ <50ms | ⚠️ Network hop | Edge |

---

## Migration Path

### Phase 1 (Now): Foundation
- [x] Edge Functions for auth, CRUD, real-time
- [x] Exchange key management with encryption
- [ ] Python backend deployed to NorthFlank

### Phase 2 (Week 2): Integration
- [ ] Python agents connected to Supabase
- [ ] FreqTrade integration
- [ ] Backend URL configured in settings

### Phase 3 (Month 1): Full System
- [ ] All agents operational
- [ ] AI/ML models deployed
- [ ] Complete data pipeline

---

*This architecture prioritizes performance and scalability while maintaining security and developer experience.*

