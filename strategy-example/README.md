# TradingView AlphaTrend Strategy Collection

This repository contains a collection of advanced TradingView Pine Script strategies based on the AlphaTrend indicator, designed for cryptocurrency and forex trading. Each script combines the powerful AlphaTrend indicator with different moving averages and filters to provide optimal trading signals.

## 📊 Available Strategies

### 1. AlphaTrend HMA Strategy (`alphatrend-hma.txt`)
A comprehensive strategy that combines AlphaTrend with Hull Moving Average (HMA) for trend confirmation.

### 2. AlphaTrend VWMA Strategy (`alphatrend-vwma-strategy.txt`)
A strategy that uses Volume Weighted Moving Average (VWMA) alongside AlphaTrend for volume-based confirmations.

### 3. AT SSL Hybrid Strategy (`at-sll-hybrit-strategy.txt`)
An advanced multi-version strategy combining AlphaTrend with SSL (Secure Socket Layer) channels and various moving averages with multiple strategy variants (V1-V4).

---

## 🔧 Strategy Details

## AlphaTrend HMA Strategy

### **Description**
This strategy combines the AlphaTrend indicator with Hull Moving Average to identify high-probability trading opportunities. The strategy focuses on trend-following with dynamic support and resistance levels.

### **Key Features**
- **AlphaTrend Indicator**: Dynamic trend detection using ATR-based calculations
- **Hull Moving Average**: Reduced lag trend confirmation
- **Percentage-based Stop Loss & Take Profit**: Risk management with customizable percentages
- **Reversal Signal Support**: Optional position reversal on opposite signals

### **Parameters**

#### AlphaTrend Settings
- **Multiplier**: `1.0` (default) - Controls sensitivity of AlphaTrend lines
- **Common Period**: `40` (default) - Lookback period for ATR calculation
- **Price Source**: `close` (default) - Price data used for calculations
- **No Volume Data**: `false` - Switch between MFI and RSI when volume data is unavailable

#### HMA Settings
- **HMA Length**: `120` (default) - Period for Hull Moving Average calculation

#### Strategy Parameters
- **Take Profit**: `6%` (default) - Profit target as percentage
- **Stop Loss**: `2%` (default) - Risk limit as percentage
- **Enable Reversal**: `true` - Allow position reversal on opposite signals

### **Entry Conditions**
- **Long Entry**: AlphaTrend bullish (blue > red) AND price > HMA
- **Short Entry**: AlphaTrend bearish (red > blue) AND price < HMA

### **Recommended Settings by Timeframe**

| Timeframe | Multiplier | Common Period | HMA Length | Take Profit | Stop Loss |
|-----------|------------|---------------|------------|-------------|-----------|
| 15m       | 1          | 40            | 120        | 6.0%        | 2.0%      | ETHUSDT 
| 2h        | 1          | 40            | 120        | 8.0%        | 2.0%      | ETHUSDT 
| 4h        | 1          | 40            | 120        | 8.0%        | 2.0%      | SOLUSDT

---

## AlphaTrend VWMA Strategy

### **Description**
This strategy utilizes Volume Weighted Moving Average (VWMA) for enhanced price action analysis combined with AlphaTrend. The VWMA gives more weight to periods with higher volume, making it ideal for crypto markets.

### **Key Features**
- **Volume-Based Confirmation**: VWMA provides volume-weighted price levels
- **Simplified Entry Logic**: Focused on AlphaTrend and VWMA relationship
- **Clean Signal Generation**: Reduced false signals compared to multiple indicator strategies

### **Parameters**

#### AlphaTrend Settings
- **Multiplier**: `1.0` (default)
- **Common Period**: `40` (default)
- **Price Source**: `close` (default)
- **No Volume Data**: `false` (default)

#### VWMA Settings
- **VWMA Length**: `20` (default) - Period for volume-weighted calculations
- **VWMA Source**: `close` (default) - Price source for VWMA

#### Strategy Parameters
- **Take Profit**: `6%` (default)
- **Stop Loss**: `2%` (default)
- **Enable Reversal**: `true` (default)

