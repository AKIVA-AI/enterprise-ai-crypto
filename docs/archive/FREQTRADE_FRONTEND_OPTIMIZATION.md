# FreqTrade Frontend Optimization Plan

**Date:** January 3, 2026  
**Goal:** Optimize frontend to expose FreqTrade's full capabilities

---

## 🎯 **What Needs to Be Added**

### **1. FreqTrade Strategy Templates** ⚠️ MISSING

**Current:** Generic strategy templates  
**Needed:** FreqTrade-specific strategies

**Add to `src/lib/strategyTemplates.tsx`:**

```typescript
// FreqTrade Arbitrage Strategies
{
  id: 'freqtrade-funding-arbitrage',
  name: 'Funding Rate Arbitrage (FreqTrade)',
  description: 'Exploits funding rate differences between perpetual and spot markets. Earns funding payments while hedging risk.',
  category: 'arbitrage',
  icon: <Repeat className="h-5 w-5" />,
  defaultConfig: {
    timeframe: '1h',
    riskTier: 2,
    maxLeverage: 2,
    maxDrawdown: 5,
    parameters: {
      min_funding_rate: 0.01,  // 1% minimum
      hedge_ratio: 0.95,
      rebalance_threshold: 0.02,
      use_freqai: true,
    },
  },
  venueScope: ['binance', 'bybit'],
  assetClass: 'Crypto',
  difficulty: 'advanced',
  expectedReturn: '8-15% annually',
  riskProfile: 'Low risk, market-neutral',
  freqtradeStrategy: 'FundingRateArbitrage',  // NEW
},
{
  id: 'freqtrade-cross-exchange-arb',
  name: 'Cross-Exchange Arbitrage (FreqTrade)',
  description: 'Simultaneously buys on one exchange and sells on another to capture price differences. Requires fast execution.',
  category: 'arbitrage',
  icon: <Coins className="h-5 w-5" />,
  defaultConfig: {
    timeframe: '1m',
    riskTier: 3,
    maxLeverage: 1,
    maxDrawdown: 3,
    parameters: {
      min_spread_bps: 20,  // 20 basis points minimum
      max_execution_time_ms: 500,
      exchanges: ['binance', 'coinbase'],
      use_freqai: false,
    },
  },
  venueScope: ['binance', 'coinbase', 'kraken'],
  assetClass: 'Crypto',
  difficulty: 'advanced',
  expectedReturn: '5-12% annually',
  riskProfile: 'Low risk, high frequency',
  freqtradeStrategy: 'CrossExchangeArbitrage',  // NEW
},
{
  id: 'freqtrade-freqai-ml',
  name: 'FreqAI Machine Learning Strategy',
  description: 'Uses FreqAI to train ML models on historical data and predict price movements. Adapts to market conditions.',
  category: 'momentum',
  icon: <BarChart3 className="h-5 w-5" />,
  defaultConfig: {
    timeframe: '5m',
    riskTier: 3,
    maxLeverage: 3,
    maxDrawdown: 10,
    parameters: {
      model_type: 'LightGBM',
      feature_engineering: 'advanced',
      prediction_horizon: 12,  // 12 periods ahead
      confidence_threshold: 0.65,
      use_freqai: true,
    },
  },
  venueScope: ['binance', 'coinbase'],
  assetClass: 'Crypto',
  difficulty: 'advanced',
  expectedReturn: '20-40% annually',
  riskProfile: 'Medium-high risk, ML-driven',
  freqtradeStrategy: 'FreqAIStrategy',  // NEW
}
```

---

### **2. FreqTrade Health Dashboard** ⚠️ MISSING

**Create:** `src/components/freqtrade/FreqTradeHealthDashboard.tsx`

**Features:**
- FreqAI model status
- Backtesting engine status
- Market data service status
- Component health indicators
- Real-time metrics

**API Endpoint:** `GET /health/freqtrade`

---

### **3. Backtesting Results Visualization** ⚠️ MISSING

**Create:** `src/components/backtest/BacktestResultsChart.tsx`

**Features:**
- Equity curve
- Drawdown chart
- Win/loss distribution
- Sharpe/Sortino ratios
- Trade timeline
- Performance metrics

