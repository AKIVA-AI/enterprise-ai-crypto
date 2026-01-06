-- =============================================================================
-- Fix Audit Log RLS Policies - P0 Security Issue
-- Date: 2026-01-06
-- Issue: PUBLIC_DATA_EXPOSURE - Audit logs readable by all authenticated users
-- =============================================================================

-- Drop the overly permissive policy that allows all users to view audit logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.exchange_key_audit_log;

-- =============================================================================
-- Create role-based access control for audit logs
-- Only admin and auditor roles should be able to view audit logs
-- =============================================================================

-- Policy 1: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.exchange_key_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy 2: Auditors can view all audit logs
CREATE POLICY "Auditors can view all audit logs"
  ON public.exchange_key_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'auditor'
    )
  );

-- Policy 3: Users can ONLY view their own audit logs (not others')
-- This is a fallback for users to see their own activity
CREATE POLICY "Users can view their own audit logs only"
  ON public.exchange_key_audit_log
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- =============================================================================
-- Add additional security: Redact sensitive fields for non-admin users
-- =============================================================================

-- Create a secure view that redacts IP addresses and user agents for non-admins
CREATE OR REPLACE VIEW public.user_audit_log_view AS
SELECT
  id,
  user_id,
  exchange,
  action,
  -- Redact IP address for non-admin users
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'auditor')
    )
    THEN ip_address
    ELSE NULL
  END AS ip_address,
  -- Redact user agent for non-admin users
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'auditor')
    )
    THEN user_agent
    ELSE NULL
  END AS user_agent,
  metadata,
  created_at
FROM public.exchange_key_audit_log
WHERE
  -- Users can only see their own logs
  user_id = auth.uid()
  OR
  -- Admins and auditors can see all logs
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'auditor')
  );

-- Grant access to the view
GRANT SELECT ON public.user_audit_log_view TO authenticated;

-- =============================================================================
-- Add comments documenting the security requirements
-- =============================================================================

COMMENT ON POLICY "Admins can view all audit logs" ON public.exchange_key_audit_log IS
'Admins have full access to all audit logs for security monitoring and compliance.';

COMMENT ON POLICY "Auditors can view all audit logs" ON public.exchange_key_audit_log IS
'Auditors have full access to all audit logs for compliance and security audits.';

COMMENT ON POLICY "Users can view their own audit logs only" ON public.exchange_key_audit_log IS
'Users can only view their own audit logs, not other users'' logs. This is for transparency and self-monitoring.';

COMMENT ON VIEW public.user_audit_log_view IS
'Secure view of audit logs that redacts sensitive fields (IP address, user agent) for non-admin users.
Admins and auditors see full details. Regular users only see their own logs with redacted sensitive fields.';

-- =============================================================================
-- Create audit log for this security fix
-- =============================================================================

INSERT INTO public.exchange_key_audit_log (
  user_id,
  exchange,
  action,
  metadata
)
SELECT
  auth.uid(),
  'system',
  'security_fix_applied',
  jsonb_build_object(
    'fix', 'audit_log_rls_restriction',
    'severity', 'P0',
    'issue', 'PUBLIC_DATA_EXPOSURE',
    'description', 'Restricted audit log access to admin/auditor roles only',
    'applied_at', NOW()
  )
WHERE auth.uid() IS NOT NULL;

