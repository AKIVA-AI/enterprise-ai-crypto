-- Lock down system_health table: clients can only SELECT, not write
-- Service role (used by edge functions) can still write

-- First, drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view system health" ON public.system_health;
DROP POLICY IF EXISTS "System can update health" ON public.system_health;

-- Create strict read-only policy for authenticated users
CREATE POLICY "Authenticated users can view system health"
ON public.system_health
FOR SELECT
TO authenticated
USING (true);

-- Create anon read policy (for monitoring dashboards)
CREATE POLICY "Anon can view system health"
ON public.system_health
FOR SELECT
TO anon
USING (true);

-- Note: Service role (used by edge functions) bypasses RLS entirely
-- so no INSERT/UPDATE/DELETE policies needed for service role writes

-- Add unique constraint on component if not exists (for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_health_component_key'
  ) THEN
    ALTER TABLE public.system_health ADD CONSTRAINT system_health_component_key UNIQUE (component);
  END IF;
END $$;