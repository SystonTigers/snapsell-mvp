import { Router } from 'itty-router';
import { json } from '../lib/http';

const router = Router({ base: '/items' });

router.post('/ingest', async () => {
  // TODO: accept uploads -> Supabase Storage -> media rows
  return json({ ok: true, media: [] });
});

router.post('/price', async () => {
  // TODO: eBay sold comps -> median ± IQR
  return json({ ok: true, price: { low: 10, mid: 15, high: 20 } });
});

export default { handle: router.handle };
