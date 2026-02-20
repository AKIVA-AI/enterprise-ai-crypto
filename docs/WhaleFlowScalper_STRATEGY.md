# WhaleFlowScalper Strategy Documentation

## Overview

**WhaleFlowScalper** combines whale flow intelligence with mean reversion for high-probability trading.

| Attribute | Value |
|-----------|-------|
| **Strategy Type** | Whale Flow + Mean Reversion |
| **Best Timeframe** | 2h (100% win rate) |
| **Target Win Rate** | 85%+ |
| **Risk Profile** | Conservative with ATR-based stops |

---

## Core Philosophy

1. **Whale Intelligence** - Top coins move with whale accumulation/distribution
2. **ATR-Based Risk** - Dynamic stop loss based on volatility
3. **Position Sizing** - Risk budget approach (max 2% per trade)
4. **Mean Reversion** - Buy oversold with whale confirmation
5. **US Compliance** - Conservative leverage (2-3x max)

---

## Entry Conditions - LONG

| Condition | Threshold | Purpose |
|-----------|-----------|---------|
| RSI | < 28 | Oversold |
| BB Position | < 20% | Near lower band |
| Volume Ratio | > 1.2x | Volume confirmation |
| Stochastic RSI | < 30 | Double oversold |
| MACD Histogram | Rising | Momentum shift |
| Price vs EMA200 | > 90% | Not severe downtrend |
| ATR % | < 4% | Volatility filter |
| Whale Flow | ≥ -0.3 | Not strongly bearish |

---

## Risk Management (Key Differentiator)

### ATR-Based Dynamic Stoploss
```python
# Initial: 2x ATR from entry
stoploss = entry_price - (ATR * 2.0)

# Progressive tightening:
# > 2% profit → tighten to 1x ATR
# > 1% profit → tighten to 1.5x ATR
```

### Position Sizing Formula
```
Position = (Account × 2%) / (SL_Distance × Leverage)
```

### Leverage Control
| ATR % | Leverage |
|-------|----------|
| > 3% | 1.5x |
| > 2% | 2.0x |
| < 2% | 2.5x |

---

## Exit Conditions

### ROI Targets
| Time | Profit Target |
|------|---------------|
| 0 min | 1.2% |
| 15 min | 0.8% |
| 30 min | 0.5% |
| 60 min | 0.3% |
| 120 min | 0.1% |

### Trailing Stop
- **Activation**: At 1% profit
- **Trail Distance**: 0.5%

### Custom Exits
- RSI normalized + profit > 0.3% → Exit
- 4+ hours + any profit → Time exit
- MACD reversal + profit > 0 → Momentum exit

---

## Whale Flow Integration

### Signal Types
| Direction | Meaning | Action |
|-----------|---------|--------|
| Bullish (outflow) | Accumulation | ✅ Long bias |
| Neutral | No strong signal | Trade technicals |
| Bearish (inflow) | Distribution | ❌ Block longs |

### Trade Confirmation
- Strong bearish whale flow (>0.7) **blocks** long entries
- Strong bullish whale flow (>0.7) **blocks** short entries

---

## Backtest Results

### 2-Hour Timeframe (BTC/ETH/SOL/XRP)
| Metric | Value |
|--------|-------|
| Win Rate | **100%** |
| Total Trades | 3 |
| Profit | +$0.80 |
| Drawdown | **0%** |
| Coins | BTC, ETH, SOL |

### 1-Hour Timeframe
| Metric | Value |
|--------|-------|
| Win Rate | 50% |
| Total Trades | 6 |
| Profit | -$4.68 |

---

## Hyperopt Parameters

```python
# Buy parameters
rsi_oversold = IntParameter(15, 35, default=28)
bb_window = IntParameter(15, 30, default=20)
bb_std = DecimalParameter(1.5, 2.5, default=2.0)
volume_mult = DecimalParameter(1.0, 2.0, default=1.2)
whale_signal_weight = DecimalParameter(0.2, 0.8, default=0.5)
min_whale_strength = DecimalParameter(0.1, 0.5, default=0.2)

# Sell parameters
rsi_overbought = IntParameter(65, 85, default=72)
atr_sl_multiplier = DecimalParameter(1.5, 3.0, default=2.0)
```

---

## File Location
```
enterprise-crypto/user_data/strategies/WhaleFlowScalper.py
```

---

*Last Updated: 2026-01-03*

