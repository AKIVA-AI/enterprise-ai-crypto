-- Enforce Multi-Tenant RLS and Backfill tenant_id
-- Date: 2026-01-08
-- 
-- This migration:
-- 1. Creates a default tenant for existing data
-- 2. Backfills tenant_id on venues and strategies tables
-- 3. Creates user_tenants entries for all existing users
-- 4. Updates RLS policies to enforce tenant_id = current_tenant_id()
-- 5. Adds NOT NULL constraints on tenant_id
-- 6. Improves current_tenant_id() function with better fallback
-- 7. Adds indexes on tenant_id
-- 8. Updates leg_events RLS for authenticated read access within tenant

-- ============================================================================
-- STEP 1: Create default tenant if it doesn't exist
-- ============================================================================

DO $$
DECLARE
  v_default_tenant_id UUID;
  v_admin_user_id UUID;
  v_user_record RECORD;
BEGIN
  -- Create or get default tenant
  INSERT INTO public.tenants (id, name, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Default Organization',
    now(),
    now()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_default_tenant_id;

  -- If tenant already exists, get its ID
  IF v_default_tenant_id IS NULL THEN
    SELECT id INTO v_default_tenant_id
    FROM public.tenants
    WHERE name = 'Default Organization'
    LIMIT 1;
  END IF;

  -- Find first admin or CIO user to be the default tenant owner
  SELECT u.id INTO v_admin_user_id
  FROM auth.users u
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ur.role IN ('admin', 'cio')
  ORDER BY u.created_at ASC
  LIMIT 1;

  -- If no admin/CIO found, use the oldest user
  IF v_admin_user_id IS NULL THEN
    SELECT id INTO v_admin_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Create user_tenants entries for all existing users
  -- Assign them to the default tenant with their highest role
  FOR v_user_record IN
    SELECT DISTINCT u.id as user_id,
           COALESCE(
             (SELECT role FROM public.user_roles WHERE user_id = u.id ORDER BY
               CASE role
                 WHEN 'admin' THEN 1
                 WHEN 'cio' THEN 2
                 WHEN 'trader' THEN 3
                 WHEN 'ops' THEN 4
                 WHEN 'research' THEN 5
                 WHEN 'auditor' THEN 6
                 WHEN 'viewer' THEN 7
               END
             LIMIT 1),
             'viewer'::app_role
           ) as highest_role
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id = u.id AND ut.tenant_id = v_default_tenant_id
    )
  LOOP
    INSERT INTO public.user_tenants (tenant_id, user_id, role, is_default, created_at)
    VALUES (
      v_default_tenant_id,
      v_user_record.user_id,
      v_user_record.highest_role,
      true,  -- Set as default tenant for all users
      now()
    )
    ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET is_default = true,
        role = EXCLUDED.role;
  END LOOP;

  -- Backfill tenant_id on venues table
  UPDATE public.venues
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;

  -- Backfill tenant_id on strategies table
  UPDATE public.strategies
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE 'Default tenant created/updated: %', v_default_tenant_id;
  RAISE NOTICE 'Backfilled % venues', (SELECT COUNT(*) FROM public.venues WHERE tenant_id = v_default_tenant_id);
  RAISE NOTICE 'Backfilled % strategies', (SELECT COUNT(*) FROM public.strategies WHERE tenant_id = v_default_tenant_id);
  RAISE NOTICE 'Created % user_tenant entries', (SELECT COUNT(*) FROM public.user_tenants WHERE tenant_id = v_default_tenant_id);
END $$;

-- ============================================================================
-- STEP 2: Add NOT NULL constraints on tenant_id
-- ============================================================================

ALTER TABLE public.venues
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.strategies
  ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- STEP 3: Add indexes on tenant_id for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_venues_tenant_id ON public.venues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_strategies_tenant_id ON public.strategies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_default ON public.user_tenants(user_id, is_default) WHERE is_default = true;

-- ============================================================================
-- STEP 4: Improve current_tenant_id() function with better fallback
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  -- First try to get the user's default tenant
  SELECT COALESCE(
    (SELECT tenant_id
     FROM public.user_tenants
     WHERE user_id = auth.uid() AND is_default = true
     LIMIT 1),
    -- Fallback: get the user's first tenant (oldest)
    (SELECT tenant_id
     FROM public.user_tenants
     WHERE user_id = auth.uid()
     ORDER BY created_at ASC
     LIMIT 1)
  );
