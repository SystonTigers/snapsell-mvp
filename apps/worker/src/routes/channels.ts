import { Router } from 'itty-router';

import { ensureJson, HttpError, json, withRoute } from '../lib/http';
import { bulkUpdatePriceQuantity } from '../lib/ebay';

const router = Router({ base: '/channels' });

router.post(
  '/ebay/sync-qty',
  withRoute(async (request) => {
    const body = (await ensureJson(request)) as {
      accessToken?: string;
      marketplaceId?: string;
      updates?: Array<{ offerId?: string; sku?: string; quantity?: number; price?: number; currency?: string }>;
    };

    if (!body.accessToken) {
      throw new HttpError(400, 'accessToken required for eBay sync');
    }

    const updates = (body.updates ?? []).map((update) => ({
      offerId: update.offerId,
      sku: update.sku,
      quantity: Number(update.quantity ?? 0),
      price:
        update.price != null && update.currency
          ? { value: update.price.toFixed(2), currency: update.currency }
          : undefined
    }));

    const filtered = updates.filter((update) => update.quantity >= 0 && (update.offerId || update.sku));
    if (!filtered.length) {
      throw new HttpError(400, 'No valid updates supplied');
    }

    const response = await bulkUpdatePriceQuantity(
      { accessToken: body.accessToken, marketplaceId: body.marketplaceId },
      filtered
    );

    return json({ ok: true, result: response });
  })
);

router.post(
  '/delist-all',
  withRoute(async (request) => {
    const body = (await ensureJson(request)) as { variantId?: string };
    if (!body.variantId) {
      throw new HttpError(400, 'variantId required');
    }
    // TODO: end eBay offer + enqueue delist_tasks for FB/Vinted/Gumtree
    console.log('[channels] delist all', body.variantId);
    return json({ ok: true, queued: true });
  })
);

router.post(
  '/map',
  withRoute(async (request) => {
    const body = await ensureJson(request);
    console.log('[channels] map listing', body);
    // TODO: persist mapping in channel_listings table
    return json({ ok: true });
  })
);

export default router;
