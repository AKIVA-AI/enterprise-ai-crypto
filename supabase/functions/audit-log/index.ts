/**
 * Audit Log Edge Function
 *
 * Creates audit events securely with server-side validation.
 * Captures IP address and validates authentication context.
 *
 * Security:
 * - Uses service_role to bypass RLS (audit_events is service_role only)
 * - Captures real client IP from x-forwarded-for
 * - Validates authentication
 * - Rate limited to prevent abuse
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogRequest {
  action: string;
  resource_type: string;
  resource_id?: string;
  severity?: 'info' | 'warning' | 'critical';
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  book_id?: string;
  metadata?: Record<string, unknown>;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for audit writes
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
    const body: AuditLogRequest = await req.json();

    if (!body.action || typeof body.action !== 'string' || body.action.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action field' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!body.resource_type || typeof body.resource_type !== 'string' || body.resource_type.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid resource_type field' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate severity if provided
    const validSeverities = ['info', 'warning', 'critical'];
    const severity = body.severity && validSeverities.includes(body.severity) ? body.severity : 'info';

    // Get client IP from forwarded headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    // Insert audit event using service role (bypasses RLS)
    const { data: auditEvent, error: insertError } = await supabase
      .from('audit_events')
      .insert({
        action: body.action,
        resource_type: body.resource_type,
        resource_id: body.resource_id || null,
        severity: severity,
        user_id: user.id,
        user_email: user.email,
        ip_address: clientIp,
        book_id: body.book_id || null,
        before_state: body.before_state || null,
        after_state: body.after_state || null,
      })
      .select('id, action, resource_type, severity, created_at')
      .single();

    if (insertError) {
      console.error('Audit log insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create audit event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, audit_event: auditEvent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );

  } catch (error) {
    console.error('Audit log error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
