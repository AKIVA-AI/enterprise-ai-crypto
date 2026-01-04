# Backtest API Reference

## Overview

The Backtest API provides endpoints for running strategy backtests, retrieving results, and analyzing performance metrics.

**Base URL:** `/api/v1/backtest`

**Authentication:** All endpoints require Bearer token in Authorization header.

---

## Endpoints

### Run Backtest

**POST** `/run`

Execute a backtest for a specified strategy.

#### Request Body

```json
{
  "strategy_name": "RSIMomentumStrategy",
  "instruments": ["BTC-USD"],
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2024-01-01T00:00:00Z",
  "initial_capital": 100000.0,
  "timeframe": "1h",
  "slippage_bps": 5.0,
  "commission_bps": 10.0
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| strategy_name | string | ✅ | - | Strategy identifier |
| instruments | string[] | ✅ | - | Trading pairs (min 1) |
| start_date | datetime | ✅ | - | Backtest start date |
| end_date | datetime | ✅ | - | Backtest end date |
| initial_capital | float | ❌ | 100000 | Starting capital |
| timeframe | string | ❌ | "1h" | Candle timeframe |
| slippage_bps | float | ❌ | 5.0 | Slippage in basis points |
| commission_bps | float | ❌ | 10.0 | Commission in basis points |

#### Response (200 OK)

```json
{
  "id": "uuid-backtest-id",
  "strategy_name": "RSIMomentumStrategy",
  "status": "completed",
  "initial_capital": 100000.0,
  "final_equity": 112500.0,
  "total_trades": 45,
  "created_at": "2024-01-01T12:00:00Z"
}
```

---

### Get Backtest Details

**GET** `/{backtest_id}`

Retrieve full details for a completed backtest.

#### Response (200 OK)

```json
{
  "id": "uuid-backtest-id",
  "strategy_name": "RSIMomentumStrategy",
  "status": "completed",
  "instruments": ["BTC-USD"],
  "timeframe": "1h",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2024-01-01T00:00:00Z",
  "initial_capital": 100000.0,
  "final_equity": 112500.0,
  "metrics": {
    "total_return": 12.5,
    "sharpe_ratio": 1.45,
    "sortino_ratio": 2.1,
    "max_drawdown": 8.5,
    "win_rate": 55.0,
    "profit_factor": 1.65,
    "total_trades": 45
  },
  "execution_time_seconds": 2.5
}
```

---

### Get Equity Curve

**GET** `/{backtest_id}/equity-curve`

Retrieve equity curve data for visualization.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| sample_rate | int | 1 | Sample every Nth point (1-100) |

#### Response (200 OK)

```json
{
  "backtest_id": "uuid-backtest-id",
  "strategy_name": "RSIMomentumStrategy",
  "data": [
    {
      "timestamp": "2023-01-01T00:00:00Z",
      "equity": 100000.0,
      "drawdown": 0.0,
      "position_value": 0.0,
      "cash": 100000.0
    }
  ]
}
```

---

### Get Trades

**GET** `/{backtest_id}/trades`

Retrieve trade history from backtest.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | int | 100 | Max trades to return |
| offset | int | 0 | Pagination offset |

#### Response (200 OK)

```json
{
  "backtest_id": "uuid-backtest-id",
  "strategy_name": "RSIMomentumStrategy",
  "total_trades": 45,
  "trades": [
    {
      "id": "trade-uuid",
      "timestamp_open": "2023-01-15T10:00:00Z",
      "timestamp_close": "2023-01-15T14:00:00Z",
      "instrument": "BTC-USD",
      "side": "long",
      "size": 0.5,
      "entry_price": 42000.0,
      "exit_price": 42500.0,
      "pnl": 250.0,
      "pnl_percent": 1.19,
      "fees": 4.2
    }
  ]
}
```

---

### List Backtests

**GET** `/list`

List all backtests with optional filtering.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| strategy | string | Filter by strategy name |
| limit | int | Max results (default 50) |

---

### Delete Backtest

**DELETE** `/{backtest_id}`

Delete a backtest and its results.

#### Response (204 No Content)

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request parameters |
| 401 | Missing or invalid auth token |
| 404 | Backtest not found |
| 422 | Validation error |
| 500 | Internal server error |

