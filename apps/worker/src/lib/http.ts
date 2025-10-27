import { createEnvConfig, type ValidatedEnv } from './env';

export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export type RouteHandler = (
  request: Request,
  env: ValidatedEnv,
  ctx: ExecutionContext
) => Promise<Response> | Response;

function isWildcardMatch(origin: string, rule: string): boolean {
  if (rule === '*') return true;
  if (rule.includes('*')) {
    const escaped = rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(origin);
  }
  return origin === rule;
}

function appendCorsHeaders(request: Request, response: Response, env: ValidatedEnv): Response {
  const origin = request.headers.get('Origin');
  const headers = new Headers(response.headers);
  headers.append('Vary', 'Origin');

  if (origin && env.allowedOrigins.some((rule) => isWildcardMatch(origin, rule))) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    request.headers.get('Access-Control-Request-Headers') ?? 'Content-Type, Authorization'
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function error(status: number, message: string, details?: unknown): Response {
  return json(
    {
      ok: false,
      error: message,
      details
    },
    { status }
  );
}

export function withRoute(handler: RouteHandler): RouteHandler {
  return async (request, rawEnv, ctx) => {
    const env = rawEnv.allowedOrigins ? rawEnv : createEnvConfig(rawEnv as unknown as Record<string, string | undefined>);

    if (request.method === 'OPTIONS') {
      const optionsResponse = new Response(null, { status: 204 });
      return appendCorsHeaders(request, optionsResponse, env);
    }

    try {
      const response = await handler(request, env, ctx);
      return appendCorsHeaders(request, response, env);
    } catch (err) {
      if (err instanceof HttpError) {
        return appendCorsHeaders(request, error(err.status, err.message, err.details), env);
      }
      console.error('Route error', err);
      return appendCorsHeaders(request, error(500, 'Internal Server Error'), env);
    }
  };
}

export function ensureJson(request: Request): Promise<unknown> {
  return request.json().catch(() => {
    throw new HttpError(400, 'Invalid JSON payload');
  });
}
import type { EnvChecked } from './env';

export const json = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const withErrors = <E extends EnvChecked>(
  handler: (request: Request, env: EnvChecked & E, ctx: ExecutionContext) => Promise<Response | void> | Response | void,
) => {
  return async (request: Request, env: EnvChecked & E, ctx: ExecutionContext): Promise<Response> => {
    try {
      const response = await handler(request, env, ctx);
      if (response instanceof Response) {
        return response;
      }
      return json({ ok: false, error: 'Not Found' }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[worker] request failed', message);
      return json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
  };
};

export type CorsContext = {
  origin: string | null;
  isCrossOrigin: boolean;
};

export const enforceCors = (request: Request, allowedOrigins: string[] | undefined): Response | CorsContext => {
  const origin = request.headers.get('origin');
  if (!origin) {
    return { origin: null, isCrossOrigin: false };
  }

  if (!allowedOrigins || allowedOrigins.length === 0 || !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  return { origin, isCrossOrigin: true };
};

export const applyCorsHeaders = (response: Response, cors: CorsContext): Response => {
  if (!cors.isCrossOrigin || !cors.origin) {
    return response;
  }
  response.headers.set('Access-Control-Allow-Origin', cors.origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');
  return response;
};

export const preflight = (cors: CorsContext): Response => {
  const response = new Response(null, { status: 204 });
  if (cors.isCrossOrigin && cors.origin) {
    response.headers.set('Access-Control-Allow-Origin', cors.origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-requested-with');
  response.headers.set('Vary', 'Origin');
  return response;
};

export const enforceBodyLimit = (request: Request, limitBytes: number, exemptions: readonly string[]): Response | null => {
  const pathname = new URL(request.url).pathname;
  if (exemptions.some((path) => pathname.startsWith(path))) {
    return null;
  }
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > limitBytes) {
    return json(
      { ok: false, error: `Request body too large (max ${limitBytes} bytes)` },
      { status: 413 },
    );
  }
  return null;
};

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
}

export const rateLimit = async (
  kv: KVNamespace | undefined,
  key: string,
  { windowSeconds, max }: { windowSeconds: number; max: number },
): Promise<RateLimitResult> => {
  if (!kv) {
    return { allowed: true };
  }
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const storageKey = `${key}:${bucket}`;
  const currentRaw = await kv.get(storageKey);
  const current = currentRaw ? Number(currentRaw) : 0;
  if (current >= max) {
    return { allowed: false, remaining: 0 };
  }
  await kv.put(storageKey, String(current + 1), { expirationTtl: windowSeconds });
  return { allowed: true, remaining: max - current - 1 };
};
