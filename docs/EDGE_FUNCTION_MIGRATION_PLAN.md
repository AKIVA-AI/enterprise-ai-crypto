# Edge Function Migration Plan: OMS-First + Multi-Tenant RLS

**Date:** 2026-01-08  
**Status:** 🔴 CRITICAL - Breaking Changes Required

## Executive Summary

Migration from direct order execution to OMS-first, intent-based architecture with multi-tenant RLS enforcement.

### Key Changes
1. **No direct order/fill writes** - Only OMSExecutionService writes orders
2. **Intent-based execution** - Edge functions emit TradeIntents or multi_leg_intents
3. **Multi-tenant RLS** - All reads/writes must respect tenant_id
4. **New canonical tables** - Migration from old arbitrage_executions to new schema
5. **Audit logging** - All risk actions must be logged

---

## 🚨 Critical Violations Found

### Direct Order/Fill Writers (MUST FIX)
These functions bypass OMS and violate the new architecture:

| Function | Violation | Action Required |
|----------|-----------|-----------------|
| `live-trading` | Writes to orders/fills directly | ❌ RETIRE or convert to intent emitter |
| `kraken-trading` | Writes to orders/fills directly | ❌ RETIRE or convert to intent emitter |
| `coinbase-trading` | Writes to orders/fills directly | ❌ RETIRE or convert to intent emitter |
| `binance-us-trading` | Writes to orders/fills directly | ❌ RETIRE or convert to intent emitter |
| `hyperliquid` | Likely writes orders | ⚠️ AUDIT and fix |

### Backend Services
| Service | Violation | Action Required |
|---------|-----------|-----------------|
| `engine_runner.py` | Writes to orders table | ✅ OK if this IS the OMS, otherwise fix |

---

## 📋 Function-by-Function Migration Plan

### 1. cross-exchange-arbitrage ⚠️ HIGH PRIORITY

**Current Issues:**
- ❌ Has 'execute' action that simulates trades
- ❌ Doesn't use new arb_spreads, spot_quotes tables
- ❌ No tenant_id enforcement
- ❌ No idempotency keys
- ❌ No audit logging

**Required Changes:**
```typescript
// BEFORE (lines 713-736)
case 'execute':
  // Simulates trade execution
  const execTradeId = `exec_${Date.now()}`;
  dailyPnL += execCosts.netProfit;
  recordTradeResult(execTradeId, adjustedOpportunity.symbol, execCosts.netProfit);

// AFTER
case 'execute':
  // Get tenant_id
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tenantData } = await supabase.rpc('current_tenant_id');
  const tenant_id = tenantData;
  
  // Create multi_leg_intent instead of executing
  const intent_id = crypto.randomUUID();
  const idempotency_key = `arb_${opportunity.symbol}_${Date.now()}`;
  
  await supabase.from('multi_leg_intents').insert({
    id: intent_id,
    tenant_id,
    intent_id,
    legs_json: {
      buy_leg: {
        venue: opportunity.buyExchange,
        symbol: opportunity.symbol,
        side: 'buy',
        size: opportunity.volume,
        price: opportunity.buyPrice,
      },
      sell_leg: {
        venue: opportunity.sellExchange,
        symbol: opportunity.symbol,
        side: 'sell',
        size: opportunity.volume,
        price: opportunity.sellPrice,
      },
    },
    status: 'pending',
    idempotency_key,
  });
  
  // Log audit event
  await supabase.from('audit_events').insert({
    tenant_id,
    action: 'spot_arb_intent_created',
    resource_type: 'multi_leg_intent',
    resource_id: intent_id,
    after_state: { opportunity, intent_id, idempotency_key },
  });
```

**New Table Reads:**
```typescript
// Read from arb_spreads instead of scanning live
const { data: opportunities } = await supabase
  .from('arb_spreads')
  .select('*')
  .eq('tenant_id', tenant_id)
  .gte('net_edge_bps', minSpreadBps)
  .order('ts', { ascending: false })
  .limit(10);

// Read from spot_quotes for current prices
const { data: quotes } = await supabase
  .from('spot_quotes')
  .select('*')
  .eq('tenant_id', tenant_id)
  .eq('instrument_id', instrument_id)
  .order('ts', { ascending: false })
  .limit(1);
```

---

### 2. funding-arbitrage ⚠️ HIGH PRIORITY

**Current Issues:**
- ❌ Has 'execute_funding_arb' that writes to arbitrage_executions
- ❌ Doesn't use new basis_quotes, funding_rates tables
- ❌ No tenant_id enforcement
- ❌ No idempotency keys

