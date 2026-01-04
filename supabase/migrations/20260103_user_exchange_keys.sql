-- Migration: User Exchange API Keys
-- Date: 2026-01-03
-- Description: Secure storage for user exchange API credentials

-- Create user_exchange_keys table
CREATE TABLE IF NOT EXISTS public.user_exchange_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Exchange identification
  exchange TEXT NOT NULL CHECK (exchange IN ('coinbase', 'kraken', 'binance', 'bybit', 'okx', 'mexc', 'hyperliquid')),
  label TEXT NOT NULL,
  
  -- Encrypted credentials (base64 encoded, encrypted at application layer)
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  passphrase_encrypted TEXT, -- Optional, required for some exchanges like Coinbase
  
  -- Permissions granted to this API key
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
  
  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique exchange per user (one key per exchange per user)
  UNIQUE(user_id, exchange, label)
);

-- Enable RLS
ALTER TABLE public.user_exchange_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own keys
CREATE POLICY "Users can view their own exchange keys"
  ON public.user_exchange_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exchange keys"
  ON public.user_exchange_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exchange keys"
  ON public.user_exchange_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exchange keys"
  ON public.user_exchange_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_exchange_keys_user_id ON public.user_exchange_keys(user_id);
CREATE INDEX idx_user_exchange_keys_exchange ON public.user_exchange_keys(exchange);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_exchange_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_exchange_keys_updated_at
  BEFORE UPDATE ON public.user_exchange_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_user_exchange_keys_updated_at();

-- Audit log for exchange key operations (security)
CREATE TABLE IF NOT EXISTS public.exchange_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'validated', 'validation_failed', 'used')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.exchange_key_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.exchange_key_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert audit logs (via edge functions)
CREATE POLICY "Service role can insert audit logs"
  ON public.exchange_key_audit_log
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_exchange_key_audit_user_id ON public.exchange_key_audit_log(user_id);
CREATE INDEX idx_exchange_key_audit_created_at ON public.exchange_key_audit_log(created_at DESC);

-- Grant permissions
GRANT ALL ON public.user_exchange_keys TO authenticated;
GRANT ALL ON public.exchange_key_audit_log TO authenticated;

