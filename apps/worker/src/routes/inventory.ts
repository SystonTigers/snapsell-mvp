import { Router } from 'itty-router';

import { ensureJson, json } from '../lib/http';

const router = Router({ base: '/inventory' });

router.post('/receive', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] receive', body);
  return json({ ok: true, message: 'Inventory receive acknowledged' });
});

router.post('/adjust', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] adjust', body);
  return json({ ok: true, message: 'Inventory adjustment acknowledged' });
});

router.post('/sale', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] sale', body);
  return json({ ok: true, saleId: 'sale-placeholder', lotsConsumed: [] });
});

router.post('/variants/:id/autolist', async (request) => {
  const { id } = request.params as { id: string };
  const body = await ensureJson<{ key?: string; value?: unknown }>(request);
  console.log('[inventory] update auto list flag', { id, body });
  return json({ ok: true });
});

router.get('/stock', async () => {
  return json({ stock: [] });
});

router.get('/profit', async () => {
  return json({ profit: [] });
});

export default { handle: router.handle };
