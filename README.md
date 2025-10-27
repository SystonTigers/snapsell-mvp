# SnapSell MVP

Production-ready skeleton for the SnapSell marketplace automation stack. The
monorepo includes the Next.js web app, Cloudflare Worker API, and the MV3
browser extension used for eBay autofill.

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm dev:all
# Web → http://localhost:3000
# Worker → http://localhost:8787
```

### Useful commands

```bash
pnpm lint          # Workspace lint
pnpm typecheck     # TypeScript across all packages
pnpm test          # Test runner (pass-through)
pnpm seed          # Execute supabase/seed.sql via service role
pnpm smoke         # Health + pricing + dry-run verification
pnpm --filter snapsell-extension build  # Build MV3 bundle
```

## Environment files

| Location           | Example file              | Notes |
| ------------------ | ------------------------- | ----- |
| repo root          | `.env.example`            | Shared worker/web defaults |
| `apps/web`         | `.env.example`            | Public variables consumed by Next.js |
| `apps/worker`      | `.env.example`            | Wrangler `.dev.vars` helper |

Populate the variables and mirror production secrets via Wrangler/Vercel stores
— never commit live credentials.

## Data + security

* `supabase/migrations` seeds the multi-tenant schema and RLS policies.
* `supabase/seed.sql` bootstraps the demo tenant (`demo-tenant`), user, channel,
  and Nike Air Max sample item.
* `docs/RLS_MATRIX.md` tracks tenant isolation coverage.

Run the seed locally:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... pnpm seed
```

## Worker capabilities

* `/health` for uptime probes.
* `/items/price` surfaces the pricing helper with IQR outlier removal.
* `/listings/ebay/publish` respects the `DRY_RUN` flag and logs `job_events`.
* `/auth/ebay/callback` persists OAuth tokens for channels.
* `/ext/demoPayload` powers the extension autofill payload.

All requests emit structured JSON logs with `x-request-id` headers for
traceability.

## Web experience

* First-run banner prompts channel connection when no active channels exist.
* `/settings/channels` links to the eBay OAuth login.
* Seeded item (Nike Air Max) is surfaced on the dashboard so teams can exercise
  the happy-path (Price → List → Dry run success).

## Smoke test

`pnpm smoke` performs the minimum viable health-check flow:

1. `GET /health`
2. Verifies `demo-item-1` exists in Supabase.
3. Calls the pricing helper.
4. Calls the dry-run listing flow and asserts `dryRun: true`.

The CI workflow executes the same script for regression prevention.

## Browser extension

* Source lives in `apps/extension/`.
* `pnpm --filter snapsell-extension build` emits `dist/` with manifest and JS.
* Load the unpacked folder in Chrome to autofill demo payloads on eBay listing
  forms via `/ext/demoPayload`.

## Integrations

See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) for the eBay OAuth diagram
and endpoint matrix.

## Contributing

* Conventional commits enforced via review.
* `.github/pull_request_template.md` captures release hygiene checks.
* CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and smoke.
