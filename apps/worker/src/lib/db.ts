import { HttpError } from './http';
import type { EnvChecked } from './env';

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

export async function supabaseRpc<T = unknown>(
  env: EnvChecked,
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  return supabaseFetch<T>(env, {
    path: `rpc/${functionName}`,
    method: 'POST',
    body: params
  });
}

type SupabaseResponse<T> = { data: T | null; error: { message: string } | null };

export function getDb(env: EnvChecked) {
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
            } as SupabaseResponse<T>;
          }
          return { data: (payload as T) ?? null, error: null } as SupabaseResponse<T>;
        },
        async update<T>(values: Record<string, unknown>) {
          return {
            async eq(column: string, value: string): Promise<SupabaseResponse<T>> {
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
