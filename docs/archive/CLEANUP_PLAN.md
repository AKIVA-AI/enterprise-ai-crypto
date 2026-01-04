# Codebase Cleanup Plan - Remove Placeholder Strategies

**Date:** January 3, 2026  
**Goal:** Remove random placeholder strategies and switch to FreqTrade

---

## 📋 **Files to Clean Up**

### **🔴 High Priority - Remove/Disable**

1. **`backend/app/services/strategy_engine.py`**
   - ❌ `TrendFollowingStrategy` - Uses `random.uniform()` for momentum
   - ❌ `MeanReversionStrategy` - Uses `random.uniform()` for VWAP
   - ❌ `FundingArbitrageStrategy` - Uses `random.uniform()` for funding rates
   - ✅ `MemeMonitorStrategy` - Keep (monitoring only, no trading)

2. **`backend/app/services/quantitative_strategy_engine.py`**
   - ❌ `_generate_lstm_signal()` - Mock predictions with `np.random.normal()`
   - ❌ `_generate_gb_signal()` - Mock predictions with `np.random.normal()`
   - ❌ `_generate_rf_signal()` - Mock predictions with `np.random.normal()`
   - ❌ `_generate_arima_signal()` - Mock predictions
   - ❌ Entire file can be deprecated (FreqAI replaces this)

3. **`backend/app/agents/signal_agent.py`**
   - ❌ Uses placeholder strategies from strategy_engine.py
   - 🔄 Needs to be updated to use FreqTrade hub

4. **`backend/app/services/engine_runner.py`**
   - ❌ Line 90: `intents = await strategy_engine.run_cycle(books)`
   - 🔄 Needs to be updated to use FreqTrade hub

### **🟡 Medium Priority - Update**

5. **`backend/tests/test_strategy_engine.py`**
   - 🔄 Update tests to use FreqTrade strategies
   - ❌ Remove tests for placeholder strategies

6. **`backend/app/main.py`**
   - ✅ Already initializes FreqTrade integration
   - 🔄 Remove initialization of old quantitative_strategy_engine

### **🟢 Low Priority - Keep**

7. **`backend/app/services/freqtrade_integration.py`**
   - ✅ Keep - This is the good stuff!

8. **`backend/app/services/enhanced_quantitative_engine.py`**
   - ✅ Keep - FreqAI integration

9. **`backend/app/services/enhanced_backtesting_engine.py`**
   - ✅ Keep - FreqTrade backtesting

10. **`backend/app/services/enhanced_market_data_service.py`**
    - ✅ Keep - Real market data

---

## 🎯 **Cleanup Steps**

### **Step 1: Install FreqTrade**

```bash
cd akiva-ai-crypto/backend
pip install freqtrade
echo "freqtrade>=2023.12" >> requirements.txt
```

### **Step 2: Deprecate Old Strategy Files**

**Option A: Rename to mark as deprecated**
```bash
mv backend/app/services/strategy_engine.py backend/app/services/strategy_engine.py.deprecated
mv backend/app/services/quantitative_strategy_engine.py backend/app/services/quantitative_strategy_engine.py.deprecated
```

**Option B: Add deprecation warnings (safer)**
- Add warnings at the top of each file
- Keep files but disable in engine_runner.py

### **Step 3: Update engine_runner.py**

Replace old strategy engine with FreqTrade hub.

### **Step 4: Update signal_agent.py**

Update to use FreqTrade hub for signal generation.

### **Step 5: Update Tests**

Update or remove tests for deprecated strategies.

### **Step 6: Clean Up Imports**

Remove imports of deprecated modules from main.py and other files.

---

## 📝 **Detailed Code Changes**

See below for specific code changes needed.

---

## ✅ **Verification Checklist**

After cleanup:
- [ ] FreqTrade installed and working
- [ ] No random.uniform() or np.random in strategy code
- [ ] engine_runner.py uses FreqTrade hub
- [ ] Tests pass
- [ ] No imports of deprecated files
- [ ] System generates real signals (not random)
- [ ] Backtesting works
- [ ] Paper trading works

---

## 🚨 **Safety Notes**

1. **Don't delete files immediately** - Rename to .deprecated first
2. **Test thoroughly** - Run all tests after changes
3. **Keep backups** - Git commit before major changes
4. **Gradual rollout** - Test in paper mode first

---

## 📊 **Impact Assessment**

**Files to Modify:** 5  
**Files to Deprecate:** 2  
**Files to Keep:** 4  
**Tests to Update:** ~20  

**Estimated Time:** 2-4 hours

**Risk Level:** Medium (good test coverage, can rollback)

---

## 🔄 **Rollback Plan**

If something breaks:

```bash
# Restore deprecated files
mv backend/app/services/strategy_engine.py.deprecated backend/app/services/strategy_engine.py
mv backend/app/services/quantitative_strategy_engine.py.deprecated backend/app/services/quantitative_strategy_engine.py

# Revert engine_runner.py
git checkout backend/app/services/engine_runner.py
```

---

## 📞 **Next Steps**

1. Review this plan
2. Approve cleanup
3. Execute step-by-step
4. Test thoroughly
5. Deploy to paper trading

Ready to proceed?

