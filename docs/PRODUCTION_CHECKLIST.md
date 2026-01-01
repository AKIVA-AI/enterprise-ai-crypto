# Production Launch Checklist

> **Go-live verification for the trading platform**

---

## Pre-Launch Verification (REQUIRED)

### 🔴 Critical Safety Checks

- [ ] **Kill Switch Test** - Activate global kill switch, verify all trading stops
- [ ] **Reduce-Only Test** - Enable reduce-only mode, verify only closing trades work
- [ ] **Role Permissions Test** - Verify non-admin cannot activate kill switch
- [ ] **Price Resolution Test** - Attempt trade without price, verify rejection

### 🟡 Risk Controls

- [ ] **Exposure Limits** - Verify order rejected when exceeding book limits
- [ ] **Position Limits** - Verify order rejected when exceeding position size
- [ ] **Book Status** - Verify frozen/halted books reject orders
- [ ] **Venue Health** - Verify offline venues reject orders

### 🟢 Data Quality

- [ ] **Market Data Loading** - All tracked symbols show real prices (not $0)
- [ ] **Chart Data** - Charts show real historical data (not mock)
- [ ] **Orderbook Data** - Orderbooks marked as "Derived" (honest labeling)
- [ ] **Unsupported Symbols** - Show "—" not "$0"

---

## Configuration Checklist

### Secrets (Supabase Edge Functions)

- [ ] `COINGECKO_API_KEY` - For market data
- [ ] `COINBASE_API_KEY` / `COINBASE_API_SECRET` - For Coinbase trading
- [ ] `KRAKEN_API_KEY` / `KRAKEN_API_SECRET` - For Kraken trading
- [ ] `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` - For alerts

### Database Settings

- [ ] `global_settings.global_kill_switch` = false (ready state)
- [ ] `global_settings.paper_trading_mode` = true (start in paper)
- [ ] `global_settings.reduce_only_mode` = false (normal state)

### User Roles

- [ ] At least one Admin user configured
- [ ] At least one CIO user for risk oversight
- [ ] Viewer accounts for monitoring

---

## Go-Live Stages

### Stage 1: Observer Mode (Week 1)

**Goal:** Verify system stability without any trading risk

- All users in Observer mode
- Monitor signal generation
- Review decision traces
- Check alert delivery
- Verify data freshness

**Exit Criteria:**
- [ ] No critical errors for 7 days
- [ ] Decision traces generating correctly
- [ ] Alerts delivered successfully
- [ ] Market data consistently available

### Stage 2: Paper Trading (Week 2-4)

**Goal:** Validate trading logic without real capital

- Enable Paper Trading mode
- Execute simulated trades
- Review execution quality
- Test position management
- Verify P&L calculations

**Exit Criteria:**
- [ ] 100+ paper trades executed
- [ ] No phantom orders or duplicate fills
- [ ] Position tracking accurate
- [ ] Risk limits respected

### Stage 3: Guarded Live (Week 5-8)

**Goal:** Real trading with minimal risk

- Upgrade select users to Guarded mode
- Maximum position: $500
- Close monitoring by CIO
- Daily P&L review

**Exit Criteria:**
- [ ] Positive P&L or explainable losses
- [ ] No system errors during trading
- [ ] Kill switch test successful mid-week
- [ ] User feedback positive

### Stage 4: Scaled Live (Week 9+)

**Goal:** Normal operations

- Upgrade users to Advanced mode
- Increase position limits gradually
- Enable additional strategies
- Continue monitoring

---

## Incident Response Setup

### Alert Channels

- [ ] Telegram bot configured and tested
- [ ] Critical alerts go to CIO directly
- [ ] Escalation path documented

### Runbooks

- [ ] Kill switch activation procedure
- [ ] Venue outage response
- [ ] Data provider fallback procedure
- [ ] Emergency position closure

### Monitoring

- [ ] Edge function logs accessible
- [ ] Database query access for debugging
- [ ] Performance metrics dashboard

---

## Post-Launch Monitoring

### Daily Checks

- [ ] Review P&L summary
- [ ] Check for rejected orders
- [ ] Verify market data quality
- [ ] Review decision trace samples

### Weekly Reviews

- [ ] Strategy performance analysis
- [ ] Risk limit utilization
- [ ] Execution quality metrics
- [ ] System health summary

### Monthly Reviews

- [ ] Full audit log review
- [ ] Security access review
- [ ] Performance optimization
- [ ] Strategy rotation decisions

---

## Emergency Procedures

### Immediate Halt

```
1. Navigate to Risk → Kill Switch
2. Click "Activate Global Kill Switch"
3. Enter reason: "[Your reason]"
4. Confirm activation
5. Notify team via Telegram
```

### Partial Halt (Single Book)

```
1. Navigate to Books
2. Select affected book
3. Click "Halt Trading"
4. Strategies auto-disabled
5. Existing positions preserved
```

### Resume Trading

```
1. Identify root cause
2. Apply fix if needed
3. Navigate to Risk → Kill Switch
4. Click "Deactivate Kill Switch"
5. Verify trading resumes
6. Monitor closely for 1 hour
```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CIO | | | |
| Lead Developer | | | |
| Operations | | | |
| Compliance | | | |

---

*Production launch authorized when all boxes checked and sign-offs complete.*
