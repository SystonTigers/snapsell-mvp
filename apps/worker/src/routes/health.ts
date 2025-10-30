import { json } from '../lib/http';
import type { EnvChecked } from '../lib/env';

export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ ok: true, app: 'SnapSell API', ts: Date.now() }),
    {
      headers: { 'content-type': 'application/json' },
      status: 200
    }
  );
};

/**
 * Enhanced health check with database connectivity verification
 */
export const healthHandler = async (env?: EnvChecked) => {
  const health: {
    ok: boolean;
    app: string;
    ts: number;
    database?: 'connected' | 'disconnected';
    error?: string;
  } = {
    ok: true,
    app: 'SnapSell API',
    ts: Date.now()
  };

  // If env is provided, check database connectivity
  if (env) {
    try {
      const url = new URL('/rest/v1/tenants', env.SUPABASE_URL);
      url.searchParams.set('limit', '1');
      url.searchParams.set('select', 'id');

      const res = await fetch(url.toString(), {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
          'content-type': 'application/json'
        },
        // Short timeout for health checks
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        health.database = 'connected';
      } else {
        health.database = 'disconnected';
        health.ok = false;
        health.error = `Database returned ${res.status}`;
      }
    } catch (error) {
      health.database = 'disconnected';
      health.ok = false;
      health.error = error instanceof Error ? error.message : 'Database check failed';
    }
  }

  return json(health, { status: health.ok ? 200 : 503 });
};

export default { handle: healthHandler };
