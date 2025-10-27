import { Router } from 'itty-router';

import { ensureJson, HttpError, json } from '../lib/http';
import { suggestPrice, type PricingSignals } from '../lib/pricing';
import type { Env } from '../index';
import { supabaseFetch } from '../lib/db';

const router = Router({ base: '/items' });

router.post('/ingest', async (request) => {
  const payload = await ensureJson<Record<string, unknown>>(request);
  console.log(JSON.stringify({ level: 'info', message: 'Item ingest accepted', keys: Object.keys(payload) }));
  return json({ ok: true, received: payload }, { status: 202 });
});

router.post('/price', async (request) => {
  const data = await ensureJson<Partial<PricingSignals> & {
    comps?: Array<{ price?: unknown; condition?: string }>;
  }>(request);

  const comps = Array.isArray(data.comps)
    ? data.comps
        .map((comp) => ({
          price: Number(comp.price),
          condition: typeof comp.condition === 'string' ? comp.condition : undefined
        }))
        .filter((comp) => Number.isFinite(comp.price))
    : [];

  const result = suggestPrice({
    comps,
    targetCondition: data.targetCondition,
    cogs: typeof data.cogs === 'number' ? data.cogs : undefined,
    targetMarginPct: typeof data.targetMarginPct === 'number' ? data.targetMarginPct : undefined,
    rrp: typeof data.rrp === 'number' ? data.rrp : undefined,
    expected: typeof data.expected === 'number' ? data.expected : undefined,
    floorPctOverCogs: typeof data.floorPctOverCogs === 'number' ? data.floorPctOverCogs : undefined,
    ceilPctOfRrp: typeof data.ceilPctOfRrp === 'number' ? data.ceilPctOfRrp : undefined
  });

  return json({ ok: true, price: result });
});

router.get('/tenant/:tenantId/demo', async (request, env: Env) => {
  const { tenantId } = request.params as { tenantId: string };
  if (!tenantId) {
    throw new HttpError(400, 'tenantId required');
  }

  const items = (await supabaseFetch(env, {
    path: 'items',
    query: { tenant_id: `eq.${tenantId}`, id: 'eq.demo-item-1' }
  })) as Array<Record<string, unknown>>;

  return json({ items });
});

export default { handle: router.handle };
