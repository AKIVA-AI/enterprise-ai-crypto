/**
 * Shared security utilities for Edge Functions
 * 
 * This module provides secure CORS headers and authentication helpers
 */

// Production domains - add your custom domains here
const ALLOWED_ORIGINS = [
  'https://amvakxshlojoshdfcqos.lovableproject.com',
  'https://amvakxshlojoshdfcqos.lovable.app',
  // Add custom production domains here
];

// Development origins (only in dev mode)
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Get secure CORS headers based on request origin
 */
export function getSecureCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  const allowedOrigins = isDev ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS] : ALLOWED_ORIGINS;
  
  // Check if origin is allowed
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0]; // Default to first allowed origin
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Permissive CORS for truly public endpoints (webhooks, public data)
 */
export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validate JWT and extract user
 */
export async function validateAuth(
  supabase: any,
  authHeader: string | null
): Promise<{ user: any; error?: string }> {
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }
  
  return { user };
}

/**
 * Check if user has required role
 */
export async function checkRole(
  supabase: any,
  userId: string,
  requiredRoles: string[]
): Promise<{ hasRole: boolean; userRole?: string }> {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', requiredRoles);
  
  if (!roleData || roleData.length === 0) {
    return { hasRole: false };
  }
  
  return { hasRole: true, userRole: roleData[0].role };
}
