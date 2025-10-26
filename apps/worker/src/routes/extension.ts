import { Router } from 'itty-router';
import { json } from '../lib/http';

const router = Router({ base: '/extension' });

router.get('/tasks', async (request) => {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '5'), 25);

  if (!platform) {
    return json({ tasks: [], error: 'platform required' }, { status: 400 });
  }

  console.log('[extension] fetch relist tasks', { platform, limit });
  return json({ tasks: [] });
});

router.post('/tasks/:id/start', async (request) => {
  const { id } = request.params as { id: string };
  console.log('[extension] start relist task', { id });
  return json({ ok: true });
});

router.post('/tasks/:id/complete', async (request) => {
  const { id } = request.params as { id: string };
  const body = await request.json().catch(() => ({}));
  console.log('[extension] complete relist task', { id, body });
  return json({ ok: true });
});

router.post('/tasks/:id/fail', async (request) => {
  const { id } = request.params as { id: string };
  const body = await request.json().catch(() => ({}));
  console.log('[extension] fail relist task', { id, body });
  return json({ ok: true });
});

router.get('/delist-tasks', async (request) => {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '5'), 25);
  if (!platform) {
    return json({ tasks: [], error: 'platform required' }, { status: 400 });
  }
  console.log('[extension] fetch delist tasks', { platform, limit });
  return json({ tasks: [] });
});

router.post('/delist-tasks/:id/start', async (request) => {
  const { id } = request.params as { id: string };
  console.log('[extension] start delist task', { id });
  return json({ ok: true });
});

router.post('/delist-tasks/:id/complete', async (request) => {
  const { id } = request.params as { id: string };
  const body = await request.json().catch(() => ({}));
  console.log('[extension] complete delist task', { id, body });
  return json({ ok: true });
});

router.post('/delist-tasks/:id/fail', async (request) => {
  const { id } = request.params as { id: string };
  const body = await request.json().catch(() => ({}));
  console.log('[extension] fail delist task', { id, body });
  return json({ ok: true });
});

export default { handle: router.handle };
