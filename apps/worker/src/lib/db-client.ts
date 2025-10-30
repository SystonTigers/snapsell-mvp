import { HttpError } from './http';
import type { EnvChecked } from './env';
import type { JWTPayload } from './auth';

/**
 * Supabase client that respects tenant isolation
 * Uses JWT claims to enforce RLS policies
 */

export interface SupabaseRequestInit {
  path: string;
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
}

function buildUrl(base: string, path: string, query?: SupabaseRequestInit['query']): string {
  const url = new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Fetch with service role (bypasses RLS - use with caution!)
 */
export async function supabaseFetchAsServiceRole<T = unknown>(
  env: EnvChecked,
  init: SupabaseRequestInit
): Promise<T> {
  const { path, method = 'GET', query, body, headers } = init;
  const url = buildUrl(`${env.SUPABASE_URL}/rest/v1/`, path, query);
  const res = await fetch(url, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') ?? '';
  let payload: unknown = text;
  if (contentType.includes('application/json') && text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = text;
    }
  }

  if (!res.ok) {
    throw new HttpError(res.status, 'Supabase request failed', payload);
  }

  return payload as T;
}

/**
 * Fetch with user JWT (respects RLS policies)
 * This is the preferred method for tenant-scoped operations
 */
export async function supabaseFetchAsUser<T = unknown>(
  env: EnvChecked,
  auth: JWTPayload,
  init: SupabaseRequestInit
): Promise<T> {
  const { path, method = 'GET', query, body, headers } = init;
  const url = buildUrl(`${env.SUPABASE_URL}/rest/v1/`, path, query);

  // Create JWT for Supabase that includes tenant_id in claims
  const token = await createSupabaseJWT(auth, env.JWT_SECRET);

  const res = await fetch(url, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE, // API key for routing
      Authorization: `Bearer ${token}`, // User JWT for RLS
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') ?? '';
  let payload: unknown = text;
  if (contentType.includes('application/json') && text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = text;
    }
  }

  if (!res.ok) {
    throw new HttpError(res.status, 'Supabase request failed', payload);
  }

  return payload as T;
}

/**
 * Create a Supabase-compatible JWT with tenant_id in claims
 */
async function createSupabaseJWT(auth: JWTPayload, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    tenant_id: auth.tenant_id,
    user_id: auth.user_id,
    iat: now,
    exp: now + 300, // 5 minutes (short-lived for RLS)
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Legacy DB client (kept for OAuth and public endpoints)
 * IMPORTANT: This uses service role and bypasses RLS
 * Only use for:
 * - Public endpoints (health check)
 * - OAuth callbacks (before user auth)
 * - Background jobs
 */
export function getDbServiceRole(env: EnvChecked) {
  const baseUrl = `${env.SUPABASE_URL}/rest/v1/`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
    'Content-Type': 'application/json'
  };

  return {
    from(table: string) {
      return {
        async insert<T>(values: Record<string, unknown> | Record<string, unknown>[]) {
          const res = await fetch(new URL(table, baseUrl).toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(values)
          });
          const text = await res.text();
          let payload: unknown = null;
          if (text) {
            try {
              payload = JSON.parse(text);
            } catch (error) {
              payload = text;
            }
          }
          if (!res.ok) {
            return {
              data: null,
              error: {
                message:
                  typeof (payload as { message?: string } | null)?.message === 'string'
                    ? (payload as { message: string }).message
                    : text || 'Unknown error'
              }
            };
          }
          return { data: (payload as T) ?? null, error: null };
        },
        async update<T>(values: Record<string, unknown>) {
          return {
            async eq(column: string, value: string) {
              const url = new URL(table, baseUrl);
              url.searchParams.set(column, `eq.${value}`);
              const res = await fetch(url.toString(), {
                method: 'PATCH',
                headers: { ...headers, Prefer: 'return=representation' },
                body: JSON.stringify(values)
              });
              const text = await res.text();
              let payload: unknown = null;
              if (text) {
                try {
                  payload = JSON.parse(text);
                } catch (error) {
                  payload = text;
                }
              }
              if (!res.ok) {
                return {
                  data: null,
                  error: {
                    message:
                      typeof (payload as { message?: string } | null)?.message === 'string'
                        ? (payload as { message: string }).message
                        : text || 'Unknown error'
                  }
                };
              }
              return { data: (payload as T) ?? null, error: null };
            }
          };
        }
      };
    }
  };
}
