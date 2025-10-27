import { z } from 'zod';

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json'
};

const ErrorSchema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE missing');
  }
  const url = new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`).toString();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init?.headers ?? {})
    }
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson && text ? JSON.parse(text) : text;

  if (!res.ok) {
    const parsed = isJson ? ErrorSchema.safeParse(payload) : undefined;
    const message = parsed?.success
      ? parsed.data.error ?? parsed.data.message ?? 'Request failed'
      : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}