$$;

-- ============================================================================
-- STEP 5: Update RLS policies for venues table
-- ============================================================================

-- Drop old policies that allow all authenticated users
DROP POLICY IF EXISTS "Venues viewable by authenticated" ON public.venues;
DROP POLICY IF EXISTS "Venues viewable by traders and above" ON public.venues;
DROP POLICY IF EXISTS "Admin/CIO/Ops can manage venues" ON public.venues;

-- Create new tenant-scoped policies
CREATE POLICY "Tenant members can view venues"
  ON public.venues FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant admins can manage venues"
  ON public.venues FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() AND
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'ops'::app_role])
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() AND
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'ops'::app_role])
  );

-- Service role has full access (bypass RLS)
CREATE POLICY "Service role full access to venues"
  ON public.venues FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: Update RLS policies for strategies table
-- ============================================================================

-- Drop old policies that allow all authenticated users
DROP POLICY IF EXISTS "Strategies viewable by authenticated" ON public.strategies;
DROP POLICY IF EXISTS "Strategies viewable by research and above" ON public.strategies;
DROP POLICY IF EXISTS "Trader and above can manage strategies" ON public.strategies;

-- Create new tenant-scoped policies
CREATE POLICY "Tenant members can view strategies"
  ON public.strategies FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant traders can manage strategies"
  ON public.strategies FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() AND
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'trader'::app_role])
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() AND
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'trader'::app_role])
  );

-- Service role has full access (bypass RLS)
CREATE POLICY "Service role full access to strategies"
  ON public.strategies FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 7: Update RLS policies for leg_events (allow read within tenant)
-- ============================================================================

-- leg_events should be append-only for INSERT, but readable by authenticated users in tenant
DROP POLICY IF EXISTS "Tenant scoped access leg_events" ON public.leg_events;

-- Allow SELECT for authenticated users within tenant
CREATE POLICY "Tenant members can view leg_events"
  ON public.leg_events FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- Keep append-only INSERT for authenticated users
CREATE POLICY "Tenant members can insert leg_events"
  ON public.leg_events FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Service role has full access
CREATE POLICY "Service role full access to leg_events"
  ON public.leg_events FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- Verify all venues have tenant_id
-- Expected: 0 rows
-- SELECT COUNT(*) as venues_without_tenant FROM public.venues WHERE tenant_id IS NULL;

-- Verify all strategies have tenant_id
-- Expected: 0 rows
-- SELECT COUNT(*) as strategies_without_tenant FROM public.strategies WHERE tenant_id IS NULL;

-- Verify all users have a default tenant
-- Expected: 0 rows (all users should have at least one tenant)
-- SELECT u.id, u.email
-- FROM auth.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.user_tenants ut
--   WHERE ut.user_id = u.id AND ut.is_default = true
-- );

-- Verify tenant distribution
-- Expected: Shows how many venues/strategies per tenant
-- SELECT
--   t.name as tenant_name,
--   COUNT(DISTINCT v.id) as venue_count,
--   COUNT(DISTINCT s.id) as strategy_count,
--   COUNT(DISTINCT ut.user_id) as user_count
-- FROM public.tenants t
-- LEFT JOIN public.venues v ON v.tenant_id = t.id
-- LEFT JOIN public.strategies s ON s.tenant_id = t.id
-- LEFT JOIN public.user_tenants ut ON ut.tenant_id = t.id
-- GROUP BY t.id, t.name;

-- Verify RLS policies are in place
-- Expected: Shows new tenant-scoped policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('venues', 'strategies', 'leg_events')
-- ORDER BY tablename, policyname;

-- Test current_tenant_id() function
-- Expected: Returns a valid UUID for authenticated users
-- SELECT public.current_tenant_id() as my_tenant_id;

-- Verify indexes exist
-- Expected: Shows indexes on tenant_id columns
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('venues', 'strategies', 'user_tenants')
--   AND indexname LIKE '%tenant%'
-- ORDER BY tablename, indexname;

