# Edge Function Deployment Guide - OMS-First Migration

**Date:** 2026-01-08  
**Status:** Ready for Deployment

## Prerequisites

✅ Database migrations applied:
- `20260105_basis_arbitrage.sql`
- `20260107_capital_allocator.sql`
- `20260108_enforce_multitenant_rls.sql`

✅ Shared utilities created:
- `_shared/oms-client.ts`
- `_shared/tenant-guard.ts`

## Deployment Steps

### Step 1: Deploy Shared Utilities

```bash
cd enterprise-crypto/supabase/functions

# Deploy shared utilities (these are automatically included in functions)
# No explicit deployment needed - they're imported by functions
```

### Step 2: Deploy Updated Functions

#### 2.1 Deploy cross-exchange-arbitrage

```bash
# Backup current version
cd cross-exchange-arbitrage
cp index.ts index.backup.$(date +%Y%m%d).ts

# Replace with new version
mv index.v2.ts index.ts

# Deploy
cd ..
supabase functions deploy cross-exchange-arbitrage

# Test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cross-exchange-arbitrage \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "scan", "minSpreadBps": 10}'
```

#### 2.2 Deploy funding-arbitrage

```bash
# Backup current version
cd funding-arbitrage
cp index.ts index.backup.$(date +%Y%m%d).ts

# Replace with new version
mv index.v2.ts index.ts

# Deploy
cd ..
supabase functions deploy funding-arbitrage

# Test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/funding-arbitrage \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "scan_funding_opportunities", "minBasisBps": 50}'
```

### Step 3: Verify Deployment

#### 3.1 Check Function Logs

```bash
# View logs for cross-exchange-arbitrage
supabase functions logs cross-exchange-arbitrage --tail

# View logs for funding-arbitrage
supabase functions logs funding-arbitrage --tail
```

#### 3.2 Test Tenant Isolation

```bash
# Test with authenticated user
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cross-exchange-arbitrage \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "scan"}'

# Should return opportunities for user's tenant only
```

#### 3.3 Test Intent Creation

```bash
# Test intent creation
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cross-exchange-arbitrage \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute",
    "opportunity": {
      "symbol": "BTC/USD",
      "buy_venue": "coinbase",
      "sell_venue": "kraken",
      "net_edge_bps": 15,
      "volume": 0.1
    },
    "size": 0.1
  }'

# Should return: {"success": true, "data": {"intent_id": "...", "status": "pending"}}
```

#### 3.4 Verify Database Writes

```sql
-- Check multi_leg_intents table
SELECT * FROM multi_leg_intents 
WHERE tenant_id = current_tenant_id()
ORDER BY created_at DESC 
LIMIT 5;

-- Check audit_events table
SELECT * FROM audit_events 
WHERE tenant_id = current_tenant_id()
AND action LIKE '%intent_created%'
ORDER BY created_at DESC 
LIMIT 5;

-- Check alerts table
SELECT * FROM alerts 
WHERE tenant_id = current_tenant_id()
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 4: Deprecate Old Functions

#### 4.1 Mark Functions as Deprecated

```bash
# Add deprecation notice to old functions
cd live-trading
cat > DEPRECATED.md << 'EOF'
# DEPRECATED

This function is deprecated as of 2026-01-08.

**Reason:** Violates OMS-first architecture by writing directly to orders/fills tables.

**Replacement:** Use OMS backend API for order execution.

**Migration:** See docs/EDGE_FUNCTION_MIGRATION_PLAN.md
EOF

# Repeat for other deprecated functions
cd ../kraken-trading
cp ../live-trading/DEPRECATED.md .

cd ../coinbase-trading
cp ../live-trading/DEPRECATED.md .

cd ../binance-us-trading
cp ../live-trading/DEPRECATED.md .
```

#### 4.2 Update Function to Return Deprecation Warning

```typescript
// Add to top of deprecated function's index.ts
serve(async (req) => {
  console.warn('[DEPRECATED] This function is deprecated. Use OMS backend API instead.');
  
  return new Response(
    JSON.stringify({
      error: 'DEPRECATED',
      message: 'This function is deprecated. Use OMS backend API for order execution.',
      migration_guide: 'See docs/EDGE_FUNCTION_MIGRATION_PLAN.md',
    }),
    {
      status: 410, // Gone
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
```

### Step 5: Update Frontend

#### 5.1 Update API Calls

**Before (OLD):**
```typescript
// Direct execution - WRONG
const { data } = await supabase.functions.invoke('cross-exchange-arbitrage', {
  body: { action: 'execute', opportunity }
});
// Expected: { success: true, data: { order_id: '...' } }
```

**After (NEW):**
```typescript
// Intent-based execution - CORRECT
const { data } = await supabase.functions.invoke('cross-exchange-arbitrage', {
  body: { action: 'execute', opportunity, size: 0.1 }
});
// Returns: { success: true, data: { intent_id: '...', status: 'pending' } }

// Poll for intent status
const checkIntentStatus = async (intent_id: string) => {
  const { data } = await supabase
    .from('multi_leg_intents')
    .select('status, legs_json')
    .eq('id', intent_id)
    .single();
  
  return data;
};
```

#### 5.2 Update UI Components

```typescript
// Show intent status instead of order status
const IntentStatus = ({ intent_id }: { intent_id: string }) => {
  const [status, setStatus] = useState('pending');
  
  useEffect(() => {
    const subscription = supabase
      .channel('intent_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'multi_leg_intents',
        filter: `id=eq.${intent_id}`,
      }, (payload) => {
        setStatus(payload.new.status);
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [intent_id]);
  
  return <Badge>{status}</Badge>;
};
```

### Step 6: Monitor and Validate

#### 6.1 Monitor Intent Execution

```sql
-- Check intent execution rate
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_execution_time_seconds
FROM multi_leg_intents
WHERE tenant_id = current_tenant_id()
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

#### 6.2 Monitor Audit Events

```sql
-- Check audit event rate
SELECT 
  action,
  COUNT(*) as count
FROM audit_events
WHERE tenant_id = current_tenant_id()
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY action
ORDER BY count DESC;
```

#### 6.3 Monitor Alerts

```sql
-- Check alert rate
SELECT 
  severity,
  COUNT(*) as count
FROM alerts
WHERE tenant_id = current_tenant_id()
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY severity;
```

## Rollback Plan

If issues are detected:

### Rollback Step 1: Restore Old Functions

```bash
# Restore cross-exchange-arbitrage
cd cross-exchange-arbitrage
cp index.backup.YYYYMMDD.ts index.ts
supabase functions deploy cross-exchange-arbitrage

# Restore funding-arbitrage
cd ../funding-arbitrage
cp index.backup.YYYYMMDD.ts index.ts
supabase functions deploy funding-arbitrage
```

### Rollback Step 2: Verify Old Functions Work

```bash
# Test old function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cross-exchange-arbitrage \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "scan"}'
```

## Success Criteria

✅ All tests pass  
✅ No errors in function logs  
✅ Intents are created successfully  
✅ Audit events are logged  
✅ Alerts are created  
✅ Tenant isolation is enforced  
✅ Frontend displays intent status correctly  
✅ OMS backend picks up and executes intents  

## Support

For issues or questions:
1. Check function logs: `supabase functions logs <function-name>`
2. Review migration plan: `docs/EDGE_FUNCTION_MIGRATION_PLAN.md`
3. Review quick reference: `docs/EDGE_FUNCTION_QUICK_REFERENCE.md`
4. Contact platform team

