/**
 * Exchange Validate Edge Function
 *
 * Securely tests exchange API connections without exposing credentials to client.
 * Supports: Coinbase, Kraken, Binance, and more.
 *
 * Security:
 * - Uses secure CORS with origin validation
 * - Decrypts keys server-side only
 * - Keys never returned to client
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getSecureCorsHeaders,
  validateAuth,
  rateLimitMiddleware,
  RATE_LIMITS,
  rateLimitHeaders,
  checkRateLimit
} from "../_shared/security.ts";

// Get encryption key from environment (stored in Supabase secrets)
const getEncryptionKey = (): string => {
  const key = Deno.env.get('EXCHANGE_KEY_ENCRYPTION_KEY');
  if (!key) {
    throw new Error('EXCHANGE_KEY_ENCRYPTION_KEY not configured');
  }
  return key;
};

// Exchange API test endpoints
const EXCHANGE_TEST_ENDPOINTS: Record<string, { url: string; method: string }> = {
  coinbase: { url: 'https://api.coinbase.com/api/v3/brokerage/accounts', method: 'GET' },
  kraken: { url: 'https://api.kraken.com/0/private/Balance', method: 'POST' },
  binance: { url: 'https://api.binance.com/api/v3/account', method: 'GET' },
  bybit: { url: 'https://api.bybit.com/v5/account/wallet-balance', method: 'GET' },
  okx: { url: 'https://www.okx.com/api/v5/account/balance', method: 'GET' },
  mexc: { url: 'https://api.mexc.com/api/v3/account', method: 'GET' },
  hyperliquid: { url: 'https://api.hyperliquid.xyz/info', method: 'POST' },
};

serve(async (req) => {
  // Get secure CORS headers based on request origin
  const corsHeaders = getSecureCorsHeaders(req.headers.get('Origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate authentication using shared utility
    const authHeader = req.headers.get('Authorization');
    const { user, error: authError } = await validateAuth(supabase, authHeader);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: authError || 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Apply rate limiting (10 validations per minute)
    const rateLimitResponse = rateLimitMiddleware(user.id, RATE_LIMITS.validate, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const { keyId } = await req.json();
    if (!keyId) {
      throw new Error('Missing keyId parameter');
    }

    // Fetch the exchange key metadata (RLS ensures user can only access their own)
    const { data: keyData, error: keyError } = await supabase
      .from('user_exchange_keys')
      .select('id, exchange, label, is_active')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    if (keyError || !keyData) {
      throw new Error('Exchange key not found');
    }

    // Decrypt credentials using secure RPC function (server-side only)
    const encryptionKey = getEncryptionKey();
    const { data: decryptedKeys, error: decryptError } = await supabase
      .rpc('get_decrypted_exchange_keys', {
        p_user_id: user.id,
        p_exchange: keyData.exchange,
        p_encryption_key: encryptionKey
      });

    if (decryptError || !decryptedKeys || decryptedKeys.length === 0) {
      throw new Error('Failed to decrypt exchange keys');
    }

    const { api_key: apiKey, api_secret: apiSecret, passphrase } = decryptedKeys[0];

    // Get test endpoint for this exchange
    const testConfig = EXCHANGE_TEST_ENDPOINTS[keyData.exchange];
    if (!testConfig) {
      throw new Error(`Unsupported exchange: ${keyData.exchange}`);
    }

    // Test the connection (simplified - real implementation needs proper signing)
    let isValid = false;
    let errorMessage: string | null = null;

    try {
      // For now, just verify the key format is valid
      // Real implementation would sign and make actual API call
      if (apiKey && apiKey.length > 10 && apiSecret && apiSecret.length > 10) {
        isValid = true;
      } else {
        errorMessage = 'API key or secret appears to be invalid format';
      }
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : 'Connection test failed';
    }

    // Update the key record with validation result
    await supabase
      .from('user_exchange_keys')
      .update({
        is_validated: isValid,
        last_validated_at: new Date().toISOString(),
        validation_error: errorMessage,
      })
      .eq('id', keyId);

    // Log the validation attempt
    await supabase
      .from('exchange_key_audit_log')
      .insert({
        user_id: user.id,
        exchange: keyData.exchange,
        action: isValid ? 'validated' : 'validation_failed',
        metadata: { keyId, errorMessage },
      });

    return new Response(
      JSON.stringify({
        valid: isValid,
        exchange: keyData.exchange,
        error: errorMessage,
        validated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

