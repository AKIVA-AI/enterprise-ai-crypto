# Edge Function Migration Summary

**Status:** 🟡 IN PROGRESS - Awaiting Final Confirmation  
**Date:** 2026-01-08

## What's Been Done

### ✅ Database Migrations Applied
1. **20260105_basis_arbitrage.sql** - Created tenant tables and multi-tenant schema
2. **20260107_capital_allocator.sql** - Added tenant_id to strategies
3. **20260108_enforce_multitenant_rls.sql** - Enforced RLS and backfilled data

### ✅ Documentation Created
1. **EDGE_FUNCTION_MIGRATION_PLAN.md** - Comprehensive migration plan
2. **MULTI_TENANT_RLS_GUIDE.md** - Developer guide for multi-tenant architecture
3. **20260108_MIGRATION_NOTES.md** - Database migration notes

### ✅ Shared Utilities Created
1. **_shared/oms-client.ts** - Intent-based order management utilities
2. **_shared/tenant-guard.ts** - Multi-tenant RLS enforcement utilities

## What Needs to Be Done

### 🔴 Critical - Functions That Violate OMS-First Architecture

These functions **directly write to orders/fills** and must be fixed or retired:

| Function | Issue | Recommended Action |
|----------|-------|-------------------|
| `live-trading` | Writes to orders/fills | ❌ RETIRE or convert to intent emitter |
| `kraken-trading` | Writes to orders/fills | ❌ RETIRE or convert to intent emitter |
| `coinbase-trading` | Writes to orders/fills | ❌ RETIRE or convert to intent emitter |
| `binance-us-trading` | Writes to orders/fills | ❌ RETIRE or convert to intent emitter |
| `hyperliquid` | Likely writes orders | ⚠️ AUDIT and fix |

### 🟡 High Priority - Functions That Need Intent Conversion

| Function | Current Behavior | Required Changes |
|----------|-----------------|------------------|
| `cross-exchange-arbitrage` | Has 'execute' action that simulates trades | Convert to emit multi_leg_intents |
| `funding-arbitrage` | Has 'execute_funding_arb' that writes to old tables | Convert to emit multi_leg_intents |

### 🟢 Medium Priority - Functions That Need Table Migration

| Function | Old Tables | New Tables |
|----------|-----------|------------|
| `cross-exchange-arbitrage` | Custom scanning | `arb_spreads`, `spot_quotes` |
| `funding-arbitrage` | Custom scanning | `basis_quotes`, `funding_rates` |
| Analytics endpoints | `arbitrage_executions` | `arb_pnl`, `basis_pnl` |
| Position queries | Custom queries | `strategy_positions`, `venue_inventory` |

## Architecture Changes

### Before (Old Architecture)
```
Edge Function → Direct Order Write → orders/fills tables
```

### After (New Architecture)
```
Edge Function → Create Intent → multi_leg_intents table → OMS Backend → orders/fills tables
```

## Key Principles

1. **No Direct Order Writes** - Only OMS backend writes to orders/fills
2. **Intent-Based Execution** - Edge functions emit TradeIntents
3. **Multi-Tenant RLS** - All queries respect tenant_id
4. **Idempotency** - All intent creation includes idempotency keys
5. **Audit Logging** - All risk actions are logged

## Example: Converting an Execute Function

### Before (WRONG)
```typescript
case 'execute':
  // Direct order write - VIOLATES OMS-FIRST
  await supabase.from('orders').insert({
    instrument: 'BTC/USD',
    side: 'buy',
    size: 0.1,
    // ...
  });
```

### After (CORRECT)
```typescript
case 'execute':
  // Get tenant_id
  const { auth } = await tenantGuard(supabase, corsHeaders);
  if (!auth) return errorResponse;
  
  // Create intent with idempotency
  const intent_id = crypto.randomUUID();
  const idempotency_key = generateIdempotencyKey('spot_arb', symbol);
  
  await createMultiLegIntent(supabase, {
    tenant_id: auth.tenantId,
    intent_id,
    legs_json: {
      buy_leg: { venue: 'coinbase', symbol: 'BTC/USD', side: 'buy', size: 0.1 },
      sell_leg: { venue: 'kraken', symbol: 'BTC/USD', side: 'sell', size: 0.1 },
    },
    status: 'pending',
    idempotency_key,
  });
  
  // Log audit event
  await logAuditEvent(supabase, {
    tenant_id: auth.tenantId,
    action: 'spot_arb_intent_created',
    resource_type: 'multi_leg_intent',
    resource_id: intent_id,
    after_state: { opportunity, intent_id },
  });
```

## Next Steps

### Immediate Actions Needed
1. **Confirm OMS Backend** - Verify which service is the canonical OMS
2. **Audit Remaining Functions** - Check all edge functions for violations
3. **Update Priority Functions** - Start with cross-exchange-arbitrage and funding-arbitrage
4. **Test Intent Flow** - Verify OMS picks up and executes intents
5. **Retire Violating Functions** - Remove or deprecate direct order writers

### Questions to Answer
1. Is `engine_runner.py` the canonical OMS? If not, what is?
2. Should we retire trading functions or convert them to intent emitters?
3. What's the timeline for frontend updates to use intent-based flow?
4. Do we need a migration period with both old and new flows?

## Files to Review

### Documentation
- `docs/EDGE_FUNCTION_MIGRATION_PLAN.md` - Full migration plan
- `docs/MULTI_TENANT_RLS_GUIDE.md` - Multi-tenant developer guide
- `supabase/migrations/20260108_MIGRATION_NOTES.md` - Database migration notes

### Shared Utilities
- `supabase/functions/_shared/oms-client.ts` - Intent creation utilities
- `supabase/functions/_shared/tenant-guard.ts` - Tenant isolation utilities

### Functions to Update
- `supabase/functions/cross-exchange-arbitrage/index.ts`
- `supabase/functions/funding-arbitrage/index.ts`
- `supabase/functions/live-trading/index.ts` (retire?)
- `supabase/functions/kraken-trading/index.ts` (retire?)
- `supabase/functions/coinbase-trading/index.ts` (retire?)
- `supabase/functions/binance-us-trading/index.ts` (retire?)

## Success Criteria

Migration is complete when:
- ✅ No edge functions write directly to orders/fills
- ✅ All execution flows emit intents
- ✅ All queries respect tenant_id via current_tenant_id()
- ✅ All intents include idempotency keys
- ✅ All risk actions are audit logged
- ✅ OMS backend successfully picks up and executes intents
- ✅ Tests pass for multi-tenant scenarios
- ✅ Frontend updated to use intent-based flow

## Ready for Your Review

I've prepared:
1. ✅ Complete migration plan with code examples
2. ✅ Shared utilities for intent creation and tenant isolation
3. ✅ Documentation for developers
4. ✅ Checklist for implementation

**Waiting on:**
- Final confirmation on OMS architecture
- Decision on which functions to retire vs. update
- Timeline for implementation
- Any additional requirements or constraints

Let me know when you're ready to proceed with the actual function updates! 🚀

