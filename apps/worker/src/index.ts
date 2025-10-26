import { Router } from 'itty-router';
import items from './routes/items';
import listings from './routes/listings';
import auth from './routes/auth';
import inventory from './routes/inventory';
import exportsCsv from './routes/exports';
import channels from './routes/channels';
import extension from './routes/extension';
import { checkEnv, type EnvChecked } from './lib/env';
import { applyCorsHeaders, enforceBodyLimit, enforceCors, json, preflight, rateLimit, withErrors } from './lib/http';

const router = Router();
router.get('/', () => json({ ok: true, message: 'SnapSell API OK' }));

router.all('/items/*', items.handle);
router.all('/listings/*', listings.handle);
router.all('/auth/*', auth.handle);
router.all('/inventory/*', inventory.handle);
router.all('/export/*', exportsCsv.handle);
router.all('/channels/*', channels.handle);
router.all('/extension/*', extension.handle);

const BODY_LIMIT_BYTES = 1_048_576; // 1 MiB
const BODY_EXEMPT_PATHS = ['/items/ingest'];
const RATE_LIMITED_PATHS = new Map<string, { windowSeconds: number; max: number }>([
  ['/items/price', { windowSeconds: 60, max: 40 }],
  ['/channels/ebay/sync-qty', { windowSeconds: 60, max: 20 }],
]);

type WorkerEnv = EnvChecked & { RATE_LIMIT_KV?: KVNamespace };

const handler = withErrors(async (request: Request, rawEnv: WorkerEnv, ctx: ExecutionContext) => {
  const env = checkEnv(rawEnv);
  const cors = enforceCors(request, env.CORS_ALLOWED_ORIGINS);
  if (cors instanceof Response) {
    return cors;
  }

  if (request.method === 'OPTIONS') {
    return preflight(cors);
  }

  const bodyLimitViolation = enforceBodyLimit(request, BODY_LIMIT_BYTES, BODY_EXEMPT_PATHS);
  if (bodyLimitViolation) {
    return applyCorsHeaders(bodyLimitViolation, cors);
  }

  const url = new URL(request.url);
  const rateConfig = RATE_LIMITED_PATHS.get(url.pathname);
  if (rateConfig) {
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limitResult = await rateLimit(rawEnv.RATE_LIMIT_KV, `${url.pathname}:${clientIp}`, rateConfig);
    if (!limitResult.allowed) {
      return applyCorsHeaders(json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 }), cors);
    }
  }

  const response = await router.handle(request, { ...rawEnv, ...env }, ctx);
  const finalResponse = response instanceof Response ? response : json({ ok: false, error: 'Not Found' }, { status: 404 });
  return applyCorsHeaders(finalResponse, cors);
});

export type Env = WorkerEnv;

export default { fetch: (request: Request, env: Env, ctx: ExecutionContext) => handler(request, env, ctx) };