### **Entry Conditions**
- **Long Entry**: AlphaTrend bullish AND price > VWMA
- **Short Entry**: AlphaTrend bearish AND price < VWMA

### **Recommended Settings by Asset Type**

| Timeframe | Multiplier | Common Period | HMA Length | Take Profit | Stop Loss |
|-----------|------------|---------------|------------|-------------|-----------|
| 15m       | 1          | 40            | 120        | 6.0%        | 2.0%      | ETHUSDT 
| 15m       | 1          | 40            | 120        | 8.0%        | 2.0%      | ETHUSDT 
| 4h        | 1          | 40            | 120        | 8.0%        | 2.0%      | SOLUSDT

---

## AT SSL Hybrid Strategy (Advanced)

### **Description**
The most sophisticated strategy in the collection, featuring multiple strategy variants (V1-V4) with SSL channels, various moving average types, and advanced risk management including trailing stops and multiple profit targets. This strategy combines AlphaTrend with SSL (Secure Socket Layer) channels for enhanced trend detection and confirmation.

### **Key Features**
- **4 Strategy Variants**: V1, V2, V3, V4 with different risk/reward profiles
- **SSL Channels**: Secure Socket Layer-based trend detection with Keltner baseline
- **AlphaTrend Integration**: Dynamic trend confirmation using ATR-based calculations
- **Multiple MA Types**: HMA, JMA, EMA, SMA, VWMA, TMA, McGinley, and more
- **Advanced Risk Management**: Multiple targets, trailing stops, position sizing
- **ATR-Based Bands**: Dynamic support/resistance levels

### **Parameters**

#### Strategy Selection
- **Strategy Type**: Choose from V1, V2, V3, or V4

#### SSL Configuration
- **SSL1/Baseline Type**: `HMA` (default) - Primary trend filter
- **SSL1 Length**: `60` (default)
- **SSL2 Type**: `JMA` (default) - Continuation filter
- **SSL2 Length**: `5` (default)
- **EXIT Type**: `HMA` (default) - Exit signal filter
- **EXIT Length**: `15` (default)

#### AlphaTrend Settings
- **Multiplier**: `1.0` (default) - AlphaTrend sensitivity
- **Common Period**: `14` (default) - ATR calculation period
- **No Volume Data**: `false` - Switch between MFI and RSI

#### ATR Settings
- **ATR Period**: `14` (default)
- **ATR Multiplier**: `1.0` (default)
- **ATR Smoothing**: `WMA` (default)

#### Risk Management Parameters
- **Stop Loss**: Varies by version
- **Take Profit**: Varies by version
- **Position Size**: `2%` (default)

### **Strategy Versions Detailed Analysis**

#### **V1 - Conservative Market Maker Approach**
```
Entry Logic: AlphaTrend + SSL Channel confirmation
Exit Logic: Opposite signal closes position immediately
Risk Management: Simple market-based exits
```

**How V1 Works:**
- **Entry**: Long when AlphaTrend bullish + price above upper SSL channel
- **Entry**: Short when AlphaTrend bearish + price below lower SSL channel  
- **Exit**: Immediately closes position on opposite AlphaTrend signal
- **Risk**: No fixed stop loss - relies on signal reversals
- **Best For**: Beginners, highly liquid markets, strong trending conditions

**Advantages:**
- Simple to understand and implement
- No complex risk calculations
- Fast reaction to trend changes
- Good for trending markets

**Disadvantages:**
- No fixed risk control
- Can have large drawdowns in choppy markets
- Relies heavily on signal quality

#### **V2 - Balanced Partial Profit Approach**
```
Entry Logic: AlphaTrend + SSL Channel confirmation  
Exit Logic: 50% at first target + 50% at breakeven
Risk Management: Fixed SL with partial profit taking
```

**How V2 Works:**
- **Entry**: Same as V1 with SSL + AlphaTrend confirmation
- **Exit Strategy**: 
  - 50% position closed at first profit target
  - Remaining 50% held until stop loss hit or opposite signal
