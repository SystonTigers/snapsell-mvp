import { Router } from 'itty-router';

import { ensureJson, json } from '../lib/http';
import { suggestPrice, type PricingSignals } from '../lib/pricing';

const router = Router({ base: '/items' });

router.post('/ingest', async (request) => {
  const payload = await ensureJson<Record<string, unknown>>(request);
  // TODO: persist incoming media to Supabase Storage and enqueue processing
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

export default { handle: router.handle };
