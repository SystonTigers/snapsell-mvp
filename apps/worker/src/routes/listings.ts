import { Router } from 'itty-router';

import { ensureJson, json, withRoute } from '../lib/http';

const router = Router({ base: '/listings' });

router.post(
  '/ebay/draft',
  withRoute(async (request) => {
    const payload = await ensureJson(request);
    // TODO: construct eBay inventory item & offer draft
    console.log('[listings] create eBay draft', payload);
    return json({ ok: true, draftId: 'draft-placeholder' });
  })
);

router.post(
  '/ebay/publish',
  withRoute(async (request) => {
    const payload = await ensureJson(request);
    // TODO: publish listing via eBay Inventory/Offer API
    console.log('[listings] publish eBay listing', payload);
    return json({ ok: true, url: 'https://www.ebay.co.uk/itm/demo' });
  })
);

export default router;