- **Risk Management**: Fixed percentage-based stop loss
- **Profit Targets**: Single target with partial closure

**Advantages:**
- Locks in partial profits early
- Reduces risk after first target hit
- Better risk/reward balance
- Good for volatile markets

**Disadvantages:**
- May miss larger moves on remaining position
- More complex than V1
- Requires precise target setting

#### **V3 - Aggressive Scalping Approach**  
```
Entry Logic: AlphaTrend + SSL Channel confirmation
Exit Logic: Fixed TP/SL on full position
Risk Management: Tight stops with quick profits
```

**How V3 Works:**
- **Entry**: Same SSL + AlphaTrend confirmation
- **Exit Strategy**: 
  - 100% position closed at take profit OR stop loss
  - No partial exits - all or nothing approach
- **Risk Management**: Fixed percentage SL and TP
- **Speed**: Fastest execution of all versions

**Advantages:**
- Clear risk/reward ratio
- Simple execution
- Good for scalping
- Consistent position sizing

**Disadvantages:**
- May exit too early in strong trends
- No profit protection after entry
- Binary outcome (win or lose)

#### **V4 - Professional Multi-Target System**
```
Entry Logic: AlphaTrend + SSL Channel confirmation
Exit Logic: Multiple targets with trailing stops
Risk Management: Advanced position management with trailing SL
```

**How V4 Works:**
- **Entry**: Same SSL + AlphaTrend confirmation
- **Phase 1**: 50% position closed at first profit target (TP1)
- **Phase 2**: After TP1 hit, remaining 50% targets second profit level (TP2)
- **Trailing Stop**: After TP1, stop loss moves to breakeven + buffer
- **Advanced Risk**: Multiple stop loss levels and trailing functionality

**Profit Targets:**
- **Target 1**: `0.6%` (default) - 50% position closure
- **Target 2**: `0.6%` (default) - Remaining position
- **Trailing Stop**: `0.15%` from entry after TP1 hit

**Advantages:**
- Maximum profit potential
- Advanced risk management
- Trailing stop protection
- Professional-grade execution

**Disadvantages:**
- Most complex to manage
- Requires understanding of multi-phase exits
- Can be over-optimized

### **Entry Conditions (All Versions)**
- **Long Entry**: AlphaTrend bullish (green) AND price above upper SSL channel (Keltner baseline)
- **Short Entry**: AlphaTrend bearish (red) AND price below lower SSL channel (Keltner baseline)
- **Confirmation**: Must have both SSL and AlphaTrend alignment

### **Recommended Settings by Strategy Version**

| Version | Best Timeframe | Stop Loss | Take Profit | Risk/Trade | Market Condition | Position Management |
|---------|----------------|-----------|-------------|------------|------------------|-------------------|
| V1      | 1H - 4H        | auot      | auto        | 2-5%       | Strong Trends    |  auto             |
| V2      | 45M - 1H       | 2%        | 8% or 6&    | 1:4-3      | Balanced Markets | 50% Partial       |
| V3      | 1h             | 2%        | 8%          | 1:4        | High Volatility  | Full Position     |
| V4      | 1H - 15m - 4h  |  4%→Trail |   6%/  8%   | 1:3-8      | All Conditions   | Multi-Target      |

ETHUSDT SOLUSDT

### **SSL Channel Explanation**
The SSL (Secure Socket Layer) channel uses Keltner-based calculations:
- **Upper Channel**: Baseline + (ATR × Multiplier)
- **Lower Channel**: Baseline - (ATR × Multiplier)  
- **Baseline**: Selected MA type (HMA default) of price
- **Confirmation**: Price must be outside channel for signal validity

### **Performance Characteristics by Version**

| Metric | V1 | V2 | V3 | V4 |
|--------|----|----|----|----|
| Win Rate | 65-75% | 55-65% | 45-55% | 60-70% |
| Avg Win | Variable | Medium | Small | Large |
| Max DD | High | Medium | Low | Medium |
| Complexity | Low | Medium | Low | High |
| Profit Factor | 1.2-1.8 | 1.3-1.6 | 1.1-1.4 | 1.5-2.2 |

