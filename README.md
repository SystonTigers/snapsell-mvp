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
# web
cd apps/web && pnpm i && pnpm dev

# worker
cd ../worker && pnpm i && wrangler dev
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
- Cloudflare Worker secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `JWT_SECRET` (later: `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI`)

After first deploy, the Worker root should respond with `SnapSell API OK`.
