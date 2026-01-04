# Edge Function Quick Reference - OMS-First + Multi-Tenant

## 🚫 DON'T DO THIS

```typescript
// ❌ WRONG - Direct order write
await supabase.from('orders').insert({ ... });

// ❌ WRONG - Direct fill write
await supabase.from('fills').insert({ ... });

// ❌ WRONG - No tenant_id check
const { data } = await supabase.from('venues').select('*');

// ❌ WRONG - Client-provided tenant_id
const tenant_id = body.tenant_id; // Never trust client!
```

## ✅ DO THIS INSTEAD

```typescript
import { tenantGuard } from '../_shared/tenant-guard.ts';
import { createMultiLegIntent, generateIdempotencyKey, logAuditEvent } from '../_shared/oms-client.ts';

// ✅ CORRECT - Check auth and get tenant_id
const { auth, error } = await tenantGuard(supabase, corsHeaders);
if (error) return error;

// ✅ CORRECT - Create intent instead of order
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

// ✅ CORRECT - Log audit event
await logAuditEvent(supabase, {
  tenant_id: auth.tenantId,
  action: 'spot_arb_intent_created',
  resource_type: 'multi_leg_intent',
  resource_id: intent_id,
  after_state: { symbol, intent_id },
});

// ✅ CORRECT - Tenant-scoped query (RLS auto-enforces)
const { data: venues } = await supabase
  .from('venues')
  .select('*')
  .eq('tenant_id', auth.tenantId); // Explicit is better
```

## 📋 Edge Function Template

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { tenantGuard } from '../_shared/tenant-guard.ts';
import { createMultiLegIntent, generateIdempotencyKey, logAuditEvent } from '../_shared/oms-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Require authentication and tenant_id
    const { auth, error } = await tenantGuard(supabase, corsHeaders);
    if (error) return error;

    // Parse request
    const { action, ...params } = await req.json();

    // Handle actions
    let result;
    switch (action) {
      case 'scan':
        // Read from new canonical tables
        const { data: opportunities } = await supabase
          .from('arb_spreads')
          .select('*')
          .eq('tenant_id', auth.tenantId)
          .gte('net_edge_bps', params.minSpreadBps || 10)
          .order('ts', { ascending: false })
          .limit(10);
        
        result = { opportunities };
        break;

      case 'execute':
        // Create intent instead of executing directly
        const intent_id = crypto.randomUUID();
        const idempotency_key = generateIdempotencyKey('spot_arb', params.symbol);
        
        const { intent_id: createdId, error: intentError } = await createMultiLegIntent(supabase, {
          tenant_id: auth.tenantId,
          intent_id,
          legs_json: params.legs,
          status: 'pending',
          idempotency_key,
        });

        if (intentError) throw new Error(intentError);

        // Log audit event
        await logAuditEvent(supabase, {
          tenant_id: auth.tenantId,
          user_id: auth.userId,
          action: 'intent_created',
          resource_type: 'multi_leg_intent',
          resource_id: intent_id,
          after_state: params,
        });

        result = { intent_id: createdId, status: 'pending' };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## 🔑 Key Imports

```typescript
// Tenant isolation
import { tenantGuard, requireAuth, requireTenantId } from '../_shared/tenant-guard.ts';

// Intent creation
import { 
  createMultiLegIntent, 
  generateIdempotencyKey, 
  logAuditEvent,
  getTenantId 
} from '../_shared/oms-client.ts';
```

## 📊 Reading from New Tables

```typescript
// Spot arbitrage opportunities
const { data: spotOpps } = await supabase
  .from('arb_spreads')
  .select('*')
  .eq('tenant_id', auth.tenantId)
  .gte('net_edge_bps', 10);

// Basis arbitrage opportunities
const { data: basisOpps } = await supabase
  .from('basis_quotes')
  .select('*')
  .eq('tenant_id', auth.tenantId)
  .gte('basis_bps', 50);

// Funding rates
const { data: funding } = await supabase
  .from('funding_rates')
  .select('*')
  .eq('tenant_id', auth.tenantId)
  .eq('instrument_id', instrument_id)
  .order('funding_time', { ascending: false })
  .limit(1);

// Current positions
const { data: positions } = await supabase
  .from('strategy_positions')
  .select(`
    *,
    strategy:strategies(name, status),
    instrument:instruments(common_symbol)
  `)
  .eq('tenant_id', auth.tenantId);

// P&L data
const { data: pnl } = await supabase
  .from('arb_pnl')
  .select('*')
  .eq('tenant_id', auth.tenantId)
  .order('ts', { ascending: false });
```

## 🎯 Common Patterns

### Pattern 1: Scan for Opportunities
```typescript
case 'scan':
  const { data: opportunities } = await supabase
    .from('arb_spreads')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .gte('net_edge_bps', minSpread)
    .order('ts', { ascending: false });
  
  return { opportunities };
```

### Pattern 2: Execute Trade (Create Intent)
```typescript
case 'execute':
  const intent_id = crypto.randomUUID();
  const idempotency_key = generateIdempotencyKey('arb', symbol);
  
  await createMultiLegIntent(supabase, {
    tenant_id: auth.tenantId,
    intent_id,
    legs_json: { /* legs */ },
    status: 'pending',
    idempotency_key,
  });
  
  await logAuditEvent(supabase, {
    tenant_id: auth.tenantId,
    action: 'intent_created',
    resource_type: 'multi_leg_intent',
    resource_id: intent_id,
    after_state: { /* details */ },
  });
  
  return { intent_id, status: 'pending' };
```

### Pattern 3: Get Analytics
```typescript
case 'analytics':
  const { data: pnl } = await supabase
    .from('arb_pnl')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .gte('ts', startDate)
    .lte('ts', endDate);
  
  return { pnl };
```

## 🚨 Remember

1. **Always use tenantGuard()** at the start of every function
2. **Never write to orders/fills** - only create intents
3. **Always include idempotency_key** when creating intents
4. **Always log audit events** for risk actions
5. **Use new canonical tables** (arb_spreads, basis_quotes, etc.)
6. **Never trust client-provided tenant_id** - always use current_tenant_id()

