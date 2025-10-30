import { Router } from 'itty-router';

import { HttpError } from '../lib/http';
import type { Env } from '../index';
import { exchangeCodeForTokens } from '../lib/ebay';
import { getDbServiceRole } from '../lib/db-client';
import { EBAY_AUTH_BASE } from '../lib/ebay';

const router = Router({ base: '/auth' });

router.get('/ebay/login', async (request, env: Env) => {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_REDIRECT_URI) {
    throw new HttpError(500, 'eBay OAuth not configured');
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  if (!state) {
    throw new HttpError(400, 'state required');
  }

  const params = new URLSearchParams({
    client_id: env.EBAY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: env.EBAY_REDIRECT_URI,
    scope:
      'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account',
    state
  });

  const authUrl = `${EBAY_AUTH_BASE(env)}?${params.toString()}`;
  return Response.redirect(authUrl, 302);
});

router.get('/ebay/callback', async (request, env: Env) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) {
    throw new HttpError(400, 'Missing code');
  }
  if (!state) {
    throw new HttpError(400, 'Missing state');
  }

  const tokens = await exchangeCodeForTokens({ env }, code);
  const expiresIn = Number((tokens as { expires_in?: unknown })?.expires_in ?? 0);
  const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
    ? new Date(Date.now() + (expiresIn - 60) * 1000).toISOString()
    : null;

  const supa = getDbServiceRole(env);
  const updateResult = await supa
    .from('channels')
    .update({
      access_token: (tokens as { access_token?: string }).access_token ?? null,
      refresh_token: (tokens as { refresh_token?: string }).refresh_token ?? null,
      token_expires_at: expiresAt,
      status: 'connected'
    });

  const { error } = await updateResult.eq('id', state);

  if (error) {
    throw new HttpError(500, error.message);
  }

  const redirectUrl = `${env.WEB_URL ?? 'http://localhost:3000'}/settings/channels?connected=ebay`;
  return Response.redirect(redirectUrl, 302);
});

export default { handle: router.handle };
