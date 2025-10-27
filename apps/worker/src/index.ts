import { Router } from 'itty-router';

import { createEnvConfig, type RawEnv, type ValidatedEnv } from './lib/env';
import { json, withRoute } from './lib/http';
import auth from './routes/auth';
import channels from './routes/channels';
import extension from './routes/extension';
import exportsCsv from './routes/exports';
import inventory from './routes/inventory';
import items from './routes/items';
import listings from './routes/listings';
import purchases from './routes/purchases';

const router = Router();
type SubRouter = ReturnType<typeof Router>;

router.get(
  '/',
  withRoute(async () => new Response('SnapSell API OK'))
);

function mountSubrouter(path: string, subRouter: SubRouter) {
  router.all(`${path}`, (request, env, ctx) => subRouter.handle(request, env, ctx));
  router.all(`${path}/*`, (request, env, ctx) => subRouter.handle(request, env, ctx));
}

mountSubrouter('/items', items as unknown as SubRouter);
mountSubrouter('/listings', listings as unknown as SubRouter);
mountSubrouter('/auth', auth as unknown as SubRouter);
mountSubrouter('/inventory', inventory as unknown as SubRouter);
mountSubrouter('/export', exportsCsv as unknown as SubRouter);
mountSubrouter('/channels', channels as unknown as SubRouter);
mountSubrouter('/extension', extension as unknown as SubRouter);
mountSubrouter('/purchases', purchases as unknown as SubRouter);

router.all(
  '*',
  withRoute(async () => json({ ok: false, error: 'Not found' }, { status: 404 }))
);

export default {
  async fetch(request: Request, env: RawEnv, ctx: ExecutionContext): Promise<Response> {
    const validated = createEnvConfig(env);
    const response = await router.handle(request, validated as unknown as ValidatedEnv, ctx);
    return response;
  }
};
