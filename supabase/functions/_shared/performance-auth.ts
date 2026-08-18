import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.111.0';

export const PERFORMANCE_EDGE_VERSION = '2026.08.18-performance-edge-v2';

export const corsHeaders = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

function namedKey(jsonEnvName: string, legacyEnvName: string): string {
  const json = Deno.env.get(jsonEnvName);
  if (json) {
    const parsed = JSON.parse(json);
    if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
  }
  const legacy = Deno.env.get(legacyEnvName);
  if (legacy) return legacy;
  throw new Error(`Missing ${jsonEnvName}/${legacyEnvName}`);
}

export function projectUrl(): string {
  const value = Deno.env.get('SUPABASE_URL');
  if (!value) throw new Error('Missing SUPABASE_URL');
  return value;
}

export function publishableKey(): string {
  return namedKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
}

export function secretKey(): string {
  return namedKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
}

export function adminClient(): SupabaseClient {
  return createClient(projectUrl(), secretKey(), {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function publicClient(): SupabaseClient {
  return createClient(projectUrl(), publishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function userClient(req: Request): SupabaseClient {
  const authorization = req.headers.get('Authorization') ?? '';
  return createClient(projectUrl(), publishableKey(), {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export type PerformanceActor = {
  authUserId: string;
  employeeId: string;
  role: 'canvasser' | 'manager' | 'admin';
};

export function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function authenticatePerformanceActor(req: Request): Promise<{
  actor: PerformanceActor;
  supabase: SupabaseClient;
  admin: SupabaseClient;
}> {
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) throw responseJson({ error: 'UNAUTHORIZED' }, 401);
  const token = authorization.slice(7).trim();
  if (!token) throw responseJson({ error: 'UNAUTHORIZED' }, 401);

  const supabase = userClient(req);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw responseJson({ error: 'UNAUTHORIZED' }, 401);

  const [{ data: employeeId, error: employeeError }, { data: role, error: roleError }] = await Promise.all([
    supabase.rpc('performance_current_employee_id'),
    supabase.rpc('performance_current_role'),
  ]);
  if (employeeError || roleError || !employeeId || !['canvasser', 'manager', 'admin'].includes(role)) {
    throw responseJson({ error: 'PERFORMANCE_DEVICE_REVOKED_OR_UNENROLLED' }, 403);
  }

  return {
    actor: { authUserId: userData.user.id, employeeId, role },
    supabase,
    admin: adminClient(),
  };
}

export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

export function requirePost(req: Request): Response | null {
  return req.method === 'POST' ? null : responseJson({ error: 'METHOD_NOT_ALLOWED' }, 405);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function randomSecret(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
