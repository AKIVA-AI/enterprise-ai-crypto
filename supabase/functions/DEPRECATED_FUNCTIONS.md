# Deprecated Edge Functions

**Date:** 2026-01-08  
**Reason:** Migration to OMS-First + Multi-Tenant Architecture

## ❌ Functions to Retire

The following edge functions **violate the OMS-first architecture** by writing directly to `orders` and `fills` tables. They must be retired or converted to intent emitters.

---

## 1. live-trading ❌ DEPRECATED

**Location:** `supabase/functions/live-trading/index.ts`

**Violation:**
- Writes directly to `orders` table (line ~297)
- Writes directly to `fills` table (line ~317)
- Bypasses OMSExecutionService

**Code Example (WRONG):**
```typescript
// Line 297-314
await supabase.from('orders').update({
  filled_size: fill.filledSize,
  filled_price: fill.filledPrice,
  slippage: fill.slippage,
  latency_ms: Math.round(fill.latencyMs),
  status: orderStatus,
}).eq('id', newOrder.id);

// Line 317-325
await supabase.from('fills').insert({
  order_id: newOrder.id,
  instrument: order.instrument,
  side: order.side,
  size: fill.filledSize,
  price: fill.filledPrice,
  fee: fill.fee,
  venue_id: venueData?.id,
});
```

**Replacement:**
- Use OMS backend service for order execution
- Frontend should call OMS API directly
- Or convert to emit TradeIntents

**Action:** ❌ RETIRE - Remove function or convert to intent emitter

---

## 2. kraken-trading ❌ DEPRECATED

**Location:** `supabase/functions/kraken-trading/index.ts`

**Violation:**
- Writes directly to `orders` table (line ~421)
- Writes directly to `fills` table (line ~436)
- Bypasses OMSExecutionService

**Code Example (WRONG):**
```typescript
// Line 421-434
await supabase.from('orders').insert({
  id: orderId,
  book_id,
  strategy_id: strategy_id || null,
  instrument: pair,
  side: type,
  size: parseFloat(volume),
  price: currentPrice,
  status: mode === 'live' ? 'open' : 'filled',
  filled_size: parseFloat(volume),
  filled_price: fillPrice,
  slippage: slippageBps,
  latency_ms: latencyMs,
});

// Line 436-443
await supabase.from('fills').insert({
  order_id: orderId,
  instrument: pair,
  side: type,
  size: parseFloat(volume),
  price: fillPrice,
  fee,
});
```

**Replacement:**
- Use OMS backend service with Kraken connector
- Keep read-only queries (balance, positions)
- Remove execution logic

**Action:** ❌ RETIRE - Remove execution logic, keep read-only queries

---

## 3. coinbase-trading ❌ DEPRECATED

**Location:** `supabase/functions/coinbase-trading/index.ts`

**Violation:**
- Writes directly to `orders` table (line ~472)
- Writes directly to `fills` table (line ~475)
- Bypasses OMSExecutionService

**Code Example (WRONG):**
```typescript
// Line 472
await supabase.from('orders').insert(orderData);

// Line 475-482
await supabase.from('fills').insert({
  order_id: orderId,
  instrument,
  side,
  size,
  price: fillPrice,
  fee,
});
```

**Replacement:**
- Use OMS backend service with Coinbase connector
- Keep read-only queries (balance, positions)
- Remove execution logic

**Action:** ❌ RETIRE - Remove execution logic, keep read-only queries

---

## 4. binance-us-trading ❌ DEPRECATED

**Location:** `supabase/functions/binance-us-trading/index.ts`

**Violation:**
- Likely writes directly to `orders` and `fills` tables
- Bypasses OMSExecutionService

**Action:** ⚠️ AUDIT - Review and remove execution logic

---

## 5. hyperliquid ⚠️ NEEDS AUDIT

**Location:** `supabase/functions/hyperliquid/index.ts`

**Violation:**
- Needs audit to check for direct order writes

**Action:** ⚠️ AUDIT - Review and fix if needed

---

## Migration Path

### Option 1: Complete Retirement (Recommended)
1. Remove the deprecated functions
2. Update frontend to call OMS backend API directly
3. OMS backend handles all order execution
4. Edge functions only emit intents

### Option 2: Convert to Intent Emitters
1. Keep the functions but remove order/fill writes
2. Convert to emit TradeIntents or multi_leg_intents
3. Add tenant_id enforcement
4. Add idempotency keys
5. Add audit logging

---

## Updated Functions ✅

The following functions have been **updated** to comply with OMS-first architecture:

### 1. cross-exchange-arbitrage ✅ UPDATED

**New Location:** `supabase/functions/cross-exchange-arbitrage/index.v2.ts`

**Changes:**
- ✅ Reads from `arb_spreads`, `spot_quotes` (canonical tables)
- ✅ Emits `multi_leg_intents` instead of executing orders
- ✅ Enforces `tenant_id` via RLS
- ✅ Includes idempotency keys
- ✅ Logs audit events

**Migration:**
```bash
# Backup old version
mv index.ts index.old.ts

# Use new version
mv index.v2.ts index.ts

# Deploy
supabase functions deploy cross-exchange-arbitrage
```

### 2. funding-arbitrage ✅ UPDATED

**New Location:** `supabase/functions/funding-arbitrage/index.v2.ts`

**Changes:**
- ✅ Reads from `basis_quotes`, `funding_rates` (canonical tables)
- ✅ Emits `multi_leg_intents` instead of executing orders
- ✅ Enforces `tenant_id` via RLS
- ✅ Includes idempotency keys
- ✅ Logs audit events

**Migration:**
```bash
# Backup old version
mv index.ts index.old.ts

# Use new version
mv index.v2.ts index.ts

# Deploy
supabase functions deploy funding-arbitrage
```

---

## Timeline

### Phase 1: Immediate (Week 1)
- ✅ Deploy updated `cross-exchange-arbitrage`
- ✅ Deploy updated `funding-arbitrage`
- ⚠️ Audit `hyperliquid` function

### Phase 2: Deprecation (Week 2)
- ❌ Mark `live-trading` as deprecated
- ❌ Mark `kraken-trading` as deprecated
- ❌ Mark `coinbase-trading` as deprecated
- ❌ Mark `binance-us-trading` as deprecated
- 📢 Notify frontend team of changes

### Phase 3: Retirement (Week 3)
- 🗑️ Remove deprecated functions
- ✅ Verify OMS backend handles all execution
- ✅ Update frontend to use OMS API
- ✅ Test end-to-end flow

---

## Support

For questions or issues:
1. Review `docs/EDGE_FUNCTION_MIGRATION_PLAN.md`
2. Review `docs/EDGE_FUNCTION_QUICK_REFERENCE.md`
3. Contact platform team

