-- Restrict tradeable_instruments SELECT to authenticated traders and above
DROP POLICY IF EXISTS "Authenticated users can read tradeable instruments" ON public.tradeable_instruments;

CREATE POLICY "Tradeable instruments viewable by traders and above"
ON public.tradeable_instruments
FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'cio'::app_role, 'trader'::app_role, 'ops'::app_role, 'research'::app_role]));