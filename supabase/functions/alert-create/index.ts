/**
 * Alert Create Edge Function
 *
 * Creates alerts securely with server-side validation.
 * Enforces proper authentication and rate limiting.
 *
 * Security:
 * - Uses service_role to bypass RLS (alerts is service_role only for inserts)
 * - Validates authentication
 * - Rate limited to prevent abuse
 * - Input validation and sanitization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertCreateRequest {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  source: string;
  metadata?: Record<string, unknown>;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 20 alerts per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(userId);
  
  if (!bucket || now >= bucket.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (bucket.count >= RATE_LIMIT) {
    return false;
  }
  
  bucket.count++;
  return true;
}

// Sanitize string input
function sanitizeString(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for alert writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token and validate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Parse and validate request body
    const body: AlertCreateRequest = await req.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Title is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!body.source || typeof body.source !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Source is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate and sanitize severity
    const validSeverities = ['info', 'warning', 'critical'];
    const severity = body.severity && validSeverities.includes(body.severity) ? body.severity : 'info';

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(body.title, 200);
    const sanitizedMessage = sanitizeString(body.message, 1000);
    const sanitizedSource = sanitizeString(body.source, 100);

    // Prepare metadata with user context
    const metadata = {
      ...(body.metadata || {}),
      created_by_user_id: user.id,
      created_by_email: user.email,
    };

    // Insert alert using service role (bypasses RLS)
    const { data: alert, error: insertError } = await supabase
      .from('alerts')
      .insert({
        title: sanitizedTitle,
        message: sanitizedMessage,
        severity: severity,
        source: sanitizedSource,
        metadata: metadata,
        is_read: false,
        is_resolved: false,
      })
      .select('id, title, severity, source, created_at')
      .single();

    if (insertError) {
      console.error('Alert insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create alert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, alert: alert }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );

  } catch (error) {
    console.error('Alert create error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
