# AKIVA AI Crypto

> **Institutional-grade crypto trading platform** combining enterprise risk management with battle-tested algorithmic execution.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FreqTrade](https://img.shields.io/badge/FreqTrade-Enhanced-blue.svg)](docs/SYSTEM_OVERVIEW.md)
[![Coinbase Futures](https://img.shields.io/badge/Coinbase-Futures-green.svg)](docs/COINBASE_SETUP_GUIDE.md)

## What Is This?

A **dual-engine trading platform** that gives you:

1. **Enterprise Backend** - Multi-agent AI, risk controls, compliance, audit trails
2. **FreqTrade Engine** - Battle-tested strategies, backtesting, live trading
3. **Professional Dashboard** - Real-time monitoring and control

**📖 [Read the full System Overview →](docs/SYSTEM_OVERVIEW.md)**

### Risk & Compliance

- **Kill Switch** - Emergency stop all trading instantly
- **Position Limits** - Configurable max position sizes
- **Daily Loss Limits** - Automatic trading halt on drawdown
- **Full Audit Trail** - Every decision logged and traceable
- **Role-Based Access** - Admin, Trader, Viewer roles

### Trading Engine (FreqTrade)

- **WhaleFlowScalper** - Optimized momentum/volume strategy
- **Coinbase Advanced Futures** - US-friendly leverage trading
- **Backtesting** - Full historical testing with analytics
- **Hyperopt** - Automated parameter optimization
- **Multi-Exchange** - Coinbase, Kraken, Binance support

### Dashboard

- **Real-Time Monitoring** - Live positions, P&L, alerts
- **Strategy Control** - Start/stop strategies from UI
- **Risk Visualization** - VaR, exposure, drawdown charts
- **Decision Traces** - See why trades were blocked/executed

## Quick Start

### Option 1: FreqTrade Only (Simplest)

```bash
# Install FreqTrade (if not already)
pip install freqtrade

# Run in dry-run mode
python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run
```

### Option 2: Full Platform

```bash
# Terminal 1: Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: FreqTrade
python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run

# Terminal 3: Frontend
npm install && npm run dev
```

### Option 3: Docker

```bash
docker-compose up -d
```

## Configuration

Add your Coinbase API credentials:

```json
{
  "exchange": {
    "name": "coinbase",
    "key": "YOUR_API_KEY",
    "secret": "YOUR_API_SECRET"
  }
}
```

## Project Structure

```
akiva-ai-crypto/
├── backend/           # Python FastAPI backend
├── src/               # React frontend
├── user_data/         # FreqTrade configs & strategies
│   ├── strategies/    # Trading strategies
│   └── config_*.json  # Exchange configs
├── run_bot.py         # Custom FreqTrade launcher
└── docs/              # Documentation
```

## Documentation

### Core Documentation
| Document | Description |
|----------|-------------|
| [System Overview](docs/SYSTEM_OVERVIEW.md) | How the system works |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture |
| [Manifesto](docs/MANIFESTO.md) | Core values and philosophy |
| [Coinbase Setup](docs/COINBASE_SETUP_GUIDE.md) | Exchange configuration |
| [Strategies](docs/WhaleFlowScalper_STRATEGY.md) | Strategy documentation |

### Deployment & Operations
| Document | Description |
|----------|-------------|
| [🚀 Deployment Runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md) | Complete deployment guide |
| [⚙️ Environment Variables](docs/deployment/ENVIRONMENT_VARIABLES.md) | Configuration reference |
| [📡 API Reference](docs/deployment/API_REFERENCE.md) | API documentation |
| [📋 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Production deployment |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase (for dashboard persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key

# API endpoint for frontend
VITE_API_URL=http://localhost:8000/api
```

## Development

```bash
# Run tests
npm test                    # Frontend tests
cd backend && pytest        # Backend tests

# Lint
npm run lint               # Frontend
black backend/             # Backend
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md). We accept:

- Bug fixes, documentation, tests
- UI/UX improvements
- New strategies (must include backtests)

We reject anything that weakens risk controls.

## License

MIT License - see [LICENSE](LICENSE)

## Disclaimer

**Trading cryptocurrency involves substantial risk of loss.** This software is provided as-is. Always use dry-run mode first. Never trade with money you can't afford to lose.

---

*AKIVA AI - Institutional trading, simplified.*
