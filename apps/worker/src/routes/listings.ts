import { Router } from 'itty-router';

import { ensureJson, json } from '../lib/http';

const router = Router({ base: '/listings' });

router.post('/ebay/draft', async (request) => {
  const payload = await ensureJson(request);
  // TODO: construct eBay inventory item & offer draft
  console.log('[listings] create eBay draft', payload);
  return json({ ok: true, draftId: 'draft-placeholder' });
});

router.post('/ebay/publish', async (request) => {
  const payload = await ensureJson(request);
  // TODO: publish listing via eBay Inventory/Offer API
  console.log('[listings] publish eBay listing', payload);
  return json({ ok: true, url: 'https://www.ebay.co.uk/itm/demo' });
});

export default { handle: router.handle };
