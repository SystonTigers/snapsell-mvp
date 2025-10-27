import { Router } from 'itty-router';

import { ensureJson, json, withRoute } from '../lib/http';

const router = Router({ base: '/extension' });

router.get(
  '/tasks',
  withRoute(async (request) => {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    console.log('[extension] tasks poll', platform);
    // TODO: fetch relist_tasks for platform ordered by created_at
    return json({ tasks: [] });
  })
);

router.post(
  '/tasks/:id/start',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    console.log('[extension] task start', id);
    // TODO: mark task as in_progress with timestamp
    return json({ ok: true });
  })
);

router.post(
  '/tasks/:id/complete',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[extension] task complete', id, body);
    // TODO: mark task complete + update channel mapping
    return json({ ok: true });
  })
);

router.post(
  '/tasks/:id/fail',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[extension] task failure', id, body);
    // TODO: increment attempts and persist error
    return json({ ok: true });
  })
);

router.get(
  '/delist-tasks',
  withRoute(async (request) => {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    console.log('[extension] delist poll', platform);
    // TODO: fetch pending delist_tasks
    return json({ tasks: [] });
  })
);

router.post(
  '/delist-tasks/:id/start',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    console.log('[extension] delist start', id);
    return json({ ok: true });
  })
);

router.post(
  '/delist-tasks/:id/complete',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[extension] delist complete', id, body);
    return json({ ok: true });
  })
);

router.post(
  '/delist-tasks/:id/fail',
  withRoute(async (request) => {
    const { id } = request.params as { id: string };
    const body = await ensureJson(request);
    console.log('[extension] delist fail', id, body);
    return json({ ok: true });
  })
);

export default router;
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
