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
import { json } from '../lib/http';
import type { Env } from '../index';
import { bulkUpdatePriceQuantity, resolveEbayAccessToken } from '../lib/ebay';

const router = Router({ base: '/channels' });

router.post('/ebay/sync-qty', async (request, env: Env) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { accountId, offerIds, skus, quantity, price } = body as {
    accountId?: string;
    offerIds?: string[];
    skus?: string[];
    quantity?: number;
    price?: { currency: string; value: number };
  };

  if (!accountId) {
    return json({ ok: false, error: 'accountId required' }, { status: 400 });
  }
  if (typeof quantity !== 'number' || quantity < 0) {
    return json({ ok: false, error: 'quantity must be a non-negative number' }, { status: 400 });
  }
  if ((!offerIds || offerIds.length === 0) && (!skus || skus.length === 0)) {
    return json({ ok: false, error: 'Provide offerIds or skus to update' }, { status: 400 });
  }

  const accessToken = await resolveEbayAccessToken(env, accountId);
  const result = await bulkUpdatePriceQuantity({
    accessToken,
    quantity,
    offerIds,
    skus,
    price,
  });

  return json({ ok: true, result });
});

router.post('/map', async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const { platform, variantId, platformListingId, status, payload } = body as {
    platform?: string;
    variantId?: string;
    platformListingId?: string;
    status?: string;
    payload?: unknown;
  };

  if (!platform || !variantId) {
    return json({ ok: false, error: 'platform and variantId required' }, { status: 400 });
  }

  console.log('[channels] map listing', { platform, variantId, platformListingId, status, hasPayload: !!payload });
  return json({ ok: true });
});

router.post('/delist-all', async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const { variantId } = body as { variantId?: string };
  if (!variantId) {
    return json({ ok: false, error: 'variantId required' }, { status: 400 });
  }

  console.log('[channels] requested delist-all', { variantId });
  return json({ ok: true });
});

router.get('/variant/:variantId', async (request) => {
  const { variantId } = request.params as { variantId: string };
  if (!variantId) {
    return json({ listings: [] });
  }

  console.log('[channels] fetch variant listings', { variantId });
  return json({ listings: [] });
});

export default { handle: router.handle };
