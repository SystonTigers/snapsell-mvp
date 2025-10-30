import type { Env } from '../index';
import type { EnvChecked } from './env';

type Ctx = { env: Env };

const EBAY_API_BASE = 'https://apix.ebay.com';
export const EBAY_REST_BASE = (env: Env) =>
  env.EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
export const EBAY_AUTH_BASE = (env: Env) =>
  env.EBAY_ENV === 'production'
    ? 'https://auth.ebay.com/oauth2/authorize'
    : 'https://auth.sandbox.ebay.com/oauth2/authorize';

const basicAuthHeader = (env: Env) => {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) {
    throw new Error('Missing eBay client credentials');
  }
  return btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
};

export async function exchangeCodeForTokens(ctx: Ctx, code: string) {
  if (!ctx.env.EBAY_REDIRECT_URI) {
    throw new Error('Missing eBay redirect URI');
  }
  const resp = await fetch(`${EBAY_REST_BASE(ctx.env)}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuthHeader(ctx.env)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: ctx.env.EBAY_REDIRECT_URI
    })
  });
  if (!resp.ok) {
    throw new Error(`eBay token exchange failed: ${resp.status}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

export async function refreshTokens(ctx: Ctx, refreshToken: string) {
  const resp = await fetch(`${EBAY_REST_BASE(ctx.env)}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuthHeader(ctx.env)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope:
        'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account'
    })
  });
  if (!resp.ok) {
    throw new Error(`eBay refresh failed: ${resp.status}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

type PricePayload = { currency: string; value: number };

type BulkUpdateOptions = {
  accessToken: string;
  quantity: number;
  offerIds?: string[];
  skus?: string[];
  price?: PricePayload;
  baseUrl?: string;
};

/**
 * Get eBay access token for a channel, refreshing if expired
 * This ensures tokens are always valid before making API calls
 */
export const getValidEbayToken = async (env: EnvChecked, channelId: string): Promise<string> => {
  // Get channel data including tokens and expiry
  const url = new URL('/rest/v1/channels', env.SUPABASE_URL);
  url.searchParams.set('id', `eq.${channelId}`);
  url.searchParams.set('select', 'access_token,refresh_token,token_expires_at');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      'content-type': 'application/json',
      accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch channel: ${res.status}`);
  }

  const channels = (await res.json()) as Array<{
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
  }>;

  const channel = channels[0];
  if (!channel) {
    throw new Error('Channel not found');
  }

  if (!channel.access_token) {
    throw new Error('Channel not connected - no access token');
  }

  // Check if token is expired or will expire in next 5 minutes
  const now = new Date();
  const expiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null;
  const expiresInMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
  const needsRefresh = !expiresAt || expiresInMs < 5 * 60 * 1000; // 5 minutes buffer

  if (needsRefresh && channel.refresh_token) {
    console.log(`Refreshing eBay token for channel ${channelId}`);

    try {
      const tokens = await refreshTokens({ env }, channel.refresh_token);
      const newAccessToken = (tokens as { access_token?: string }).access_token;
      const newRefreshToken = (tokens as { refresh_token?: string }).refresh_token;
      const expiresIn = Number((tokens as { expires_in?: unknown })?.expires_in ?? 0);

      const newExpiresAt = Number.isFinite(expiresIn) && expiresIn > 0
        ? new Date(Date.now() + (expiresIn - 60) * 1000).toISOString()
        : null;

      // Update channel with new tokens
      const updateUrl = new URL('/rest/v1/channels', env.SUPABASE_URL);
      updateUrl.searchParams.set('id', `eq.${channelId}`);

      await fetch(updateUrl.toString(), {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
          'content-type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_expires_at: newExpiresAt
        })
      });

      return newAccessToken || channel.access_token;
    } catch (error) {
      console.error(`Failed to refresh token for channel ${channelId}:`, error);
      // Fall back to existing token
      return channel.access_token;
    }
  }

  return channel.access_token;
};

// Legacy function - kept for backward compatibility
export const resolveEbayAccessToken = async (env: EnvChecked, accountId: string): Promise<string> => {
  const url = new URL('/rest/v1/accounts', env.SUPABASE_URL);
  url.searchParams.set('id', `eq.${accountId}`);
  url.searchParams.set('select', 'oauth_json');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    cf: { cacheEverything: false }
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
  baseUrl = EBAY_API_BASE
}: BulkUpdateOptions) => {
  const requests: Array<{
    offerId?: string;
    sku?: string;
    shipToLocationAvailability: { quantity: number };
    pricing?: { price: PricePayload };
  }> = [];

  const normalizedQuantity = Math.max(0, Math.floor(quantity));

  for (const offerId of offerIds ?? []) {
    requests.push({
      offerId,
      shipToLocationAvailability: { quantity: normalizedQuantity },
      ...(price ? { pricing: { price } } : {})
    });
  }
  for (const sku of skus ?? []) {
    requests.push({
      sku,
      shipToLocationAvailability: { quantity: normalizedQuantity },
      ...(price ? { pricing: { price } } : {})
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
      Accept: 'application/json'
    },
    body: JSON.stringify({ requests })
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
