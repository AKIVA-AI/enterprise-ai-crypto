
-- Create a masked view for wallets that hides full addresses
CREATE OR REPLACE VIEW public.wallets_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  -- Mask wallet address: show first 6 and last 4 chars
  CASE 
    WHEN length(address) > 10 THEN 
      substring(address from 1 for 6) || '...' || substring(address from length(address) - 3)
    ELSE '***masked***'
  END AS address_masked,
  network,
  type,
  currency,
  balance,
  usd_value,
  signers,
  required_signers,
  pending_approvals,
  is_watch_only,
  last_synced_at,
  metadata,
  created_at,
  updated_at
FROM public.wallets;

-- Drop existing overly broad SELECT policy on wallets base table
DROP POLICY IF EXISTS "Wallets viewable by admin and CIO only" ON public.wallets;

-- Recreate the SELECT policy to deny direct reads (force use of masked view)
-- Admin/CIO manage policy still allows INSERT/UPDATE/DELETE
CREATE POLICY "Deny direct wallet reads use masked view"
  ON public.wallets FOR SELECT
  USING (false);
