import type { EnvChecked } from './env';

const EBAY_API_BASE = 'https://apix.ebay.com';

type PricePayload = { currency: string; value: number };

type BulkUpdateOptions = {
  accessToken: string;
  quantity: number;
  offerIds?: string[];
  skus?: string[];
  price?: PricePayload;
  baseUrl?: string;
};

export const resolveEbayAccessToken = async (env: EnvChecked, accountId: string): Promise<string> => {
  const url = new URL('/rest/v1/accounts', env.SUPABASE_URL);
  url.searchParams.set('id', `eq.${accountId}`);
  url.searchParams.set('select', 'oauth_json');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    cf: { cacheEverything: false },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unable to resolve eBay account (${res.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as Array<{ oauth_json?: { access_token?: string } }>;
  const accessToken = payload?.[0]?.oauth_json?.access_token;
  if (!accessToken) {
    throw new Error('Missing eBay access token for account');
  }
  return accessToken;
};

export const bulkUpdatePriceQuantity = async ({
  accessToken,
  quantity,
  offerIds,
  skus,
  price,
  baseUrl = EBAY_API_BASE,
}: BulkUpdateOptions) => {
  const requests = [] as Array<{
    offerId?: string;
    sku?: string;
    shipToLocationAvailability: { quantity: number };
    pricing?: { price: PricePayload };
  }>;

  const normalizedQuantity = Math.max(0, Math.floor(quantity));

  for (const offerId of offerIds ?? []) {
    requests.push({
      offerId,
      shipToLocationAvailability: { quantity: normalizedQuantity },
      ...(price ? { pricing: { price } } : {}),
    });
  }
  for (const sku of skus ?? []) {
    requests.push({
      sku,
      shipToLocationAvailability: { quantity: normalizedQuantity },
      ...(price ? { pricing: { price } } : {}),
    });
  }

  if (requests.length === 0) {
    throw new Error('No offerIds or skus provided for bulk update');
  }

  const endpoint = `${baseUrl}/sell/inventory/v1/bulk_update_price_quantity`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Invalid JSON from eBay bulk update: ${(error as Error).message}`);
  }

  if (!response.ok) {
    throw new Error(`eBay bulk update failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return data;
};
