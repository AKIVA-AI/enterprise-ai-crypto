# HighWinRateScalper Strategy Documentation

## Overview

**HighWinRateScalper** is a mean-reversion scalping strategy designed for **90%+ win rate** with small, consistent profits.

| Attribute | Value |
|-----------|-------|
| **Strategy Type** | Mean Reversion |
| **Best Timeframe** | 2h (100% win rate) |
| **Target Win Rate** | 90%+ |
| **Risk Profile** | Conservative |

---

## Core Philosophy

1. **Small take profits** (0.3% - 0.8%) - Exit quickly with small gains
2. **Wider stop loss** (4%) - Let trades recover
3. **Mean reversion logic** - Buy oversold, sell overbought
4. **Multiple confirmations** - Only high-probability setups
5. **Volume confirmation** - Ensure market interest

---

## Entry Conditions (ALL must be true)

| Condition | Threshold | Purpose |
|-----------|-----------|---------|
| RSI | < 25 | Oversold |
| BB Position | < 15% | Near lower band |
| Volume Ratio | > 1.3x | Volume spike |
| Stochastic RSI | < 25 | Double oversold |
| Price vs EMA200 | > 92% | Not severe downtrend |
| MACD Histogram | Rising | Momentum shift |
| ATR % | < 3% | Volatility filter |

---

## Exit Conditions

### ROI Targets (Quick Exit)
| Time | Profit Target |
|------|---------------|
| 0 min | 0.8% |
| 15 min | 0.5% |
| 30 min | 0.3% |
| 60 min | 0.1% |

### Trailing Stop
- **Activation**: At 0.5% profit
- **Trail Distance**: 0.3%

### Stop Loss
- **Hard Stop**: -4%

---

## Indicator Stack

```python
# RSI - Primary oversold detection
rsi = RSI(close, 14)
rsi_slow = RSI(close, 21)

# Bollinger Bands - Mean reversion levels
bb = bollinger_bands(close, window=20, stds=2.0)

# Stochastic RSI - Double confirmation
stoch_rsi = STOCH(rsi, 14, 3, 3)

# MACD - Momentum
macd = MACD(close, 12, 26, 9)

# ATR - Volatility filter
atr = ATR(high, low, close, 14)

# EMA - Trend filter
ema_50 = EMA(close, 50)
ema_200 = EMA(close, 200)
```

---

## Backtest Results

### 2-Hour Timeframe (BTC/ETH/SOL/XRP)
| Metric | Value |
|--------|-------|
| Win Rate | **100%** |
| Total Trades | 2 |
| Profit | +$0.66 |
| Drawdown | **0%** |
| Market Change | -23% |

### 1-Hour Timeframe
| Metric | Value |
|--------|-------|
| Win Rate | 67% |
| Total Trades | 3 |
| Profit | -$20 |

---

## Hyperopt Parameters

```python
# Buy parameters
rsi_oversold = IntParameter(15, 35, default=25)
bb_window = IntParameter(15, 30, default=20)
bb_std = DecimalParameter(1.5, 2.5, default=2.0)
volume_mult = DecimalParameter(1.0, 2.0, default=1.3)

# Sell parameters
rsi_overbought = IntParameter(65, 85, default=75)
take_profit_pct = DecimalParameter(0.3, 1.0, default=0.5)
```

---

## Best Use Cases

✅ **Use When:**
- Trading BTC, major coins
- Using 2h timeframe
- Market is ranging/choppy
- Want consistent small wins

❌ **Avoid When:**
- Strong trending market
- Sub-15m timeframes
- High-volatility events
- Highly volatile altcoins

---

## File Location
```
akiva-ai-crypto/user_data/strategies/HighWinRateScalper.py
```

---

*Last Updated: 2026-01-03*

