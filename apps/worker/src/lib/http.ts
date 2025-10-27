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
