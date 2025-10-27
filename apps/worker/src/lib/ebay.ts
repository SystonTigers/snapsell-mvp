import { HttpError } from './http';

const INVENTORY_ENDPOINT = 'https://api.ebay.com/sell/inventory/v1/bulk_update_price_quantity';

export interface EbayCredentials {
  accessToken: string;
  marketplaceId?: string;
}

export interface EbayQuantityUpdate {
  offerId?: string;
  sku?: string;
  quantity: number;
  price?: {
    currency: string;
    value: string;
  };
}

export interface BulkUpdateResult {
  responses: Array<{ offerId?: string; sku?: string; statusCode: number; errors?: unknown[] }>;
}

export async function bulkUpdatePriceQuantity(
  credentials: EbayCredentials,
  updates: EbayQuantityUpdate[],
  opts: { sandbox?: boolean } = {}
): Promise<BulkUpdateResult> {
  if (!updates.length) {
    throw new HttpError(400, 'No updates provided for eBay quantity sync');
  }

  const endpoint = opts.sandbox
    ? INVENTORY_ENDPOINT.replace('api.ebay.com', 'api.sandbox.ebay.com')
    : INVENTORY_ENDPOINT;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.accessToken}`,
      ...(credentials.marketplaceId ? { 'X-EBAY-C-MARKETPLACE-ID': credentials.marketplaceId } : {})
    },
    body: JSON.stringify({ requests: updates })
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new HttpError(res.status, 'eBay bulkUpdatePriceQuantity failed', json);
  }

  return json as BulkUpdateResult;
}
