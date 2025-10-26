import { Router } from 'itty-router';
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
