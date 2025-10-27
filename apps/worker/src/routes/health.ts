import { json } from '../lib/http';

export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ ok: true, app: 'SnapSell API', ts: Date.now() }),
    {
      headers: { 'content-type': 'application/json' },
      status: 200
    }
  );
};

export const healthHandler = () => json({ ok: true, app: 'SnapSell API', ts: Date.now() });

export default { handle: healthHandler };