**Required Changes:**
```typescript
// BEFORE (lines 282-325)
async function executeFundingArb(supabase: any, params: ArbitrageExecution, paperMode: boolean) {
  // Writes to arbitrage_executions table
  const { data, error } = await supabase
    .from('arbitrage_executions')
    .insert({
      opportunity_id: opportunityId,
      symbol,
      direction,
      // ...
    });
}

// AFTER
async function executeFundingArb(supabase: any, params: ArbitrageExecution) {
  // Get tenant_id
  const { data: tenantData } = await supabase.rpc('current_tenant_id');
  const tenant_id = tenantData;
  
  // Create multi_leg_intent for basis arbitrage
  const intent_id = crypto.randomUUID();
  const idempotency_key = `basis_${params.symbol}_${Date.now()}`;
  
  await supabase.from('multi_leg_intents').insert({
    id: intent_id,
    tenant_id,
    intent_id,
    legs_json: {
      spot_leg: {
        venue: params.spotVenue,
        symbol: params.symbol,
        side: params.direction === 'long_spot_short_perp' ? 'buy' : 'sell',
        size: params.spotSize,
      },
      perp_leg: {
        venue: params.perpVenue,
        symbol: params.symbol,
        side: params.direction === 'long_spot_short_perp' ? 'sell' : 'buy',
        size: params.perpSize,
      },
    },
    status: 'pending',
    idempotency_key,
  });
  
  // Log audit event
  await supabase.from('audit_events').insert({
    tenant_id,
    action: 'basis_arb_intent_created',
    resource_type: 'multi_leg_intent',
    resource_id: intent_id,
    after_state: { params, intent_id, idempotency_key },
  });
}
```

**New Table Reads:**
```typescript
// Read from basis_quotes
const { data: basisOpportunities } = await supabase
  .from('basis_quotes')
  .select('*')
  .eq('tenant_id', tenant_id)
  .gte('basis_bps', minBasisBps)
  .order('ts', { ascending: false });

// Read from funding_rates
const { data: fundingRates } = await supabase
  .from('funding_rates')
  .select('*')
  .eq('tenant_id', tenant_id)
  .eq('instrument_id', instrument_id)
  .order('funding_time', { ascending: false })
  .limit(1);
```

---

## 🔧 Shared Utilities Needed

### Create `_shared/oms-client.ts`

```typescript
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TradeIntent {
  tenant_id: string;
  intent_id: string;
  legs_json: {
    [key: string]: {
      venue: string;
      symbol: string;
      side: 'buy' | 'sell';
      size: number;
      price?: number;
      order_type?: 'market' | 'limit';
    };
  };
  status: 'pending' | 'submitted' | 'filled' | 'cancelled' | 'failed';
  idempotency_key: string;
}

export async function createMultiLegIntent(
  supabase: SupabaseClient,
  intent: Omit<TradeIntent, 'id' | 'created_at'>
): Promise<{ intent_id: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('multi_leg_intents')
      .insert({
        ...intent,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { intent_id: data.intent_id };
  } catch (error) {
    console.error('[OMS Client] Failed to create intent:', error);
    return { intent_id: '', error: error.message };
  }
}

export async function getTenantId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('current_tenant_id');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[OMS Client] Failed to get tenant_id:', error);
    return null;
  }
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    tenant_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    after_state: any;
  }
): Promise<void> {
  try {
    await supabase.from('audit_events').insert(event);
  } catch (error) {
    console.error('[OMS Client] Failed to log audit event:', error);
  }
}
```

### Create `_shared/tenant-guard.ts`

```typescript
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function requireTenantId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('current_tenant_id');

  if (error || !data) {
    throw new Error('Unauthorized: No tenant_id found for user');
  }

  return data;
}

export async function requireAuth(supabase: SupabaseClient): Promise<{ userId: string; tenantId: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const tenantId = await requireTenantId(supabase);

  return { userId: user.id, tenantId };
}
```

---

## 📊 Analytics/Read-Only Functions

### Functions that need table migration (READ ONLY):

| Function | Old Tables | New Tables | Priority |
|----------|-----------|------------|----------|
| Analytics endpoints | `arbitrage_executions` | `arb_pnl`, `basis_pnl` | HIGH |
| Position queries | Custom queries | `strategy_positions`, `venue_inventory` | HIGH |
| Performance metrics | Calculated | `strategy_performance`, `strategy_risk_metrics` | MEDIUM |

**Example Migration:**

