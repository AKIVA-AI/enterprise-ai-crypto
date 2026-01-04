# Multi-Tenant RLS Enforcement Migration

**Migration File:** `20260108_enforce_multitenant_rls.sql`  
**Date:** 2026-01-08  
**Purpose:** Enforce multi-tenant Row Level Security (RLS) and backfill tenant_id for existing data

## Overview

This migration completes the multi-tenant architecture introduced in `20260105_basis_arbitrage.sql` by:

1. Creating a default tenant for existing data
2. Backfilling `tenant_id` on `venues` and `strategies` tables
3. Creating `user_tenants` entries for all existing users
4. Updating RLS policies to enforce `tenant_id = current_tenant_id()`
5. Adding NOT NULL constraints on `tenant_id`
6. Improving `current_tenant_id()` function with better fallback logic
7. Adding performance indexes on `tenant_id` columns
8. Updating `leg_events` RLS for authenticated read access within tenant

## What Changed

### Tables Modified

#### `venues`
- **Before:** `tenant_id` was nullable, old RLS allowed all authenticated users
- **After:** `tenant_id` is NOT NULL, RLS enforces tenant isolation
- **Policies:**
  - ✅ "Tenant members can view venues" - SELECT within tenant
  - ✅ "Tenant admins can manage venues" - ALL for admin/cio/ops within tenant
  - ✅ "Service role full access to venues" - Bypass RLS for service_role

#### `strategies`
- **Before:** `tenant_id` was nullable, old RLS allowed all authenticated users
- **After:** `tenant_id` is NOT NULL, RLS enforces tenant isolation
- **Policies:**
  - ✅ "Tenant members can view strategies" - SELECT within tenant
  - ✅ "Tenant traders can manage strategies" - ALL for admin/cio/trader within tenant
  - ✅ "Service role full access to strategies" - Bypass RLS for service_role

#### `leg_events`
- **Before:** Only had "Tenant scoped access leg_events" for ALL operations
- **After:** Separate policies for SELECT (read) and INSERT (append-only)
- **Policies:**
  - ✅ "Tenant members can view leg_events" - SELECT within tenant
  - ✅ "Tenant members can insert leg_events" - INSERT within tenant
  - ✅ "Service role full access to leg_events" - Bypass RLS for service_role

### Functions Modified

#### `current_tenant_id()`
- **Before:** Returned NULL if user had no default tenant
- **After:** Falls back to user's oldest tenant if no default is set
- **Behavior:**
  1. First tries to get user's default tenant (`is_default = true`)
  2. Falls back to user's oldest tenant (by `created_at`)
  3. Returns NULL only if user has no tenants at all

### Data Backfill

The migration automatically:
1. Creates a tenant named "Default Organization"
2. Assigns all existing users to this tenant with their highest role
3. Sets this tenant as the default for all users (`is_default = true`)
4. Backfills `tenant_id` on all existing `venues` and `strategies` rows
5. Creates indexes for performance

## Running the Migration

### Prerequisites
- Supabase CLI installed
- Connected to your Supabase project

### Apply Migration

```bash
# Navigate to project directory
cd akiva-ai-crypto

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up --db-url "your-database-url"
```

### Verify Migration

After running the migration, execute these verification queries in the Supabase SQL Editor:

```sql
-- 1. Verify all venues have tenant_id (should return 0)
SELECT COUNT(*) as venues_without_tenant 
FROM public.venues 
WHERE tenant_id IS NULL;

-- 2. Verify all strategies have tenant_id (should return 0)
SELECT COUNT(*) as strategies_without_tenant 
FROM public.strategies 
WHERE tenant_id IS NULL;

-- 3. Verify all users have a default tenant (should return 0)
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_tenants ut
  WHERE ut.user_id = u.id AND ut.is_default = true
);

-- 4. View tenant distribution
SELECT
  t.name as tenant_name,
  COUNT(DISTINCT v.id) as venue_count,
  COUNT(DISTINCT s.id) as strategy_count,
  COUNT(DISTINCT ut.user_id) as user_count
FROM public.tenants t
LEFT JOIN public.venues v ON v.tenant_id = t.id
LEFT JOIN public.strategies s ON s.tenant_id = t.id
LEFT JOIN public.user_tenants ut ON ut.tenant_id = t.id
GROUP BY t.id, t.name;

-- 5. Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('venues', 'strategies', 'leg_events')
ORDER BY tablename, policyname;

-- 6. Test current_tenant_id() function (run as authenticated user)
SELECT public.current_tenant_id() as my_tenant_id;
```

## Security Implications

### ✅ Improvements
- **Tenant Isolation:** Users can only see data for their tenant
- **Service Role Access:** Backend services can still manage all data
- **Role-Based Access:** Maintains existing role hierarchy within tenants
- **No Data Loss:** All existing data is preserved under default tenant

### ⚠️ Important Notes
- **Breaking Change:** Authenticated users can no longer see data from other tenants
- **Service Role Required:** Backend operations that need cross-tenant access must use service_role
- **Default Tenant:** All existing data is assigned to "Default Organization"
- **User Assignment:** All existing users are automatically assigned to the default tenant

## Rollback Plan

If you need to rollback this migration:

```sql
-- 1. Drop new policies
DROP POLICY IF EXISTS "Tenant members can view venues" ON public.venues;
DROP POLICY IF EXISTS "Tenant admins can manage venues" ON public.venues;
DROP POLICY IF EXISTS "Service role full access to venues" ON public.venues;
DROP POLICY IF EXISTS "Tenant members can view strategies" ON public.strategies;
DROP POLICY IF EXISTS "Tenant traders can manage strategies" ON public.strategies;
DROP POLICY IF EXISTS "Service role full access to strategies" ON public.strategies;
DROP POLICY IF EXISTS "Tenant members can view leg_events" ON public.leg_events;
DROP POLICY IF EXISTS "Tenant members can insert leg_events" ON public.leg_events;
DROP POLICY IF EXISTS "Service role full access to leg_events" ON public.leg_events;

-- 2. Restore old policies (from previous migrations)
CREATE POLICY "Venues viewable by authenticated" ON public.venues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/CIO/Ops can manage venues" ON public.venues
  FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'cio', 'ops']::app_role[]));

CREATE POLICY "Strategies viewable by authenticated" ON public.strategies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Trader and above can manage strategies" ON public.strategies
  FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'cio', 'trader']::app_role[]));

-- 3. Make tenant_id nullable again (optional - keeps backfilled data)
ALTER TABLE public.venues ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.strategies ALTER COLUMN tenant_id DROP NOT NULL;
```

## Next Steps

After applying this migration:

1. **Test Authentication:** Verify users can only see their tenant's data
2. **Update Backend:** Ensure backend services use service_role for cross-tenant operations
3. **Update Frontend:** Verify UI correctly displays tenant-scoped data
4. **Monitor Performance:** Check query performance with new indexes
5. **User Management:** Set up process for adding users to tenants

## Support

For issues or questions, contact the platform team or refer to:
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Multi-tenancy Guide: https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy

