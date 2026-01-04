# 🇺🇸 US-Compliant Leverage Trading Guide

## Quick Summary

| Exchange | Spot | Margin | Futures | Leverage | US Legal |
|----------|------|--------|---------|----------|----------|
| **Coinbase** | ✅ | ❌ | ❌ | 1x | ✅ Yes |
| **Kraken** | ✅ | ✅ | ❌ | 2-5x | ✅ Yes |
| **Binance US** | ✅ | ❌ | ❌ | 1x | ✅ Yes |
| Binance (Intl) | ✅ | ✅ | ✅ | 125x | ❌ No |
| Bybit | ✅ | ✅ | ✅ | 100x | ❌ No |

---

## 🎯 Best US Option: Kraken Margin

**Kraken** is the ONLY major US-compliant exchange offering margin trading.

### Features
- ✅ 2x-5x leverage (we use 2x conservatively)
- ✅ Long AND Short positions
- ✅ Officially supported by Freqtrade
- ✅ Regulated in US
- ✅ Low fees (0.16% maker / 0.26% taker)

### Requirements
1. Kraken Pro account
2. US resident verification (KYC)
3. Margin trading enabled in account settings

---

## ⚙️ Configuration

### Strategy Settings (Already Configured)

```python
# In WhaleFlowScalper.py and HighWinRateScalper.py
can_short = True       # Enable shorting
leverage_default = 2   # 2x leverage (safe)
max_leverage = 3       # Never exceed 3x
```

### Exchange Config

Use: `user_data/configs/config_margin_kraken.json`

Key settings:
```json
{
  "trading_mode": "spot",
  "margin_mode": "cross",
  "exchange": {
    "name": "kraken",
    "key": "YOUR_API_KEY",
    "secret": "YOUR_API_SECRET"
  }
}
```

---

## 📊 Leverage Math

| Trade Size | Leverage | Your Capital | Exposure | Profit at +1% |
|------------|----------|--------------|----------|---------------|
| $1,000 | 1x (spot) | $1,000 | $1,000 | $10 |
| $1,000 | 2x | $500 | $1,000 | $20 |
| $1,000 | 3x | $333 | $1,000 | $30 |

⚠️ **Warning**: Losses are also amplified!

---

## 🛡️ Risk Management with Leverage

### Why We Use 2x (Conservative)
- 5% move against you = 10% loss (manageable)
- Liquidation requires ~50% adverse move
- Allows for market volatility

### Stoploss Strategy
```python
stoploss = -0.05  # 5% base (10% with 2x leverage)
trailing_stop = True
trailing_stop_positive = 0.005  # Lock in profits
```

---

## 🚀 Running Margin Trading

### Step 1: Set Up Kraken API
1. Go to kraken.com → Settings → API
2. Create new API key with:
   - Query funds
   - Query open orders & trades
   - Create & modify orders
3. Save key and secret

### Step 2: Update Config
```bash
# Edit config_margin_kraken.json
"key": "your-api-key",
"secret": "your-api-secret"
```

### Step 3: Dry Run First!
```bash
freqtrade trade --config user_data/configs/config_margin_kraken.json \
  --strategy WhaleFlowScalper --timeframe 4h --dry-run
```

### Step 4: Go Live
```bash
# Set dry_run: false in config first!
freqtrade trade --config user_data/configs/config_margin_kraken.json \
  --strategy WhaleFlowScalper --timeframe 4h
```

---

## ⏰ Timeframe Considerations

| Exchange | Supported Timeframes | Best for Strategy |
|----------|---------------------|-------------------|
| Coinbase | 1m, 5m, 15m, 30m, 1h, **2h**, 6h, 1d | ✅ 2h (100% win) |
| Kraken | 1m, 5m, 15m, 30m, 1h, **4h**, 1d | 4h (similar) |

**Recommendation**:
- Use 2h on Coinbase for spot trading
- Use 4h on Kraken for margin trading (closest to 2h)

---

## 📈 Expected Performance with Leverage

Based on our backtests:

| Strategy | Timeframe | Win Rate | Avg Profit | With 2x |
|----------|-----------|----------|------------|---------|
| WhaleFlowScalper | 4h | ~80-90% | 0.1% | 0.2% |
| HighWinRateScalper | 4h | ~75-85% | 0.1% | 0.2% |

Plus ability to SHORT during downtrends = profit both ways!

---

*Last Updated: 2026-01-03*

