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
