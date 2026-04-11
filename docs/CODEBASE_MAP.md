# Enterprise Crypto — Codebase Map

**Version:** 1.1
**Date:** 2026-04-05
**Standard:** Akiva Build Standard v2.15, Phase 0.5
**Archetype:** 7 — Algorithmic Trading Platform

---

## System Overview

Enterprise Crypto is an institutional-grade, multi-agent algorithmic trading platform. It provides multi-exchange execution, fail-closed risk management, full audit trails, and AI-driven signal generation for cryptocurrency markets.

**Stack:** React 18 / TypeScript (Vite) frontend, FastAPI (Python) backend, Supabase PostgreSQL database, Redis pub/sub, 36 Deno edge functions, FreqTrade integration, Docker deployment.

---

## Directory Structure

```
enterprise-crypto/
├── src/                          # Frontend (React/TypeScript/Vite)
│   ├── App.tsx                   # Route definitions (22 pages)
│   ├── pages/                    # 22 page components
│   ├── components/               # 162 UI components (28 subdirectories)
│   ├── hooks/                    # 67 custom hooks
│   ├── services/                 # API service clients
│   ├── lib/                      # Utility functions
│   └── integrations/             # Supabase client, types
│
├── backend/                      # Backend (FastAPI/Python)
│   ├── app/
│   │   ├── main.py               # FastAPI app, lifespan, middleware
│   │   ├── config.py             # Unified Pydantic settings
│   │   ├── database.py           # Supabase client + audit_log helper
│   │   ├── logging_config.py     # structlog configuration
│   │   ├── core/                 # Security, config, strategy registry
│   │   ├── middleware/           # Security headers, request validation
│   │   ├── enterprise/           # RBAC, audit, risk limits, compliance
│   │   ├── agents/               # 10 trading agents + orchestrator
│   │   ├── api/                  # 12+ API routers
│   │   ├── adapters/             # Exchange venue adapters (4)
│   │   ├── arbitrage/            # Arbitrage engines (5 types)
│   │   ├── services/             # 45+ domain services
│   │   ├── models/               # Pydantic domain models
│   │   ├── freqtrade/            # FreqTrade bot integration
│   │   ├── gpu/                  # GPU/CUDA acceleration
│   │   ├── control_plane/        # Control-plane adapters (authority, evidence, risk policy)
│   │   └── compliance/           # Trading region restrictions
│   ├── tests/                    # 69 pytest test files
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Multi-stage Docker build
│
├── supabase/
│   ├── migrations/               # 1 baseline SQL migration (64 tables, 212 RLS policies)
│   └── functions/                # 36 Deno edge functions
│
├── e2e/                          # 4 Playwright E2E test specs
├── data/freqtrade/strategies/    # FreqTrade strategy files
├── scripts/                      # Deployment, health check, setup scripts
├── docs/                         # 45+ documentation files
├── .github/
│   ├── workflows/ci.yml          # Frontend + backend CI
│   ├── workflows/e2e.yml         # Playwright E2E tests
│   └── dependabot.yml            # Automated dependency updates
├── docker-compose.yml            # Production compose
├── docker-compose.staging.yml    # Staging compose
└── docker-compose.trading.yml    # FreqTrade bot compose
```

---

## Backend Architecture

### Entry Point: `backend/app/main.py`

**Lifespan Management:**
1. Startup: `init_db()` → `market_data_service.start()` → `initialize_freqtrade_integration()` → `smart_order_router.initialize()` → `advanced_risk_engine.initialize()` → `arbitrage_engine.start()`
2. Shutdown: reverse order

