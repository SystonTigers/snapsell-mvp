import { Router } from 'itty-router';

import { json } from '../lib/http';

const router = Router({ base: '/auth' });

router.get('/ebay/login', async () => {
  // TODO: generate PKCE verifier/challenge + redirect to eBay OAuth
  return json({ ok: false, message: 'eBay OAuth not implemented yet' }, { status: 501 });
});

router.get('/ebay/callback', async () => {
  // TODO: exchange code for token and store in Supabase accounts table
  return json({ ok: false, message: 'eBay OAuth callback not implemented yet' }, { status: 501 });
});

export default { handle: router.handle };
