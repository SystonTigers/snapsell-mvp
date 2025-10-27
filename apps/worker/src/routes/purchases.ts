import { Router } from 'itty-router';

import { ensureJson, HttpError, json, withRoute } from '../lib/http';

const router = Router({ base: '/purchases' });

router.get(
  '/',
  withRoute(async () => {
    // TODO: list purchases with recovery snapshot
    return json({ data: [] });
  })
);

router.get(
  '/:id',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    console.log('[purchases] fetch detail', id);
    // TODO: fetch purchase, lines, allocations, lots
    return json({ id, lines: [], allocations: [], lots: [] });
  })
);

router.post(
  '/',
  withRoute(async (request) => {
    const body = await ensureJson(request);
    console.log('[purchases] create', body);
    // TODO: insert purchase header
    return json({ ok: true, id: 'purchase-placeholder' }, { status: 201 });
  })
);

router.post(
  '/:id/lines',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[purchases] add lines', id, body);
    // TODO: insert purchase lines
    return json({ ok: true });
  })
);

router.post(
  '/:id/allocate',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = (await ensureJson(request)) as { method?: string };
    if (!body.method) {
      throw new HttpError(400, 'Allocation method required');
    }
    console.log('[purchases] allocate', id, body);
    // TODO: compute allocation preview and persist snapshot
    return json({ ok: true, allocation: { method: body.method, lines: [] } });
  })
);

router.post(
  '/:id/receive',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[purchases] receive', id, body);
    // TODO: create inventory lots + stock movements, mark purchase received
    return json({ ok: true });
  })
);

export default router;
