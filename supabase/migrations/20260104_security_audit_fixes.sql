-- =============================================================================
-- Security Audit Fixes Migration
-- Date: 2026-01-04
-- Addresses: CLINE/CODEX audit findings
-- =============================================================================

-- =============================================================================
-- FIX P0-1: RLS "Service role can manage" policies missing TO service_role
-- These policies currently grant PUBLIC write access - CRITICAL vulnerability
-- =============================================================================

-- Drop the problematic policies and recreate with proper TO clause
-- Intelligence tables (from 20251226173351)
DROP POLICY IF EXISTS "Service role can manage market news" ON public.market_news;
DROP POLICY IF EXISTS "Service role can manage social sentiment" ON public.social_sentiment;
DROP POLICY IF EXISTS "Service role can manage onchain metrics" ON public.onchain_metrics;
DROP POLICY IF EXISTS "Service role can manage whale wallets" ON public.whale_wallets;
DROP POLICY IF EXISTS "Service role can manage whale transactions" ON public.whale_transactions;
DROP POLICY IF EXISTS "Service role can manage derivatives metrics" ON public.derivatives_metrics;
DROP POLICY IF EXISTS "Service role can manage intelligence signals" ON public.intelligence_signals;

-- Tradeable instruments (from 20251231214946)
DROP POLICY IF EXISTS "Service role can manage tradeable instruments" ON public.tradeable_instruments;

-- System health policies (from 20260101040417 and 20260101151426)
DROP POLICY IF EXISTS "System can update health" ON public.system_health;
DROP POLICY IF EXISTS "Service role can insert system health" ON public.system_health;
DROP POLICY IF EXISTS "Service role can update system health" ON public.system_health;
DROP POLICY IF EXISTS "Service role can insert venue health" ON public.venue_health;

-- Decision traces and market data metrics (from 20260101040417)
DROP POLICY IF EXISTS "System can insert decision traces" ON public.decision_traces;
DROP POLICY IF EXISTS "System can insert market data metrics" ON public.market_data_metrics;

-- Exchange key audit log (from 20260103)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.exchange_key_audit_log;

-- =============================================================================
-- Recreate policies with proper service_role restriction
-- NOTE: Service role bypasses RLS by default, but explicit policies are clearer
-- and protect against misconfiguration
-- =============================================================================

-- Intelligence tables - service role only for writes
CREATE POLICY "Service role manages market news" ON public.market_news 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages social sentiment" ON public.social_sentiment 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages onchain metrics" ON public.onchain_metrics 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages whale wallets" ON public.whale_wallets 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages whale transactions" ON public.whale_transactions 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages derivatives metrics" ON public.derivatives_metrics 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages intelligence signals" ON public.intelligence_signals 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tradeable instruments - service role only
CREATE POLICY "Service role manages tradeable instruments" ON public.tradeable_instruments 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- System health - service role only (edge functions write here)
CREATE POLICY "Service role manages system health" ON public.system_health 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Venue health - service role only
CREATE POLICY "Service role manages venue health" ON public.venue_health 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Market data metrics - service role only
CREATE POLICY "Service role manages market data metrics" ON public.market_data_metrics 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Exchange key audit log - service role only (security sensitive)
CREATE POLICY "Service role manages exchange key audit" ON public.exchange_key_audit_log 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX P1-1: Decision traces - move to server-side only
-- Remove client write access, only service role can insert
-- =============================================================================
DROP POLICY IF EXISTS "System can insert decision traces" ON public.decision_traces;

CREATE POLICY "Service role manages decision traces" ON public.decision_traces 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX P1-2: Audit events - restrict client write access
-- Currently any authenticated user can insert - security risk
-- =============================================================================
DROP POLICY IF EXISTS "System can insert audit events" ON public.audit_events;

-- Only service role can write to audit events (via edge functions)
CREATE POLICY "Service role manages audit events" ON public.audit_events 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX: Strategy signals - add service role write policy
-- Edge functions need to insert signals
-- =============================================================================
CREATE POLICY "Service role manages strategy signals" ON public.strategy_signals 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX: Meme metrics - add service role write policy
-- =============================================================================
CREATE POLICY "Service role manages meme metrics" ON public.meme_metrics 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX: Alerts - add service role write policy for edge functions
-- =============================================================================
CREATE POLICY "Service role manages alerts" ON public.alerts 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX: Risk breaches - add service role write policy
-- =============================================================================
CREATE POLICY "Service role manages risk breaches" ON public.risk_breaches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX P0-4: Lock down orders/positions/fills to service role only
-- Trading Gate bypass vulnerability - traders can write directly via RLS
-- =============================================================================

