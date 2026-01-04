-- =============================================================================
-- Exchange Key Encryption Migration
-- Date: 2026-01-04
-- Addresses: P0-3 - Replace base64 encoding with real encryption
-- =============================================================================

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Create encryption/decryption functions
-- These use AES-256 symmetric encryption with a server-side key
-- The key should be stored in Supabase Vault or environment variables
-- =============================================================================

-- Encrypt function - encrypts plaintext using AES-256
-- Key should be fetched from vault in production
CREATE OR REPLACE FUNCTION encrypt_api_key(plaintext TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_bytes BYTEA;
BEGIN
  -- Use pgp_sym_encrypt for AES encryption
  encrypted_bytes := pgp_sym_encrypt(plaintext, encryption_key, 'cipher-algo=aes256');
  -- Return as base64 for storage
  RETURN encode(encrypted_bytes, 'base64');
END;
$$;

-- Decrypt function - decrypts ciphertext using AES-256
CREATE OR REPLACE FUNCTION decrypt_api_key(ciphertext TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_text TEXT;
BEGIN
  -- Decode from base64 and decrypt
  decrypted_text := pgp_sym_decrypt(decode(ciphertext, 'base64'), encryption_key);
  RETURN decrypted_text;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails (wrong key, corrupted data)
    RETURN NULL;
END;
$$;

-- =============================================================================
-- Add encryption version column to track encryption scheme
-- This allows for key rotation and migration between encryption schemes
-- =============================================================================
ALTER TABLE public.user_exchange_keys 
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;

-- Version meanings:
-- 0 = plaintext/base64 only (INSECURE - legacy)
-- 1 = pgcrypto AES-256 encryption

-- =============================================================================
-- Add comments documenting the security requirements
-- =============================================================================
COMMENT ON TABLE public.user_exchange_keys IS 
'Stores encrypted exchange API credentials. 
SECURITY: Keys must be encrypted at the application layer using pgcrypto.
The encryption key should be stored in Supabase Vault, not in code.
Never store plaintext or base64-only encoded keys.';

COMMENT ON COLUMN public.user_exchange_keys.api_key_encrypted IS 
'AES-256 encrypted API key (pgcrypto pgp_sym_encrypt). Decrypt only server-side.';

COMMENT ON COLUMN public.user_exchange_keys.api_secret_encrypted IS 
'AES-256 encrypted API secret (pgcrypto pgp_sym_encrypt). Decrypt only server-side.';

COMMENT ON COLUMN public.user_exchange_keys.encryption_version IS 
'Encryption scheme version: 0=legacy/insecure, 1=pgcrypto AES-256';

-- =============================================================================
-- Create secure RPC function for edge functions to decrypt keys
-- This ensures decryption only happens server-side with proper authorization
-- =============================================================================
CREATE OR REPLACE FUNCTION get_decrypted_exchange_keys(
  p_user_id UUID,
  p_exchange TEXT,
  p_encryption_key TEXT
)
RETURNS TABLE (
  api_key TEXT,
  api_secret TEXT,
  passphrase TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return keys for the requesting user
  -- Edge functions should pass the authenticated user's ID
  RETURN QUERY
  SELECT 
    decrypt_api_key(uek.api_key_encrypted, p_encryption_key) as api_key,
    decrypt_api_key(uek.api_secret_encrypted, p_encryption_key) as api_secret,
    CASE 
      WHEN uek.passphrase_encrypted IS NOT NULL 
      THEN decrypt_api_key(uek.passphrase_encrypted, p_encryption_key)
      ELSE NULL
    END as passphrase
  FROM public.user_exchange_keys uek
  WHERE uek.user_id = p_user_id 
    AND uek.exchange = p_exchange
    AND uek.is_active = true;
END;
$$;

-- Restrict function to service role only
REVOKE ALL ON FUNCTION get_decrypted_exchange_keys(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_decrypted_exchange_keys(UUID, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_exchange_keys(UUID, TEXT, TEXT) TO service_role;

-- Also restrict encryption/decryption functions
REVOKE ALL ON FUNCTION encrypt_api_key(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_api_key(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encrypt_api_key(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_api_key(TEXT, TEXT) TO service_role;

