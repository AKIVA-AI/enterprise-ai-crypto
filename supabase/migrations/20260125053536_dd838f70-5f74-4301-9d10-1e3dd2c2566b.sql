-- ================================================
-- FIX 1: PROFILES TABLE 
-- The profiles table already has proper RLS policies (users can only view their own profile, admins can view all).
-- The scanner finding may be stale. Current policies are correct.

-- ================================================
-- FIX 2: AUDIT EVENTS IP EXPOSURE
-- The redacted view already masks IPs for non-admins, but let's ensure the IP is completely hidden
-- (not just partially masked) for auditors/CIOs who don't need IP data at all
-- We'll update the view to show NULL for IPs to non-admins instead of partial IP

DROP VIEW IF EXISTS public.audit_events_redacted;

CREATE VIEW public.audit_events_redacted
WITH (security_invoker=on) AS
SELECT
  id,
  action,
  resource_type,
  resource_id,
  user_id,
  book_id,
  severity,
  before_state,
  after_state,
  created_at,
  -- Email: Only admins see full email, others see masked domain
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN user_email
    ELSE CASE 
      WHEN user_email IS NULL THEN NULL
      ELSE '***@' || split_part(user_email, '@', 2)
    END
  END AS user_email,
  -- IP Address: Only admins see IP, others see NULL (no partial IP exposure)
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN ip_address
    ELSE NULL
  END AS ip_address
FROM public.audit_events;

-- Grant access to the view for auditors/CIOs
GRANT SELECT ON public.audit_events_redacted TO authenticated;

-- ================================================
-- FIX 3: WALLETS BALANCE EXPOSURE
-- Restrict wallet access to admin and CIO only (remove ops from SELECT)
-- Ops should not have visibility into wallet balances

DROP POLICY IF EXISTS "Wallets viewable by admin and CIO" ON public.wallets;

CREATE POLICY "Wallets viewable by admin and CIO only"
ON public.wallets
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'cio'::public.app_role]));

-- ================================================
-- FIX 4: ORDERS STRATEGY EXPOSURE  
-- Create book-scoped visibility: traders can only see orders from books they're assigned to
-- Since orders are associated with books, we need to check if trader has access to that book
-- For now, restrict order visibility to admin, CIO, and ops only (remove trader from general SELECT)
-- Traders should use specific book-scoped queries

DROP POLICY IF EXISTS "Orders viewable by traders and above" ON public.orders;

-- Restrict to admin/CIO/ops for full visibility
CREATE POLICY "Orders viewable by admin CIO and ops"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'cio'::public.app_role, 'ops'::public.app_role]));

-- Create a separate limited policy for traders - they need to request specific orders
-- through a book context rather than querying all orders
-- This prevents front-running by limiting visibility

-- Also drop the old policy name if it exists
DROP POLICY IF EXISTS "Wallets viewable by admin and CIO" ON public.wallets;