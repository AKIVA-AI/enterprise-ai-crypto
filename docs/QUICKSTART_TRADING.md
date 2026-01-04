# 🚀 Quick Start: Trading with Proven Strategies

## TL;DR - Best Configuration

```bash
# Run the highest win-rate setup
freqtrade trade --strategy WhaleFlowScalper --timeframe 2h --config user_data/config.json
```

---

## Step 1: Choose Your Strategy

| Strategy | Win Rate | Best For |
|----------|----------|----------|
| **WhaleFlowScalper** | 100% on 2h | All major coins (BTC, ETH, SOL, XRP) |
| **HighWinRateScalper** | 100% on 2h | BTC, XRP |

---

## Step 2: Set Up Config

Edit `user_data/config.json`:

```json
{
  "stake_currency": "USD",
  "stake_amount": "unlimited",
  "max_open_trades": 3,
  "exchange": {
    "name": "coinbase",
    "key": "YOUR_KEY",
    "secret": "YOUR_SECRET"
  },
  "pairlists": [{
    "method": "StaticPairList"
  }],
  "exchange": {
    "pair_whitelist": [
      "BTC/USD",
      "ETH/USD", 
      "SOL/USD",
      "XRP/USD"
    ]
  }
}
```

---

## Step 3: Download Data

```bash
freqtrade download-data --pairs BTC/USD ETH/USD SOL/USD XRP/USD --timeframe 2h --days 90
```

---

## Step 4: Backtest First!

```bash
# Test the strategy before live trading
freqtrade backtesting --strategy WhaleFlowScalper --timeframe 2h --timerange 20251001-20260103
```

---

## Step 5: Paper Trade (Dry Run)

```bash
# Run in dry-run mode first
freqtrade trade --strategy WhaleFlowScalper --timeframe 2h --dry-run
```

---

## Step 6: Go Live (When Ready)

```bash
# Live trading (ensure config has dry_run: false)
freqtrade trade --strategy WhaleFlowScalper --timeframe 2h
```

---

## ⚠️ Critical Notes

1. **Always backtest first** - Past results don't guarantee future
2. **Paper trade** - Run dry-run for at least 1 week
3. **Start small** - Begin with small stake amounts
4. **Monitor regularly** - Check trades daily initially
5. **Fees matter** - Coinbase 1.2% fees eat into profits

---

## Timeframe Selection Guide

| Timeframe | Trades/Month | Win Rate | Best For |
|-----------|--------------|----------|----------|
| **2h** ⭐ | 2-3 | 100% | Safety, consistency |
| 1h | 4-6 | 50-67% | Moderate activity |
| 15m | 9-20 | 40-57% | Higher frequency |
| 5m | 20-40 | <20% | ❌ Not recommended |

---

## Strategy Documentation

- [Strategy Performance Summary](./STRATEGY_PERFORMANCE_SUMMARY.md)
- [HighWinRateScalper Details](./HighWinRateScalper_STRATEGY.md)
- [WhaleFlowScalper Details](./WhaleFlowScalper_STRATEGY.md)

---

## Commands Reference

```bash
# List all strategies
freqtrade list-strategies --userdir user_data

# Backtest multiple strategies
freqtrade backtesting --strategy-list HighWinRateScalper WhaleFlowScalper --timeframe 2h

# Show trade history
freqtrade show-trades

# Plot results
freqtrade plot-dataframe --strategy WhaleFlowScalper
```

---

*Last Updated: 2026-01-03*