```typescript
// BEFORE
const { data: executions } = await supabase
  .from('arbitrage_executions')
  .select('*')
  .eq('status', 'completed');

// AFTER
const { data: tenantId } = await supabase.rpc('current_tenant_id');

// For spot arbitrage P&L
const { data: spotPnl } = await supabase
  .from('arb_pnl')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('ts', { ascending: false });

// For basis arbitrage P&L
const { data: basisPnl } = await supabase
  .from('basis_pnl')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('ts', { ascending: false });

// For current positions
const { data: positions } = await supabase
  .from('strategy_positions')
  .select(`
    *,
    strategy:strategies(name, status),
    instrument:instruments(common_symbol, venue_symbol)
  `)
  .eq('tenant_id', tenantId);
```

---

## 🗑️ Functions to Retire

These functions should be **deprecated** or **removed** as they violate OMS-first architecture:

### 1. `live-trading` ❌ RETIRE
- **Reason:** Directly writes to orders/fills
- **Replacement:** OMS backend service
- **Migration:** Remove or convert to intent emitter

### 2. `kraken-trading` ❌ RETIRE
- **Reason:** Directly writes to orders/fills
- **Replacement:** OMS backend service with Kraken connector
- **Migration:** Remove execution logic, keep read-only queries

### 3. `coinbase-trading` ❌ RETIRE
- **Reason:** Directly writes to orders/fills
- **Replacement:** OMS backend service with Coinbase connector
- **Migration:** Remove execution logic, keep read-only queries

### 4. `binance-us-trading` ❌ RETIRE
- **Reason:** Likely writes to orders/fills
- **Replacement:** OMS backend service with Binance connector
- **Migration:** Audit and remove execution logic

---

## ✅ Implementation Checklist

### Phase 1: Critical Fixes (Week 1)
- [ ] Create `_shared/oms-client.ts` utility
- [ ] Create `_shared/tenant-guard.ts` utility
- [ ] Update `cross-exchange-arbitrage` to emit intents
- [ ] Update `funding-arbitrage` to emit intents
- [ ] Add tenant_id enforcement to all functions
- [ ] Add idempotency keys to all intent creation
- [ ] Add audit logging to all risk actions

### Phase 2: Table Migration (Week 2)
- [ ] Update `cross-exchange-arbitrage` to read from arb_spreads, spot_quotes
- [ ] Update `funding-arbitrage` to read from basis_quotes, funding_rates
- [ ] Update analytics endpoints to read from arb_pnl, basis_pnl
- [ ] Update position queries to read from strategy_positions
- [ ] Migrate any remaining old table references

### Phase 3: Retirement (Week 3)
- [ ] Deprecate `live-trading` function
- [ ] Deprecate `kraken-trading` execution logic
- [ ] Deprecate `coinbase-trading` execution logic
- [ ] Deprecate `binance-us-trading` execution logic
- [ ] Remove or archive deprecated functions
- [ ] Update frontend to use new intent-based flow

### Phase 4: Testing & Validation (Week 4)
- [ ] Test tenant isolation (users can't see other tenants' data)
- [ ] Test intent creation and OMS pickup
- [ ] Test idempotency (duplicate requests don't create duplicate intents)
- [ ] Test audit logging (all actions are logged)
- [ ] Load test with multiple tenants
- [ ] Security audit of RLS policies

---

## 🔐 Security Considerations

### Tenant Isolation
- ✅ All queries must include `tenant_id = current_tenant_id()`
- ✅ Service role should only be used for admin operations
- ✅ Never trust client-provided tenant_id

### Idempotency
- ✅ All intent creation must include idempotency_key
- ✅ Format: `{operation}_{symbol}_{timestamp}` or use UUID
- ✅ Check for existing intents with same key before creating

### Audit Logging
- ✅ Log all intent creation
- ✅ Log all risk limit checks
- ✅ Log all kill switch activations
- ✅ Include tenant_id in all audit events

---

## 📞 Support & Questions

For questions or issues during migration:
1. Review this document
2. Check `docs/MULTI_TENANT_RLS_GUIDE.md`
3. Review `supabase/migrations/20260108_MIGRATION_NOTES.md`
4. Contact platform team

---

## 🎯 Success Criteria

Migration is complete when:
- ✅ No edge functions write directly to orders/fills
- ✅ All execution flows emit intents
- ✅ All queries respect tenant_id
- ✅ All new tables are in use
- ✅ Old tables are deprecated
- ✅ Audit logging is comprehensive
- ✅ Tests pass for multi-tenant scenarios

