# Enterprise Crypto - API Quick Reference

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Trading Endpoints](#trading-endpoints)
3. [Strategy Endpoints](#strategy-endpoints)
4. [Portfolio Endpoints](#portfolio-endpoints)
5. [Market Data Endpoints](#market-data-endpoints)
6. [Health & Monitoring Endpoints](#health--monitoring-endpoints)
7. [WebSocket API](#websocket-api)
8. [Error Codes](#error-codes)
9. [Rate Limiting](#rate-limiting)

## Base URL
- **Development**: `http://localhost:8000`
- **Staging**: `https://staging-api.enterprise-crypto.com`
- **Production**: `https://api.enterprise-crypto.com`

## Authentication

### API Authentication
All API requests (except public endpoints) require authentication via JWT token or API key.

#### Headers
```http
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

## Trading Endpoints

### GET /api/trading/accounts
Get all trading accounts.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "exchange": "binance",
      "type": "spot",
      "status": "active",
      "balance": {
        "USD": 10000.00,
        "BTC": 0.5
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/trading/orders
Place a new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "exchange": "binance",
  "symbol": "BTC-USD",
  "side": "buy",
  "type": "limit",
  "amount": 0.01,
  "price": 45000.00,
  "time_in_force": "GTC"
}
```

**Response:**
```json
{
  "id": "order_123",
  "exchange": "binance",
  "symbol": "BTC-USD",
  "side": "buy",
  "type": "limit",
  "amount": 0.01,
  "price": 45000.00,
  "status": "open",
  "filled": 0.0,
  "remaining": 0.01,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/trading/orders
Get all orders.

**Query Parameters:**
- `status`: Filter by status (`open`, `filled`, `cancelled`)
- `exchange`: Filter by exchange
- `symbol`: Filter by symbol
- `limit`: Number of orders to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "orders": [
    {
      "id": "order_123",
      "exchange": "binance",
      "symbol": "BTC-USD",
      "side": "buy",
      "type": "limit",
      "amount": 0.01,
      "price": 45000.00,
      "status": "filled",
      "filled": 0.01,
      "remaining": 0.0,
      "average_price": 45000.00,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:31:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### DELETE /api/trading/orders/{order_id}
Cancel an order.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "order_123",
  "status": "cancelled",
  "cancelled_at": "2024-01-15T10:35:00Z"
}
```

### GET /api/trading/positions
Get current positions.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "positions": [
    {
      "id": "pos_123",
      "exchange": "binance",
      "symbol": "BTC-USD",
      "side": "long",
      "size": 0.01,
      "entry_price": 45000.00,
      "current_price": 45500.00,
      "unrealized_pnl": 5.00,
      "percentage_pnl": 1.11,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Strategy Endpoints

### GET /api/strategies
Get all strategies.

**Query Parameters:**
- `status`: Filter by status (`active`, `inactive`, `archived`)
- `type`: Filter by type (`trend`, `momentum`, `arbitrage`)
- `limit`: Number of strategies to return (default: 20)
- `offset`: Pagination offset (default: 0)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "strategies": [
    {
      "id": "strat_123",
      "name": "Moving Average Crossover",
      "description": "Trend following strategy using MA crossover",
      "type": "trend",
      "status": "active",
      "parameters": {
        "fast_ma": 10,
        "slow_ma": 20
      },
      "performance": {
        "total_return": 0.15,
        "sharpe_ratio": 1.2,
        "max_drawdown": 0.05
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### POST /api/strategies
Create a new strategy.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "RSI Strategy",
  "description": "Momentum strategy using RSI indicator",
  "type": "momentum",
  "parameters": {
    "rsi_period": 14,
    "oversold": 30,
    "overbought": 70
  }
}
```

**Response:**
```json
{
  "id": "strat_124",
  "name": "RSI Strategy",
  "description": "Momentum strategy using RSI indicator",
  "type": "momentum",
  "status": "inactive",
  "parameters": {
    "rsi_period": 14,
    "oversold": 30,
    "overbought": 70
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/strategies/{strategy_id}
Get strategy details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "strat_123",
  "name": "Moving Average Crossover",
  "description": "Trend following strategy using MA crossover",
  "type": "trend",
  "status": "active",
  "parameters": {
    "fast_ma": 10,
    "slow_ma": 20
  },
  "performance": {
    "total_return": 0.15,
    "sharpe_ratio": 1.2,
    "max_drawdown": 0.05,
    "win_rate": 0.65,
    "total_trades": 150
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### PUT /api/strategies/{strategy_id}
Update strategy.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Strategy Name",
  "parameters": {
    "fast_ma": 12,
    "slow_ma": 24
  }
}
```

**Response:**
```json
{
  "id": "strat_123",
  "name": "Updated Strategy Name",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### DELETE /api/strategies/{strategy_id}
Delete strategy.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Strategy deleted successfully"
}
```

## Backtesting Endpoints

### POST /api/backtest/run
Run a backtest.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "strategy_name": "Moving Average Crossover",
  "instruments": ["BTC-USD", "ETH-USD"],
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_capital": 100000,
  "timeframe": "1h",
  "parameters": {
    "fast_ma": 10,
    "slow_ma": 20
  }
}
```

**Response:**
```json
{
  "id": "backtest_123",
  "status": "running",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/backtest/{backtest_id}
Get backtest results.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "backtest_123",
  "strategy_name": "Moving Average Crossover",
  "status": "completed",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_capital": 100000,
  "final_equity": 115000,
  "metrics": {
    "total_return": 0.15,
    "annualized_return": 0.15,
    "sharpe_ratio": 1.2,
    "sortino_ratio": 1.8,
    "max_drawdown": 0.05,
    "max_drawdown_duration_days": 30,
    "total_trades": 150,
    "winning_trades": 98,
    "losing_trades": 52,
    "win_rate": 0.65,
    "profit_factor": 1.8,
    "avg_win": 250.0,
    "avg_loss": 150.0,
    "volatility": 0.12,
    "var95": 0.02,
    "cvar95": 0.03
  },
  "execution_time_seconds": 45,
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:45Z"
}
```

### GET /api/backtest/{backtest_id}/equity-curve
Get equity curve data for backtest.

**Query Parameters:**
- `sample_rate`: Data sampling rate (default: 1)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2023-01-01T00:00:00Z",
      "equity": 100000,
      "drawdown": 0.0,
      "position_value": 0.0,
      "cash": 100000
    },
    {
      "timestamp": "2023-01-01T01:00:00Z",
      "equity": 100500,
      "drawdown": 0.0,
      "position_value": 500.0,
      "cash": 100000
    }
  ]
}
```

### GET /api/backtest/list
List all backtests.

**Query Parameters:**
- `strategy_name`: Filter by strategy name
- `status`: Filter by status
- `limit`: Number of backtests to return (default: 20)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "backtests": [
    {
      "id": "backtest_123",
      "strategy_name": "Moving Average Crossover",
      "status": "completed",
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
      "initial_capital": 100000,
      "final_equity": 115000,
      "total_return": 0.15,
      "sharpe_ratio": 1.2,
      "max_drawdown": 0.05,
      "total_trades": 150,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Portfolio Endpoints

### GET /api/portfolio
Get portfolio overview.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_value": 125000.00,
  "total_pnl": 25000.00,
  "daily_pnl": 500.00,
  "daily_pnl_percent": 0.4,
  "allocations": [
    {
      "asset": "BTC",
      "value": 75000.00,
      "percentage": 60.0,
      "pnl": 15000.00
    },
    {
      "asset": "ETH",
      "value": 50000.00,
      "percentage": 40.0,
      "pnl": 10000.00
    }
  ],
  "performance": {
    "total_return": 0.25,
    "daily_return": 0.004,
    "weekly_return": 0.02,
    "monthly_return": 0.08,
    "year_to_date": 0.25
  }
}
```

### GET /api/portfolio/history
Get portfolio historical data.

**Query Parameters:**
- `period`: Time period (`1d`, `1w`, `1m`, `3m`, `1y`, `all`)
- `granularity`: Data granularity (`1h`, `1d`, `1w`)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "value": 100000.00,
      "pnl": 0.00
    },
    {
      "timestamp": "2024-01-02T00:00:00Z",
      "value": 100500.00,
      "pnl": 500.00
    }
  ]
}
```

### GET /api/portfolio/transactions
Get transaction history.

**Query Parameters:**
- `type`: Transaction type (`buy`, `sell`, `deposit`, `withdrawal`)
- `limit`: Number of transactions to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "type": "buy",
      "exchange": "binance",
      "symbol": "BTC-USD",
      "amount": 0.01,
      "price": 45000.00,
      "value": 450.00,
      "fee": 0.45,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## Market Data Endpoints

### GET /api/markets/tickers
Get market tickers.

**Query Parameters:**
- `symbols`: Comma-separated list of symbols
- `exchange`: Filter by exchange

**Response:**
```json
{
  "tickers": [
    {
      "symbol": "BTC-USD",
      "exchange": "binance",
      "price": 45500.00,
      "change_24h": 500.00,
      "change_percent_24h": 1.11,
      "volume_24h": 1250000000,
      "high_24h": 46000.00,
      "low_24h": 44500.00,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/markets/orderbook
Get order book for a symbol.

**Query Parameters:**
- `symbol`: Trading symbol
- `exchange`: Exchange name
- `limit`: Number of levels (default: 20)

**Response:**
```json
{
  "symbol": "BTC-USD",
  "exchange": "binance",
  "bids": [
    [45499.99, 0.5],
    [45499.98, 0.3]
  ],
  "asks": [
    [45500.01, 0.4],
    [45500.02, 0.6]
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/markets/klines
Get candlestick data.

**Query Parameters:**
- `symbol`: Trading symbol
- `exchange`: Exchange name
- `interval`: Time interval (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`)
- `limit`: Number of candles (default: 500)

**Response:**
```json
{
  "symbol": "BTC-USD",
  "exchange": "binance",
  "interval": "1h",
  "data": [
    [
      1642291200000,
      45000.00,
      45500.00,
      44800.00,
      45200.00,
      1250000
    ]
  ]
}
```

## Health & Monitoring Endpoints

### GET /health
Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### GET /health/detailed
Detailed health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "exchanges": {
      "binance": "healthy",
      "coinbase": "healthy"
    }
  },
  "metrics": {
    "uptime_seconds": 86400,
    "memory_usage_mb": 512,
    "cpu_usage_percent": 25.5,
    "active_connections": 150
  }
}
```

### GET /metrics
Prometheus metrics endpoint.

**Response:** Prometheus metrics format

## WebSocket API

### Connection
Connect to WebSocket endpoint for real-time data.

**URL:** `ws://localhost:8000/ws`

**Authentication:** Send JWT token in first message:
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Subscribe to Channels

#### Market Data
```json
{
  "type": "subscribe",
  "channel": "ticker",
  "symbol": "BTC-USD",
  "exchange": "binance"
}
```

#### Portfolio Updates
```json
{
  "type": "subscribe",
  "channel": "portfolio"
}
```

#### Order Updates
```json
{
  "type": "subscribe",
  "channel": "orders"
}
```

#### Strategy Updates
```json
{
  "type": "subscribe",
  "channel": "strategies"
}
```

### WebSocket Messages

#### Ticker Update
```json
{
  "type": "ticker",
  "symbol": "BTC-USD",
  "exchange": "binance",
  "price": 45500.00,
  "change_24h": 500.00,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Order Update
```json
{
  "type": "order_update",
  "order": {
    "id": "order_123",
    "status": "filled",
    "filled": 0.01,
    "average_price": 45500.00
  }
}
```

#### Portfolio Update
```json
{
  "type": "portfolio_update",
  "total_value": 125500.00,
  "daily_pnl": 1000.00
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### API Error Response Format
```json
{
  "error": {
    "code": "INVALID_ORDER",
    "message": "Order parameters are invalid",
    "details": {
      "field": "price",
      "reason": "Price must be positive"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` - Request format is invalid
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INVALID_ORDER` - Order parameters invalid
- `INSUFFICIENT_BALANCE` - Not enough balance
- `EXCHANGE_ERROR` - Exchange API error
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

### Rate Limits
- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 10 requests per minute
- **WebSocket connections**: 10 connections per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642291200
```

### Rate Limit Response
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "retry_after": 60
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { EnterpriseCryptoAPI } from '@enterprise-crypto/sdk';

const api = new EnterpriseCryptoAPI({
  baseURL: 'https://api.enterprise-crypto.com',
  apiKey: 'your-api-key'
});

// Get portfolio
const portfolio = await api.getPortfolio();

// Place order
const order = await api.placeOrder({
  exchange: 'binance',
  symbol: 'BTC-USD',
  side: 'buy',
  type: 'limit',
  amount: 0.01,
  price: 45000
});

// Run backtest
const backtest = await api.runBacktest({
  strategyName: 'Moving Average Crossover',
  instruments: ['BTC-USD'],
  startDate: '2023-01-01',
  endDate: '2023-12-31'
});
```

### Python
```python
from enterprise_crypto import EnterpriseCryptoAPI

api = EnterpriseCryptoAPI(
    base_url='https://api.enterprise-crypto.com',
    api_key='your-api-key'
)

# Get portfolio
portfolio = api.get_portfolio()

# Place order
order = api.place_order(
    exchange='binance',
    symbol='BTC-USD',
    side='buy',
    type='limit',
    amount=0.01,
    price=45000
)

# Run backtest
backtest = api.run_backtest(
    strategy_name='Moving Average Crossover',
    instruments=['BTC-USD'],
    start_date='2023-01-01',
    end_date='2023-12-31'
)
```

## Testing

### Test Environment
- **Base URL**: `https://test-api.enterprise-crypto.com`
- **Test API Key**: `test-api-key-12345`
- **Test JWT**: Use `/auth/login` with test credentials

### Test Commands
```bash
# Health check
curl https://test-api.enterprise-crypto.com/health

# Authentication
curl -X POST https://test-api.enterprise-crypto.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get portfolio
curl https://test-api.enterprise-crypto.com/api/portfolio \
  -H "Authorization: Bearer <token>"

# Place order
curl -X POST https://test-api.enterprise-crypto.com/api/trading/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"exchange":"binance","symbol":"BTC-USD","side":"buy","type":"limit","amount":0.01,"price":45000}'
```

Last updated: 2025-01-04
Version: 1.0.0
