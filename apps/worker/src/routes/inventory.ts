import { Router } from 'itty-router';

import { ensureJson, json } from '../lib/http';

const router = Router({ base: '/inventory' });

router.post('/receive', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] receive', body);
  // TODO: create stock movements + inventory lots for received purchase lines
  return json({ ok: true, message: 'Receive stub' });
});

router.post('/adjust', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] adjust', body);
  // TODO: insert adjustment stock movement with reason + audit trail
  return json({ ok: true, message: 'Adjust stub' });
});

router.post('/sale', async (request) => {
  const body = await ensureJson(request);
  console.log('[inventory] sale', body);
  // TODO: consume FIFO lots, update sales.cogs, recovery, channel sync, relist/delist
  return json({ ok: true, saleId: 'sale-placeholder', lotsConsumed: [] });
});

router.get('/stock', async () => {
  // TODO: query vw_stock for dashboard
  return json({ stock: [] });
});

router.get('/profit', async () => {
  // TODO: query vw_profit_per_sale with optional filters
  return json({ profit: [] });
});

export default { handle: router.handle };
