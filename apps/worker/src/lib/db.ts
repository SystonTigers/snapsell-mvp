import { HttpError } from './http';
import type { ValidatedEnv } from './env';

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

export async function supabaseFetch<T = unknown>(
  env: ValidatedEnv,
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
  const payload = contentType.includes('application/json') && text ? JSON.parse(text) : text;

  if (!res.ok) {
    throw new HttpError(res.status, 'Supabase request failed', payload);
  }

  return payload as T;
}

export async function supabaseRpc<T = unknown>(
  env: ValidatedEnv,
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  return supabaseFetch<T>(env, {
    path: `rpc/${functionName}`,
    method: 'POST',
    body: params
  });
}
