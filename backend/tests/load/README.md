# Load Testing Guide

## Overview

This directory contains load testing scripts for the Enterprise Crypto Trading Platform using [Locust](https://locust.io/).

## Installation

```bash
pip install locust
```

## Running Load Tests

### Start the API Server

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Run Locust Web UI

```bash
cd backend
locust -f tests/load/locustfile.py --host=http://localhost:8000
```

Open http://localhost:8089 in your browser to configure and run tests.

### Run Headless (CI/CD)

```bash
locust -f tests/load/locustfile.py \
  --host=http://localhost:8000 \
  --headless \
  --users 50 \
  --spawn-rate 5 \
  --run-time 60s \
  --html=load_test_report.html
```

## User Classes

| User Class | Description | Wait Time |
|------------|-------------|-----------|
| `TradingPlatformUser` | Typical user - positions, orders, risk | 1-3s |
| `HighFrequencyTrader` | HFT simulation - rapid reads | 0.1-0.5s |
| `MonitoringUser` | Prometheus/monitoring scraper | 5-15s |

## Tags

Filter tests by tag:

```bash
# Only health checks
locust -f tests/load/locustfile.py --tags health

# Only trading endpoints
locust -f tests/load/locustfile.py --tags trading

# Exclude HFT tests
locust -f tests/load/locustfile.py --exclude-tags hft
```

## Performance Targets

| Endpoint | Target Latency (p95) | Target RPS |
|----------|---------------------|------------|
| `/health` | < 50ms | 1000+ |
| `/ready` | < 200ms | 100+ |
| `/metrics` | < 100ms | 100+ |
| `/api/trading/*` | < 500ms | 50+ |
| `/api/risk/*` | < 1000ms | 20+ |

## Environment Variables

Set auth token for authenticated endpoints:

```bash
export TEST_AUTH_TOKEN="your-jwt-token"
```

## Interpreting Results

### Key Metrics

- **RPS**: Requests per second
- **Response Time**: p50, p95, p99 latencies
- **Failure Rate**: Should be < 1% for health checks
- **Concurrent Users**: Peak simultaneous connections

### Warning Signs

- ❌ p95 latency > 2x target
- ❌ Failure rate > 5%
- ❌ Response time increasing over time (memory leak?)
- ❌ Errors during ramp-up (capacity issue)

## Scaling Recommendations

Based on load test results:

| Concurrent Users | Recommended Setup |
|-----------------|-------------------|
| < 100 | 1 worker, 512MB RAM |
| 100-500 | 2 workers, 1GB RAM |
| 500-1000 | 4 workers, 2GB RAM |
| 1000+ | Horizontal scaling + Redis |

