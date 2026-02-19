
-- Fix 1: arbitrage_state - Service role policy is on {public} role, should be service_role only
DROP POLICY IF EXISTS "Service role manages arbitrage state" ON public.arbitrage_state;
CREATE POLICY "Service role manages arbitrage state"
ON public.arbitrage_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: system_health - Remove public/anon access, restrict to ops and above
DROP POLICY IF EXISTS "Anon can view system health" ON public.system_health;
DROP POLICY IF EXISTS "Authenticated users can view system health" ON public.system_health;
CREATE POLICY "System health viewable by ops and above"
ON public.system_health
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'ops'::app_role]));