-- Orders - remove authenticated write, add service role only
DROP POLICY IF EXISTS "System can manage orders" ON public.orders;
CREATE POLICY "Service role manages orders" ON public.orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Positions - remove authenticated write, add service role only
DROP POLICY IF EXISTS "System can manage positions" ON public.positions;
CREATE POLICY "Service role manages positions" ON public.positions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FIX P1-2: Add missing database indexes for performance
-- =============================================================================

-- Orders indexes (critical for OMS queries)
CREATE INDEX IF NOT EXISTS idx_orders_book_status_created
  ON public.orders(book_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_strategy_status
  ON public.orders(strategy_id, status) WHERE strategy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_venue_status
  ON public.orders(venue_id, status) WHERE venue_id IS NOT NULL;

-- Positions indexes (critical for risk calculations)
CREATE INDEX IF NOT EXISTS idx_positions_book_open
  ON public.positions(book_id, is_open) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_positions_strategy_open
  ON public.positions(strategy_id, is_open) WHERE is_open = true AND strategy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_positions_instrument_open
  ON public.positions(instrument, is_open) WHERE is_open = true;

-- Audit events indexes (critical for compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created
  ON public.audit_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_events_action_created
  ON public.audit_events(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type
  ON public.audit_events(resource_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_book_created
  ON public.audit_events(book_id, created_at DESC) WHERE book_id IS NOT NULL;

-- Strategy signals indexes
CREATE INDEX IF NOT EXISTS idx_strategy_signals_strategy_created
  ON public.strategy_signals(strategy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_instrument_created
  ON public.strategy_signals(instrument, created_at DESC);

-- Circuit breaker events index
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_book_created
  ON public.circuit_breaker_events(book_id, created_at DESC) WHERE book_id IS NOT NULL;

-- =============================================================================
-- FIX P0-3: Secure credential decryption via RPC function
-- Credentials should only be decrypted server-side, never exposed to clients
-- =============================================================================

-- Create secure RPC function for decrypting exchange keys (service role only)
CREATE OR REPLACE FUNCTION get_decrypted_exchange_keys(
  p_user_id UUID,
  p_exchange TEXT,
  p_encryption_key TEXT
)
RETURNS TABLE (
  id UUID,
  exchange TEXT,
  label TEXT,
  api_key TEXT,
  api_secret TEXT,
  passphrase TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can only be called by service_role (edge functions)
  -- The encryption_key is passed from the edge function environment

  RETURN QUERY
  SELECT
    uek.id,
    uek.exchange,
    uek.label,
    -- Decrypt using pgcrypto (requires extension)
    convert_from(
      decrypt(
        decode(uek.api_key_encrypted, 'base64'),
        p_encryption_key::bytea,
        'aes'
      ),
      'UTF8'
    ) as api_key,
    convert_from(
      decrypt(
        decode(uek.api_secret_encrypted, 'base64'),
        p_encryption_key::bytea,
        'aes'
      ),
      'UTF8'
    ) as api_secret,
    CASE
      WHEN uek.passphrase_encrypted IS NOT NULL THEN
        convert_from(
          decrypt(
            decode(uek.passphrase_encrypted, 'base64'),
            p_encryption_key::bytea,
            'aes'
          ),
          'UTF8'
        )
      ELSE NULL
    END as passphrase
  FROM user_exchange_keys uek
  WHERE uek.user_id = p_user_id
    AND uek.exchange = p_exchange
    AND uek.is_active = true;
END;
$$;

-- Revoke execute from public, only service_role can call this
REVOKE EXECUTE ON FUNCTION get_decrypted_exchange_keys FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_decrypted_exchange_keys TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_decrypted_exchange_keys IS
  'Securely decrypts exchange API keys. Only callable by service_role (edge functions).
   Never expose decrypted keys to client-side code.';

-- =============================================================================
-- ADDITIONAL: Remove any remaining trader write policies on orders
-- These were identified as still existing after initial migration
-- =============================================================================
DROP POLICY IF EXISTS "Traders can create orders" ON public.orders;
DROP POLICY IF EXISTS "Traders can update orders" ON public.orders;

-- =============================================================================
-- VERIFICATION QUERIES (run manually to verify fixes)
-- =============================================================================
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'orders';
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'positions';
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'market_news';
