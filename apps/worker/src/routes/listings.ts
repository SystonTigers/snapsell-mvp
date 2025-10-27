import { Router } from 'itty-router';

import { ensureJson, HttpError, json } from '../lib/http';
import type { Env } from '../index';
import { logJobEvent } from '../lib/jobs';

const router = Router({ base: '/listings' });

router.post('/ebay/draft', async (request, env: Env) => {
  const payload = await ensureJson<{ tenantId?: string; channelId?: string; itemId?: string; template?: unknown }>(
    request
  );
  if (!payload.tenantId || !payload.channelId || !payload.itemId) {
    throw new HttpError(400, 'tenantId, channelId, and itemId are required');
  }

  const jobId = crypto.randomUUID();
  await logJobEvent(env, {
    tenantId: payload.tenantId,
    channelId: payload.channelId,
    jobId,
    action: 'EBAY_DRAFT',
    payload,
    result: { ok: true, note: 'Draft simulated' },
    status: 'completed'
  });

  return json({ ok: true, draftId: jobId, dryRun: true, payload });
});

router.post('/ebay/publish', async (request, env: Env) => {
  const payload = await ensureJson<{
    tenantId?: string;
    channelId?: string;
    itemId?: string;
    jobId?: string;
    payload?: unknown;
  }>(request);

  const { tenantId, channelId, itemId } = payload;
  if (!tenantId || !channelId || !itemId) {
    throw new HttpError(400, 'tenantId, channelId, and itemId are required');
  }

  const jobId = payload.jobId ?? crypto.randomUUID();

  if ((env.DRY_RUN ?? '').toLowerCase() === 'true') {
    await logJobEvent(env, {
      tenantId,
      channelId,
      jobId,
      action: 'EBAY_LIST_DRY_RUN',
      payload: payload.payload ?? null,
      result: { ok: true, dryRun: true },
      status: 'completed'
    });
    return json({ ok: true, dryRun: true, jobId, payload: payload.payload ?? null });
  }

  await logJobEvent(env, {
    tenantId,
    channelId,
    jobId,
    action: 'EBAY_LIST',
    payload: payload.payload ?? null,
    status: 'pending'
  });

  return json({
    ok: true,
    dryRun: false,
    jobId,
    message: 'Listing queued for marketplace sync'
  });
});

export default { handle: router.handle };
