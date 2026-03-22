# Enterprise Crypto -- Developer Onboarding Guide

**Last updated:** 2026-03-22

This guide gets a new developer from zero to running the full system locally, and explains how to extend the platform.

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker (for Supabase local development)
- Supabase CLI (`npx supabase`)
- Git

### 1. Clone and Install

```bash
git clone <repo-url> enterprise-crypto
cd enterprise-crypto

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Variables

Copy the environment template and fill in required values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service role key |
| `REDIS_URL` | Redis connection for pub/sub |
| `COINBASE_API_KEY` / `SECRET` | Coinbase exchange credentials (optional for paper mode) |
| `KRAKEN_API_KEY` / `SECRET` | Kraken exchange credentials (optional for paper mode) |
| `BINANCE_API_KEY` / `SECRET` | Binance.US exchange credentials (optional for paper mode) |

For local development with paper trading, exchange keys are optional -- the system will use simulated data.

### 3. Database Setup

```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

### 4. Run the Application

```bash
# Frontend (terminal 1)
npm run dev
# Serves at http://localhost:5173

# Backend (terminal 2)
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Verify Setup

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend && python -m pytest

# Type-check frontend
npm run typecheck
```

---

## Architecture Overview

Enterprise Crypto is a **multi-agent algorithmic trading platform** (Archetype 7) with three layers:

```
Frontend (React/Vite/TypeScript)
    |
    v
Edge Functions (Deno) + Backend (FastAPI/Python)
    |
    v
Database (Supabase PostgreSQL) + Redis (pub/sub)
```

### Frontend (`src/`)

- **22 pages** in `src/pages/` -- Dashboard, Positions, Strategies, Risk, Markets, etc.
- **67 custom hooks** in `src/hooks/` -- data fetching with React Query, WebSocket management, real-time subscriptions
- **162 components** organized by domain in `src/components/`
- State management via **React Query** (server state) and React useState (UI state)
- Real-time updates via **Supabase Realtime** (Postgres changes) and **Binance WebSocket**

### Backend (`backend/app/`)

- **10 trading agents** in `agents/` with an orchestrator for coordination
- **4 exchange adapters** in `adapters/` (Coinbase, Kraken, Binance.US, Hyperliquid)
- **5 arbitrage engines** in `arbitrage/`
- **Enterprise layer** in `enterprise/` -- RBAC, audit logging, risk limits, compliance
- **45+ domain services** in `services/`

### Key Design Decisions

See `docs/architecture/ADRs/` for architectural decision records:

- **ADR-001**: Agent communication -- how the 10 agents coordinate via Redis pub/sub
- **ADR-002**: RLS isolation -- multi-tenant row-level security in Supabase
- **ADR-003**: Risk engine design -- fail-closed risk management architecture

---

## How to Add a New Trading Strategy

1. **Define the strategy** in the UI: Navigate to the Strategies page and click "New Strategy" or use a template from the Template Library.

2. **Create the backend strategy class** (if implementing custom logic):

   ```python
   # backend/app/services/strategies/my_strategy.py
   from app.core.strategy_registry import register_strategy

   @register_strategy("my_custom_strategy")
   class MyCustomStrategy:
       def __init__(self, config: dict):
           self.config = config

       async def generate_signal(self, market_data: dict) -> dict:
           # Your signal logic here
           return {"action": "buy", "confidence": 0.85, "symbol": "BTC-USDT"}
   ```

3. **Register in the strategy registry** at `backend/app/core/strategy_registry.py`.

4. **Backtest**: Use the Backtest Panel on the Strategies page to validate performance against historical data.

5. **Deploy**: Use the Strategy Deployment Wizard to move from paper trading to live.

---

## How to Add a New Exchange Adapter

1. **Create the adapter** in `backend/app/adapters/`:

   ```python
   # backend/app/adapters/new_exchange.py
   from app.adapters.base import BaseExchangeAdapter

   class NewExchangeAdapter(BaseExchangeAdapter):
       async def get_balances(self) -> dict: ...
       async def place_order(self, order: dict) -> dict: ...
       async def cancel_order(self, order_id: str) -> dict: ...
       async def get_ticker(self, symbol: str) -> dict: ...
   ```

2. **Register the venue** in `src/lib/tradingModes.ts` under the `VENUES` constant.

3. **Add the frontend hook** in `src/hooks/` following the pattern of `useCoinbaseTrading.ts` or `useKrakenTrading.ts`.

4. **Add exchange key management** in the Settings page (`src/pages/Settings.tsx`).

---

## How to Add a New Agent

1. **Create the agent** in `backend/app/agents/`:

   ```python
   # backend/app/agents/my_agent.py
   from app.agents.base import BaseAgent

   class MyAgent(BaseAgent):
       name = "my_agent"

       async def run_cycle(self):
           # Agent decision loop
           pass
   ```

2. **Register with the orchestrator** in `backend/app/agents/orchestrator.py`.

3. **Add monitoring** -- agents appear automatically on the Agents page if registered with the orchestrator.

---

## Testing Guide

### Frontend Tests

```bash
# Run all frontend tests
npm test

# Run specific test file
npx vitest run src/hooks/__tests__/usePositions.test.ts

# Run with coverage
npx vitest run --coverage

# Watch mode
npx vitest
```

Test patterns used:
- **Component tests**: `@testing-library/react` with `render`, `screen`, `fireEvent`
- **Hook tests**: `renderHook` from `@testing-library/react` with React Query wrapper
- **Mocking**: `vi.mock()` for Supabase client, sonner toasts, external modules
- **Test setup**: `src/test/setup.ts` configures jest-dom matchers, mocks ResizeObserver, IntersectionObserver, and matchMedia

### Backend Tests

```bash
cd backend

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app

# Run specific test
python -m pytest tests/test_risk_engine.py -v
```

### Type Checking

```bash
# Frontend
npm run typecheck
# Note: uses tsc -p tsconfig.app.json --noEmit (not bare tsc)

# Backend
python -m mypy src/
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route definitions for all 22 pages |
| `src/hooks/usePositions.ts` | Position data with real-time updates |
| `src/hooks/useStrategies.ts` | Strategy CRUD operations |
| `src/hooks/useWebSocketManager.ts` | WebSocket connection with reconnect |
| `src/hooks/useLivePriceFeed.ts` | Live market data (WS + REST fallback) |
| `src/hooks/useDashboardMetrics.ts` | Aggregated dashboard metrics |
| `src/hooks/useSystemHealth.ts` | System health monitoring |
| `src/integrations/supabase/client.ts` | Supabase client singleton |
| `backend/app/main.py` | FastAPI application entry point |
| `backend/app/config.py` | Unified configuration (Pydantic) |
| `docs/CODEBASE_MAP.md` | Full codebase map |
| `docs/ARCHITECTURE.md` | Architecture documentation |
| `docs/API_REFERENCE.md` | API endpoint documentation |

---

## Troubleshooting

**"Type does not exist" errors with pgvector**: Use `extensions.vector(1536)` for column types. The pgvector extension lives in the `extensions` schema.

**Tests hanging**: Check that mocks are properly set up in `vi.mock()` calls. Supabase queries that return promises which never resolve will cause test timeouts.

**WebSocket connection failures**: The system falls back to REST API polling after 3 failed WebSocket reconnection attempts. Check browser console for `[LivePriceFeed]` logs.

**TypeScript errors**: Always use `npm run typecheck` (not bare `tsc --noEmit`), which targets `tsconfig.app.json`.