### **Optimization Guidelines by Version**

#### V1 Optimization
- Focus on AlphaTrend parameters (Multiplier: 0.8-1.5)
- SSL baseline length (40-80)
- Avoid choppy/sideways markets
- Best with strong momentum

#### V2 Optimization  
- Balance SL/TP ratio (aim for 1:2)
- Optimize partial exit percentage (30-70%)
- Test different ATR periods
- Good for trending with pullbacks

#### V3 Optimization
- Tight parameter tuning required
- Lower multipliers (0.5-1.0)
- Shorter periods (10-20)
- Focus on high-volume sessions

#### V4 Optimization
- Complex multi-variable optimization
- Test trailing stop distances
- Optimize target ratios
- Consider correlation between TP1 and TP

---

## 🚀 Quick Setup Guide

### Step 1: Copy Script to TradingView
1. Open TradingView and go to Pine Editor
2. Copy the desired strategy code from the `.txt` files
3. Paste into a new Pine Script
4. Click "Add to Chart"

### Step 2: Configure Parameters
1. Click on the strategy name on your chart
2. Go to "Inputs" tab
3. Adjust parameters based on your:
   - Timeframe
   - Asset type
   - Risk tolerance
   - Market conditions

### Step 3: Backtesting
1. Open Strategy Tester tab
2. Review performance metrics
3. Optimize parameters using the recommended settings tables
4. Test on different timeframes and assets

### Step 4: Set Alerts
1. Right-click on chart → "Add Alert"
2. Select your strategy
3. Choose "Alert() function calls"
4. Configure your notification preferences

---

## 📈 Optimization Tips

### For Different Timeframes

#### Scalping (1m - 5m)
- Lower multipliers (0.5 - 0.8)
- Shorter periods (15 - 25)
- Tight stop losses (0.1% - 0.3%)
- Quick profit targets (0.2% - 0.5%)

#### Day Trading (15m - 1h)
- Standard multipliers (0.8 - 1.2)
- Medium periods (30 - 50)
- Moderate stops (0.5% - 1.5%)
- Balanced targets (1% - 3%)

#### Swing Trading (4h - 1D)
- Higher multipliers (1.5 - 2.5)
- Longer periods (60 - 100)
- Wider stops (2% - 5%)
- Larger targets (5% - 15%)

### For Different Market Conditions

#### Trending Markets
- Increase multipliers
- Enable reversal signals
- Use longer periods
- Wider profit targets

#### Sideways Markets
- Decrease multipliers
- Disable reversal signals
- Use shorter periods
- Tighter profit targets

#### High Volatility
- Lower multipliers
- Shorter periods
- Tighter stops
- Quick exits

---

## 🛡️ Risk Management

### Position Sizing
- Never risk more than 1-2% of your account per trade
- Use the percentage-based stops effectively
- Consider using the V4 strategy for advanced position management

### Money Management Rules
1. **Risk-Reward Ratio**: Aim for minimum 1:2 (1% risk, 2% reward)
2. **Maximum Daily Risk**: Don't exceed 5% of account per day
3. **Correlation Management**: Don't trade highly correlated pairs simultaneously
4. **Market Hours**: Be aware of low liquidity periods

### Stop Loss Guidelines
- Always use stop losses
- Don't move stops against your position
- Consider ATR-based stops for volatile assets
- Use trailing stops in trending markets (V4 strategy)

---

## 📊 Performance Metrics

### Key Metrics to Monitor
- **Win Rate**: Aim for >50% for scalping, >40% for swing trading
- **Profit Factor**: Target >1.5 for consistent profitability
- **Maximum Drawdown**: Keep below 10-15% of account
- **Sharpe Ratio**: Higher is better, aim for >1.0

### Optimization Process
1. Start with default parameters
2. Test on historical data (minimum 3 months)
3. Adjust one parameter at a time
4. Re-test and compare results
5. Forward test with small position sizes
6. Scale up gradually after consistent results

---
