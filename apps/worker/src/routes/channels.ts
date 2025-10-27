import { Router } from 'itty-router';

import { ensureJson, HttpError, json } from '../lib/http';
import type { Env } from '../index';
import { bulkUpdatePriceQuantity, resolveEbayAccessToken } from '../lib/ebay';
import { supabaseFetch } from '../lib/db';

const router = Router({ base: '/channels' });

router.post('/ebay/sync-qty', async (request, env: Env) => {
  const body = await ensureJson<{ accountId?: string; offerIds?: string[]; skus?: string[]; quantity?: number; price?: { currency?: string; value?: number } }>(
    request
  );

  const { accountId, offerIds, skus, quantity, price } = body;
  if (!accountId) {
    throw new HttpError(400, 'accountId required');
  }
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity < 0) {
    throw new HttpError(400, 'quantity must be a non-negative number');
  }
  if ((!offerIds || offerIds.length === 0) && (!skus || skus.length === 0)) {
    throw new HttpError(400, 'Provide offerIds or skus to update');
  }

  const accessToken = await resolveEbayAccessToken(env, accountId);
  const normalizedPrice = price && typeof price.value === 'number' && price.currency
    ? { currency: price.currency, value: price.value }
    : undefined;

  const result = await bulkUpdatePriceQuantity({
    accessToken,
    quantity,
    offerIds,
    skus,
    price: normalizedPrice
  });

  return json({ ok: true, result });
});

router.post('/map', async (request) => {
  const body = await ensureJson<{ platform?: string; variantId?: string; platformListingId?: string; status?: string; payload?: unknown }>(
    request
  );
  const { platform, variantId, platformListingId, status, payload } = body;

  if (!platform || !variantId) {
    throw new HttpError(400, 'platform and variantId required');
  }

  console.log('[channels] map listing', {
    platform,
    variantId,
    platformListingId,
    status,
    hasPayload: payload != null
  });
  return json({ ok: true });
});

router.post('/delist-all', async (request) => {
  const body = await ensureJson<{ variantId?: string }>(request);
  if (!body.variantId) {
    throw new HttpError(400, 'variantId required');
  }

  console.log('[channels] requested delist-all', { variantId: body.variantId });
  return json({ ok: true });
});

router.get('/tenant/:tenantId', async (request, env: Env) => {
  const { tenantId } = request.params as { tenantId: string };
  if (!tenantId) {
    throw new HttpError(400, 'tenantId required');
  }

  const channels = await supabaseFetch(env, {
    path: 'channels',
    query: { tenant_id: `eq.${tenantId}` }
  });
  return json({ channels });
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
