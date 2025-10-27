import { Router } from 'itty-router';

import { ensureJson, json, withRoute } from '../lib/http';

const router = Router({ base: '/inventory' });

router.post(
  '/receive',
  withRoute(async (request) => {
    const body = await ensureJson(request);
    console.log('[inventory] receive', body);
    // TODO: create stock movements + inventory lots for received purchase lines
    return json({ ok: true, message: 'Receive stub' });
  })
);

router.post(
  '/adjust',
  withRoute(async (request) => {
    const body = await ensureJson(request);
    console.log('[inventory] adjust', body);
    // TODO: insert adjustment stock movement with reason + audit trail
    return json({ ok: true, message: 'Adjust stub' });
  })
);

router.post(
  '/sale',
  withRoute(async (request) => {
    const body = await ensureJson(request);
    console.log('[inventory] sale', body);
    // TODO: consume FIFO lots, update sales.cogs, recovery, channel sync, relist/delist
    return json({ ok: true, saleId: 'sale-placeholder', lotsConsumed: [] });
  })
);

router.get(
  '/stock',
  withRoute(async () => {
    // TODO: query vw_stock for dashboard
    return json({ stock: [] });
  })
);

router.get(
  '/profit',
  withRoute(async () => {
    // TODO: query vw_profit_per_sale with optional filters
    return json({ profit: [] });
  })
);

export default router;