**API Endpoint:** `GET /api/backtest/results/{backtest_id}`

---

### **4. FreqAI Configuration Panel** ⚠️ MISSING

**Create:** `src/components/freqtrade/FreqAIConfigPanel.tsx`

**Features:**
- Model selection (LightGBM, XGBoost, CatBoost)
- Feature engineering options
- Training parameters
- Prediction horizon
- Confidence thresholds

---

### **5. Arbitrage Opportunity Monitor** ⚠️ MISSING

**Create:** `src/components/arbitrage/ArbitrageMonitor.tsx`

**Features:**
- Real-time arbitrage opportunities
- Funding rate differences
- Cross-exchange spreads
- Execution time estimates
- Profit potential

**API Endpoint:** `GET /api/arbitrage/opportunities`

---

## 🔧 **Backend API Endpoints to Add**

### **1. Backtesting API** ⚠️ MISSING

```python
# backend/app/api/backtesting.py

@router.post("/api/backtest/run")
async def run_backtest(request: BacktestRequest):
    """Run backtest using FreqTrade engine."""
    pass

@router.get("/api/backtest/results/{backtest_id}")
async def get_backtest_results(backtest_id: str):
    """Get backtest results with charts."""
    pass

@router.get("/api/backtest/history")
async def get_backtest_history():
    """Get list of past backtests."""
    pass
```

### **2. FreqTrade Health API** ✅ EXISTS

```python
# Already exists in main.py
@app.get("/health/freqtrade")
async def freqtrade_health():
    return get_freqtrade_status()
```

### **3. Arbitrage API** ⚠️ MISSING

```python
# backend/app/api/arbitrage.py

@router.get("/api/arbitrage/opportunities")
async def get_arbitrage_opportunities():
    """Get current arbitrage opportunities."""
    pass

@router.get("/api/arbitrage/funding-rates")
async def get_funding_rates():
    """Get funding rates across exchanges."""
    pass
```

### **4. FreqAI API** ⚠️ MISSING

```python
# backend/app/api/freqai.py

@router.post("/api/freqai/train")
async def train_model(request: TrainModelRequest):
    """Train FreqAI model."""
    pass

@router.get("/api/freqai/models")
async def list_models():
    """List available FreqAI models."""
    pass

@router.get("/api/freqai/predictions/{pair}")
async def get_predictions(pair: str):
    """Get current predictions for a pair."""
    pass
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Backend APIs** (Priority: HIGH)
- [ ] Create `backend/app/api/backtesting.py`
- [ ] Create `backend/app/api/arbitrage.py`
- [ ] Create `backend/app/api/freqai.py`
- [ ] Add routes to `backend/app/api/routes.py`
- [ ] Test all endpoints

### **Phase 2: Frontend Components** (Priority: HIGH)
- [ ] Add FreqTrade strategy templates
- [ ] Create `FreqTradeHealthDashboard.tsx`
- [ ] Create `BacktestResultsChart.tsx`
- [ ] Create `FreqAIConfigPanel.tsx`
- [ ] Create `ArbitrageMonitor.tsx`

### **Phase 3: Integration** (Priority: MEDIUM)
- [ ] Update `Strategies.tsx` to show FreqTrade strategies
- [ ] Add backtesting tab to strategy page
- [ ] Add arbitrage monitoring page
- [ ] Add FreqAI configuration to settings

---

## 🎯 **Expected Impact**

**Before:**
- ❌ Generic strategy templates
- ❌ No arbitrage strategies
- ❌ Backtesting not exposed
- ❌ No FreqAI configuration

**After:**
- ✅ FreqTrade-specific strategies
- ✅ Funding rate arbitrage
- ✅ Cross-exchange arbitrage
- ✅ Full backtesting UI
- ✅ FreqAI model training
- ✅ Real-time arbitrage monitoring

---

## 🚀 **Next Steps**

1. **Review this plan**
2. **Prioritize features**
3. **Start with backend APIs**
4. **Then build frontend components**
5. **Test thoroughly**

Want me to start implementing these features?

