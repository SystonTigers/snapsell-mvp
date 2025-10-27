import { Router } from 'itty-router';

import { ensureJson, HttpError, json } from '../lib/http';

const router = Router({ base: '/purchases' });

router.get('/', async () => {
  // TODO: list purchases with recovery snapshot
  return json({ data: [] });
});

router.get('/:id', async (request) => {
  const { id } = request.params as { id: string };
  console.log('[purchases] fetch detail', id);
  // TODO: fetch purchase, lines, allocations, lots
  return json({ id, lines: [], allocations: [], lots: [] });
});

router.post('/', async (request) => {
  const body = await ensureJson(request);
  console.log('[purchases] create', body);
  // TODO: insert purchase header
  return json({ ok: true, id: 'purchase-placeholder' }, { status: 201 });
});

router.post('/:id/lines', async (request) => {
  const { id } = request.params as { id: string };
  const body = await ensureJson(request);
  console.log('[purchases] add lines', id, body);
  // TODO: insert purchase lines
  return json({ ok: true });
});

router.post('/:id/allocate', async (request) => {
  const { id } = request.params as { id: string };
  const body = await ensureJson<{ method?: string }>(request);
  if (!body.method) {
    throw new HttpError(400, 'Allocation method required');
  }
  console.log('[purchases] allocate', id, body);
  // TODO: compute allocation preview and persist snapshot
  return json({ ok: true, allocation: { method: body.method, lines: [] } });
});

router.post('/:id/receive', async (request) => {
  const { id } = request.params as { id: string };
  const body = await ensureJson(request);
  console.log('[purchases] receive', id, body);
  // TODO: create inventory lots + stock movements, mark purchase received
  return json({ ok: true });
});

export default { handle: router.handle };
