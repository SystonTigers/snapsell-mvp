# SnapSell MVP

Mobile-first selling workflow for capturing items, pricing via comps, and publishing to marketplaces with inventory, sales, and profit tracking.

## Stack

- Frontend: Next.js PWA (App Router) deployed to Vercel
- Backend: Cloudflare Worker (Wrangler)
- Database/Auth/Storage: Supabase (Postgres + RLS)
- Marketplace integrations: eBay Sell API
- Browser extension: Chrome/Edge MV3 for form autofill

## Development

```bash
# install once at repo root
pnpm install

# run packages with Turborepo
pnpm dev      # parallel dev servers where available
pnpm lint     # eslint across all packages
pnpm typecheck
pnpm test

# focus on a single app
pnpm --filter snapsell-web dev
pnpm --filter snapsell-worker dev
```

## Deploy

```bash
# worker
wrangler deploy
# web
vercel --prod
```

## Environment

- Vercel: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_APP_NAME`
- Cloudflare Worker secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `JWT_SECRET`, optional `EBAY_*` OAuth client details, and `CORS_ALLOWED_ORIGINS` (comma-separated Vercel origin list). Configure these with `wrangler secret put` — never commit them as plain env values.

After first deploy, the Worker root should respond with `SnapSell API OK`.