**Middleware Stack (request order):**
1. CORSMiddleware (hardened: specific origins, credentials=true)
2. TrustedHostMiddleware (production only)
3. RequestValidationMiddleware (10MB body limit, XSS/SQL injection detection)
4. SecurityHeadersMiddleware (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
5. Request Context Middleware (X-Request-ID, structlog binding)
6. Auth Middleware (Bearer JWT → Supabase verify → role lookup)
7. Rate Limiting (slowapi: 30/min trading, 100/min read, 10/min auth)

**Registered Routers (all under `/api/v1`):**
trading, risk, venues, meme, system, agents, arbitrage, market, strategies, screener, backtest, execution, ml_signals + health router (no auth)

### Multi-Agent System (`backend/app/agents/`)

**10 Agents with Hierarchy:**
```
META-DECISION AGENT (VETO POWER — no trade without approval)
  ├── CAPITAL ALLOCATION AGENT (distributes capital across strategies)
  ├── RISK AGENT (pre-trade validation, kill switch enforcement)
  ├── SIGNAL AGENT (trend/mean-reversion/funding signal generation)
  ├── EXECUTION AGENT (order routing to venues)
  ├── ARBITRAGE AGENT (cross-venue opportunity detection)
  ├── FREQTRADE SIGNAL AGENT (FreqTrade strategy signals)
  └── STRATEGY LIFECYCLE AGENT
```

**Communication:** Redis pub/sub channels (`agent:signals`, `agent:risk_check`, `agent:risk_approved`, `agent:execution`, `agent:fills`, `agent:control`, `agent:heartbeat`)

**BaseAgent:** Redis pub/sub with message queue fallback (max 1000), exponential backoff reconnection (1s→30s), Supabase heartbeats every 30s (CPU, memory, status), control channel (pause/resume/shutdown).

### Service Layer (`backend/app/services/` — 45+ files)

**Core Engines (WORKING):**
- `advanced_risk_engine.py` — VaR (historical, parametric, Monte Carlo), portfolio optimization, stress testing, risk attribution
- `smart_order_router.py` — Multi-venue scoring, TWAP/VWAP/POV/Iceberg algo selection, market impact modeling
- `execution_planner.py` — Legged execution with atomic unwind on failure
- `risk_engine.py` — Pre-trade checks (kill switch, circuit breakers, position limits, daily loss)

**Portfolio & Positions (WORKING):**
- `portfolio_engine.py`, `portfolio_analytics.py` — Tracking, P&L, Greeks
- `position_manager.py`, `position_sizer.py` — Lifecycle, Kelly criterion
- `capital_allocator.py` — Capital distribution

**Backtesting (WORKING):**
- `backtesting.py`, `enhanced_backtesting_engine.py`, `institutional_backtester.py`, `walk_forward_engine.py`

**Arbitrage (PARTIAL — logic real, venue data mocked):**
- `arbitrage_engine.py`, `basis_edge_model.py`, `spot_arb_edge_model.py`, `basis_opportunity_scanner.py`, `spot_arb_scanner.py`

**Market Data (SCAFFOLDED — adapters return random prices):**
- `market_data_service.py`, `enhanced_market_data_service.py`

**Signals & ML (PARTIAL):**
- `enhanced_signal_engine.py`, `regime_detection_service.py`, `technical_analysis.py`

### Exchange Adapters (`backend/app/adapters/` — SCAFFOLDED)

All 4 adapters (Coinbase, Kraken, MEXC, DEX) use `random.uniform()` for prices, fills, slippage, and gas costs. Real exchange API calls are NOT implemented. The adapter pattern and interface are production-quality but the data layer is mocked.

### Enterprise Features (`backend/app/enterprise/`)

- `rbac.py` — 6 roles (viewer→admin), 25 permissions, per-role trade size limits
- `audit.py` — Async buffer (100 events, 5s flush), structured events, 9 categories, 5 severity levels
- `risk_limits.py` — Position/loss/drawdown/exposure/velocity limits with breach tracking
- `compliance.py` — Trading region restrictions, rule engine

### Control-Plane Adapters (`backend/app/control_plane/`)

Bridges the multi-agent trading system to the Akiva execution-contracts and policy-runtime packages. Uses the optional-import guard pattern (`_HAS_CONTROL_PLANE` flag) so the trading backend runs without framework packages installed.

**Three adapters:**

| Adapter | Purpose | Framework Package |
|---------|---------|-------------------|
| `authority_adapter.py` | Maps agent roles (meta-decision, execution, risk, signal, etc.) to `AuthorityBoundary` contracts with `PermissionScope` and `ApprovalPolicy`. Unknown agents get READ_ONLY + DENY (fail-closed). | `akiva-execution-contracts` |
| `evidence_adapter.py` | Converts order fills and META-DECISION vetoes into immutable `EvidenceRecord` objects for the append-only audit trail. | `akiva-execution-contracts` |
| `risk_policy.py` | Three composable `PolicyAdapter` implementations (VaRPolicy, PositionLimitPolicy, DailyLossPolicy) wired into a `PolicyEngine`. Factory `build_risk_engine()` draws limits from trading config with conservative fallback defaults. | `akiva-policy-runtime` |

**Agent authority mapping:**

- META-DECISION: `FULL_ACCESS` + `REQUIRE_APPROVAL` (supreme veto)
- Execution / Risk / Capital Allocation / Arbitrage / Strategy Lifecycle: `WORKSPACE_WRITE` + `AUTO`
- Signal / FreqTrade Signal: `READ_ONLY` + `AUTO`
- Unknown: `READ_ONLY` + `DENY` (fail-closed)

**Tests:** `backend/tests/test_control_plane.py`

---

## Frontend Architecture

### Pages (22 routes in `src/App.tsx`)

All protected by `<ProtectedRoute>` except `/auth`:

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Index | Dashboard — metrics, agent status, positions, P&L |
| `/agents` | Agents | Agent registry, status, role management |
| `/strategies` | Strategies | Strategy CRUD, backtest, deploy |
| `/execution` | Execution | Order history, alerts, kill switch |
| `/risk` | Risk | Risk analytics, kill switch, circuit breakers |
| `/launch` | Launch | Meme project pipeline |
| `/treasury` | Treasury | Wallet management (ETH, BTC, SOL, etc.) |
| `/observability` | Observability | System monitoring |
| `/settings` | Settings | Configuration |
| `/engine` | Engine | Strategy execution engine controls |
| `/analytics` | Analytics | Portfolio performance, trade journal |
| `/markets` | Markets | Market data viewer |
| `/positions` | Positions | Live position tracking, P&L |
| `/audit` | AuditLog | Compliance activity log |
| `/status` | SystemStatus | Health checks, uptime |
| `/arbitrage` | Arbitrage | Spot & funding arb opportunities |
| `/trade` | Trade | Unified spot trader, risk simulator |
| `/operations` | Operations | Data source health |
| `/screener` | Screener | Asset screener |
| `/multi-exchange-demo` | MultiExchangeDemo | Multi-venue routing demo |
| `/auth` | Auth | Login/signup (public) |
| `*` | NotFound | 404 handler |

### Hooks (`src/hooks/` — 67 total)

- **29 hooks** doing real backend queries (useAgents, useAuth, usePositions, useLivePriceFeed, useStrategies, useBacktestResults, useSpotArbSpreads, useDashboardMetrics, etc.)
- **38 hooks** that are stubs, partial, or thin wrappers (useMarketRegimes, useSignalScoring, useDerivativesData, useTradingCopilot, useWhaleAlerts, etc.)

### Component Library

shadcn/ui (Radix UI primitives) with Tailwind CSS. Dark theme trading UI. Recharts + Lightweight Charts for data visualization. 28 component subdirectories covering dashboard, trading, risk, arbitrage, agents, strategies, portfolio, compliance, etc.

---

## Database Schema

### Tables (64 total in 1 baseline migration)

**Core Trading:** books, orders, positions, strategies, venues, instruments, leg_events
**Risk:** risk_limits, circuit_breaker_events, global_settings (kill switch)
**Users:** profiles, user_roles, user_tenants, tenants, user_exchange_keys
**Market Data:** market_snapshots, derivatives_metrics, onchain_metrics, whale_transactions
**Intelligence:** signals, decision_traces, alerts, audit_events
**Meme:** meme_projects, meme_tasks
**Arbitrage:** basis_positions, spot_arb_positions, basis_metrics, spot_arb_metrics

### RLS Architecture

- 212 RLS policies across 16+ tables
- Multi-tenant isolation via `book_id` and `current_tenant_id()` function
- Role-based access using `has_any_role()` function (7 roles: admin, cio, trader, ops, research, auditor, viewer)
- Service role bypass for backend operations
- Audit events table is INSERT-only (immutable by design)
- API key encryption via pgcrypto AES-256 (SECURITY DEFINER functions)

### Circuit Breaker Triggers

Migration `20260220042730` implements Postgres triggers on fills/positions that:
- Check daily P&L limits
- Freeze books when limits breached
- Activate global kill switch automatically

---

## Edge Functions (36 in `supabase/functions/`)

**Trading (7):** live-trading, trading-api, binance-us-trading, coinbase-trading, kraken-trading, hyperliquid, toggle-strategy
**Arbitrage (4):** cross-exchange-arbitrage, funding-arbitrage, basis-arbitrage, approve-meme-launch
**Intelligence (5):** market-intelligence, market-data, market-data-stream, whale-alerts, real-news-feed
**Signals (2):** signal-scoring, analyze-signal
**Risk/Ops (6):** health-check, kill-switch, freeze-book, reallocate-capital, scheduled-monitor, alert-create + send-alert-notification
**Integrations (4):** tradingview-webhook, telegram-alerts, external-signals, token-metrics
**AI (2):** trading-copilot, ai-trading-copilot
**Exchange (2):** exchange-keys, exchange-validate
**Audit (1):** audit-log
**Shared:** `_shared/` (cors, security, oms-client, tenant-guard, validation)

All 36 are real implementations (not stubs).

---

## Testing Infrastructure

### Backend Tests (`backend/tests/` — 69 files)

Covers: risk engine (controls, edge cases), arbitrage engine (basis, spot arb, integration), backtesting (enhanced, institutional, walk-forward, e2e workflow), capital allocator (agent, integration), edge/cost models, execution (planner, API), freqtrade (integration, backtester), health (metrics), order gateway (critical), order simulator, performance metrics, portfolio analytics, position manager (sizer, coverage), quant engine (enhanced), scanners (scanner-to-OMS cost gate), strategy (registry, lifecycle agent), security middleware, WebSocket auth, enterprise (audit, compliance, controls, features, reporting), adapters (coverage), agent identity, behavior tracking, config, control plane, database & security, drawdown monitor, engine runner, integration coverage, live reconciliation, logging config, meta-decision agent, model registry, observability, smart order router, system API, trading engine coverage.

**Coverage floor:** 20% (CI `--cov-fail-under=20`)

### Frontend Tests (`src/` — 18 test files)

**Component tests (5):** KillSwitchPanel, AdvancedRiskDashboard, TradeTicket, PositionManagementPanel, RiskGauge.
**Hook tests (5):** useAlerts, useDashboardMetrics, usePositions, useStrategies, useSystemHealth.
**Library tests (8):** complianceEnforcement, instrumentParser, schemas, status-colors, symbolUtils, tradingGate, tradingModes, userModes.

### E2E Tests (`e2e/` — 4 Playwright specs)

kill-switch, position-management, risk-dashboard, trade-flow

### Load Tests

`backend/tests/load/locustfile.py`

---

## CI/CD

### GitHub Actions

- **ci.yml:** Frontend (Bun → tsc → ESLint → vitest) + Backend (Python 3.12 → Ruff → Bandit → pip-audit → pytest → Docker build)
- **e2e.yml:** Playwright chromium on PR/nightly/manual

### Dependabot

Weekly updates for pip, npm, and GitHub Actions with reviewer `adii2025`.

### Known CI Issues

- Frontend type-check: `bun run tsc --noEmit` with root `tsconfig.json` `"files": []` — likely compiles nothing (should use `tsc -p tsconfig.app.json --noEmit`)
- `npm audit` uses `|| true` (non-blocking)
- `pip-audit` uses `|| echo "::warning::"` (non-blocking)
- Backend coverage floor: 20% (Archetype 7 requires 60%)
- Single Python version (no matrix testing)
- No coverage artifact upload
- No deployment pipeline

---

## Deployment

- Docker multi-stage build (backend)
- docker-compose (production, staging, FreqTrade bots)
- `scripts/deploy.sh` for manual deployment
- Northflank configuration (`northflank.json`)
- No CD pipeline in GitHub Actions
- No blue/green or canary deployment

---

## Known Gaps

1. **Exchange adapters scaffolded** — All 4 backend adapters return random data. Real exchange API calls not implemented.
2. **CI type-check ineffective** — Bare `tsc --noEmit` on Vite project with `"files": []` compiles nothing.
3. **No deployment pipeline** — Manual deploy only, no CD in GitHub Actions.
4. **Frontend test coverage thin** — 18 test files for 280 source files.
5. **Security scanning non-blocking** — npm audit and pip-audit don't fail CI.
6. **147 hardcoded colors** — Violates design token discipline.
7. **18 fire-and-forget mutations** — Orders/actions submitted without proper error handling.
8. **No OpenTelemetry/Prometheus** — No distributed tracing or metrics export.
9. **AI copilot not integrated** — Context provider exists, no UI.
10. **ML models not deployed** — GPU module exists but no trained model serving.

---

_This codebase map was created as Phase 0.5 per Akiva Build Standard v2.14._
_139 Python files, 280 TypeScript files, 1 SQL baseline migration, 36 edge functions examined._
