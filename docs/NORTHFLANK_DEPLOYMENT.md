# NorthFlank Deployment Guide

This guide covers deploying the Crypto Ops Platform to NorthFlank with both frontend and backend services.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       NorthFlank                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Frontend   │  │   Backend   │  │    Redis    │         │
│  │  (React)    │  │  (FastAPI)  │  │   (Addon)   │         │
│  │   :3000     │  │    :8000    │  │   :6379     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                 │                │
│         └────────────────┼─────────────────┘                │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   Supabase (External)   │
              │   - Database (Postgres) │
              │   - Auth                │
              │   - Edge Functions      │
              │   - Storage             │
              └─────────────────────────┘
```

## Prerequisites

1. NorthFlank account with billing set up
2. GitHub repository connected to NorthFlank
3. Supabase project (already configured)
4. Exchange API keys (Coinbase, Kraken, etc.)

## Deployment Steps

### 1. Create Project on NorthFlank

```bash
# Using NorthFlank CLI
nf project create --name crypto-ops-platform

# Or use the NorthFlank dashboard
```

### 2. Configure Secrets

In NorthFlank dashboard, add these secrets:

| Secret | Description | Required |
|--------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `COINBASE_API_KEY` | Coinbase API key | ✅ (for US trading) |
| `COINBASE_API_SECRET` | Coinbase API secret | ✅ (for US trading) |
| `KRAKEN_API_KEY` | Kraken API key | Optional |
| `KRAKEN_API_SECRET` | Kraken API secret | Optional |

### 3. Deploy Using Template

```bash
# Import the northflank.json template
nf project import --file northflank.json

# Or manually create services via dashboard
```

### 4. Connect Redis Addon

The Redis addon is automatically provisioned. Get the connection URL from:
- NorthFlank Dashboard → Addons → Redis → Connection Details

Set `REDIS_URL` environment variable on the API service.

### 5. Configure Custom Domains (Optional)

1. Go to Services → Frontend → Ports → http
2. Add custom domain (e.g., `app.yourdomain.com`)
3. Configure DNS CNAME record pointing to NorthFlank

## Environment Variables

### Frontend Service

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbG...` |
| `VITE_API_URL` | Backend API URL | `https://api-xxx.northflank.app` |

### Backend Service (API)

| Variable | Description | Example |
|----------|-------------|---------|
| `ENV` | Environment mode | `production` |
| `PAPER_TRADING` | Paper trading mode | `false` |
| `SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbG...` |
| `REDIS_URL` | Redis connection URL | `redis://...` |
| `COINBASE_API_KEY` | Coinbase API key | `your-key` |
| `COINBASE_API_SECRET` | Coinbase API secret | `your-secret` |

## Trading Mode Configuration

### US Mode (Default for US Users)
- **Venues**: Coinbase, Kraken, Binance.US
- **Features**: Spot, Limited Futures, Staking
- **Compliance**: Full SEC/CFTC compliance

### International Mode
- **Venues**: Binance, Bybit, OKX, HyperLiquid + US venues
- **Features**: Full derivatives, perpetuals, options
- **Compliance**: User responsible for local regulations

Set `TRADING_MODE` environment variable:
```bash
TRADING_MODE=us        # US-compliant mode
TRADING_MODE=international  # Full access mode
```

## Health Checks

Both services have health check endpoints:

- **Frontend**: `GET /` (HTTP 200)
- **Backend**: `GET /health` (JSON response)

NorthFlank automatically monitors these and restarts unhealthy containers.

## Scaling

### Horizontal Scaling
```bash
# Scale API to 3 instances
nf service scale --service api --instances 3
```

### Vertical Scaling
Upgrade `deploymentPlan` in northflank.json:
- `nf-compute-100`: 0.1 vCPU, 256MB RAM
- `nf-compute-200`: 0.2 vCPU, 512MB RAM
- `nf-compute-400`: 0.4 vCPU, 1GB RAM
- `nf-compute-800`: 0.8 vCPU, 2GB RAM

## Monitoring

### Logs
```bash
# Stream API logs
nf logs --service api --follow

# Stream frontend logs
nf logs --service frontend --follow
```

### Metrics
NorthFlank provides built-in metrics:
- CPU/Memory usage
- Request rates
- Response times
- Error rates

## Rollback

```bash
# List builds
nf builds list --service api

# Rollback to specific build
nf service rollback --service api --build-id <build-id>
```

## Cost Estimation

| Service | Plan | Monthly Cost (est.) |
|---------|------|---------------------|
| Frontend | nf-compute-200 | ~$10 |
| API | nf-compute-400 | ~$20 |
| Redis | nf-compute-200 + 2GB | ~$15 |
| **Total** | | **~$45/month** |

*Costs vary based on usage and region.*

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure REDIS_URL includes TLS (`rediss://`)
   - Check addon is running

2. **CORS Errors**
   - Verify frontend URL in backend CORS config
   - Check Supabase edge function CORS headers

3. **API Health Check Failing**
   - Check logs: `nf logs --service api`
   - Verify all required env vars are set

4. **Build Failures**
   - Check Dockerfile paths
   - Verify dependencies in requirements.txt

## Security Checklist

- [ ] All secrets stored in NorthFlank secret management
- [ ] TLS enabled on all public endpoints
- [ ] Redis TLS enabled
- [ ] PAPER_TRADING=true for initial testing
- [ ] Rate limiting configured
- [ ] Supabase RLS policies verified
