# Production Requirements Checklist

## Overview

This document outlines all requirements for moving from development to production trading.

---

## 1. Required Secrets (API Keys)

### Trading Venues (Choose Based on Jurisdiction)

| Secret | Service | Required For | US Compliant |
|--------|---------|--------------|--------------|
| `COINBASE_API_KEY` | Coinbase | Live US trading | ✅ Yes |
| `COINBASE_API_SECRET` | Coinbase | Live US trading | ✅ Yes |
| `KRAKEN_API_KEY` | Kraken | Live US trading | ✅ Yes |
| `KRAKEN_API_SECRET` | Kraken | Live US trading | ✅ Yes |
| `BINANCE_US_API_KEY` | Binance.US | Live US trading | ✅ Yes |
| `BINANCE_US_API_SECRET` | Binance.US | Live US trading | ✅ Yes |

### Signal Sources

| Secret | Service | Required For | Cost |
|--------|---------|--------------|------|
| `LUNARCRUSH_API_KEY` | LunarCrush | Social/meme signals | Free tier available |
| `TRADINGVIEW_WEBHOOK_SECRET` | TradingView | TA alert security | Free (you set it) |
| `CRYPTOCOMPARE_API_KEY` | CryptoCompare | On-chain signals | Free tier available |

### Infrastructure

| Secret | Service | Status |
|--------|---------|--------|
| `SUPABASE_URL` | Database | ✅ Already configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | ✅ Already configured |
| `LOVABLE_API_KEY` | AI features | ✅ Already configured |

---

## 2. Data Sources - Current vs Production

### Price Data

| Source | Current Status | Production Action |
|--------|----------------|-------------------|
| Binance WebSocket | ✅ Active (public) | No change needed |
| Coinbase REST | ✅ Active (public) | Add trading keys |
| Simulated fallback | ✅ Active | Disable in production |

### Signal Data

| Source | Current Status | Production Action |
|--------|----------------|-------------------|
| LunarCrush | ⚠️ Simulated | Add `LUNARCRUSH_API_KEY` |
| CryptoCompare | ⚠️ Simulated | Add `CRYPTOCOMPARE_API_KEY` |
| TradingView | ✅ Ready | Set up alerts in TradingView |
| Whale Data | ⚠️ Simulated | Add Moralis/Whale Alert API |

### On-Chain Data (Future Enhancement)

| Source | Purpose | Priority |
|--------|---------|----------|
| Moralis | Real blockchain data | High |
| Alchemy | Ethereum/EVM data | Medium |
| Whale Alert | Large transaction alerts | Medium |
| The Graph | DEX trade data | Low |

---

## 3. SDK Requirements

### NOT Required (Already Implemented)

| SDK | Why Not Needed |
|-----|----------------|
| `coinbase-sdk` | ❌ Direct REST with HMAC implemented |
| `binance-api` | ❌ Public WebSocket, no SDK needed |
| `kraken-sdk` | ❌ Direct REST with HMAC implemented |

### Potentially Useful (Optional)

| Package | Purpose | When to Add |
|---------|---------|-------------|
| `ccxt` | Unified exchange API | If adding many exchanges |
| `moralis` | On-chain data SDK | For real whale tracking |
| `lightweight-charts` | TradingView charts | ✅ Already installed |

---

## 4. Production Checklist

### Before Going Live

- [ ] **Kill Switch Tested**: Verify `global_kill_switch` stops all trading
- [ ] **Paper Mode Works**: Confirm `paper_trading_mode` prevents real orders
- [ ] **Risk Limits Set**: Configure per-book limits in `risk_limits` table
- [ ] **Alerts Configured**: Set up notification channels for critical events
- [ ] **API Keys Added**: All required secrets in Supabase secrets
- [ ] **Backup Exchange**: At least 2 venues configured

### Risk Parameters to Configure

```sql
-- Example risk limits configuration
INSERT INTO risk_limits (book_id, max_leverage, max_daily_loss, max_intraday_drawdown, max_concentration)
VALUES 
  ('your-book-id', 3.0, 5000, 0.05, 0.25);
```

### Global Settings to Verify

```sql
-- Check current settings
SELECT * FROM global_settings;

-- Ensure paper mode is ON until ready
UPDATE global_settings 
SET paper_trading_mode = true, 
    global_kill_switch = false
WHERE id = 'default';
```

---

## 5. Infrastructure Requirements

### Supabase

| Resource | Current | Production Recommendation |
|----------|---------|---------------------------|
| Database | Free tier | Pro tier ($25/mo) |
| Edge Functions | Active | Same |
| Realtime | Enabled | Same |
| Storage | Not used | Add for trade reports |

### Monitoring

| Tool | Purpose | Status |
|------|---------|--------|
| Edge Function Logs | Debug signals | ✅ Available |
| Postgres Logs | DB queries | ✅ Available |
| Audit Events | Trade history | ✅ Implemented |
| Alert Notifications | Critical events | ✅ Implemented |

---

## 6. Exchange Setup Guides

### Coinbase

1. Go to https://www.coinbase.com/settings/api
2. Create new API key with:
   - View permissions
   - Trade permissions
   - Portfolio read permissions
3. Save API Key and Secret
4. Add to Supabase secrets:
   - `COINBASE_API_KEY`
   - `COINBASE_API_SECRET`

### Kraken

1. Go to https://www.kraken.com/u/security/api
2. Create new API key with:
   - Query Funds
   - Create & Modify Orders
   - Query Open Orders & Trades
3. Save Key and Private Key
4. Add to Supabase secrets:
   - `KRAKEN_API_KEY`
   - `KRAKEN_API_SECRET`

### TradingView

1. Create alerts on your charts
2. Set webhook URL to:
   ```
   https://amvakxshlojoshdfcqos.supabase.co/functions/v1/tradingview-webhook
   ```
3. Set alert message format (JSON recommended):
   ```json
   {
     "ticker": "{{ticker}}",
     "action": "{{strategy.order.action}}",
     "price": {{close}},
     "strategy": "{{strategy.order.comment}}",
     "secret": "YOUR_WEBHOOK_SECRET"
   }
   ```
4. Add `TRADINGVIEW_WEBHOOK_SECRET` to Supabase secrets

---

## 7. Cost Estimates

### Minimum Production Setup

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Supabase Pro | $25 | Required for production |
| LunarCrush | $0-99 | Free tier may suffice |
| CryptoCompare | $0-79 | Free tier available |
| TradingView | $0-60 | Alerts included in Pro |
| **Total** | **$25-263** | |

### Recommended Production Setup

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Supabase Pro | $25 | |
| LunarCrush Pro | $99 | Higher rate limits |
| Moralis | $49 | Real on-chain data |
| **Total** | **$173** | |

---

## 8. Go-Live Sequence

1. **Configure Secrets**
   - Add all exchange API keys
   - Add signal source API keys
   - Verify with `get_status` endpoints

2. **Test in Paper Mode**
   - Run for 1-2 weeks minimum
   - Verify signal quality
   - Check order execution simulation

3. **Enable Partial Live**
   - Start with 1 strategy, 1 book
   - Use small position sizes
   - Monitor closely for 1 week

4. **Scale Up**
   - Increase position sizes gradually
   - Add more strategies
   - Enable more instruments

5. **Full Production**
   - All strategies active
   - Full position sizes
   - Automated monitoring
