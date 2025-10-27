# SnapSell MVP

Mobile-first workflow to capture items, enrich specifics, calculate condition-aware pricing using sold comps, and publish to marketplaces with inventory, sales, purchases, and recovery tracking.

## Monorepo layout

```
apps/
  web/        # Next.js app router UI (capture, publish, admin dashboards)
  worker/     # Cloudflare Worker API (pricing, purchases, channels, exports)
  extension/  # Chrome/Edge MV3 extension for cross-list autofill
packages/
  shared/     # Types, Zod schemas, and mappers shared between surfaces
db/
  schema.sql  # Supabase schema with RLS, purchases, lots, recovery views
  seed.sql    # Sample dataset for local development
openapi.yaml  # API contract for the Worker routes
```

## Getting started

```bash
# Install dependencies (pnpm workspace)
pnpm install

# Run web app
pnpm --filter snapsell-web dev

# Run Worker locally
pnpm --filter snapsell-worker dev

# Build extension assets
pnpm --filter snapsell-extension build
```

### Environment configuration

* Web (`apps/web/.env.example`):
  * `NEXT_PUBLIC_API_BASE` – Worker base URL.
  * `NEXT_PUBLIC_APP_NAME` – UI branding.
* Worker (`apps/worker/.dev.vars.example`): service role secrets are stored via Wrangler secrets in production (`SUPABASE_SERVICE_ROLE`, `JWT_SECRET`, eBay credentials). Local `.dev.vars` mirrors the shape for development only.

Follow the [Cloudflare Workers secrets guide](https://developers.cloudflare.com/workers/configuration/secrets/) when provisioning live credentials.

## Database

Run `db/schema.sql` then `db/seed.sql` inside the Supabase SQL editor. All user-facing tables have Row Level Security enabled following Supabase best practices. Views provide stock, valuation, and recovery snapshots for CSV exports and dashboards.

## Testing & CI

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies, lints, type-checks, and runs tests (Vitest to be added). Add unit coverage for pricing, description, and allocation logic under `apps/worker` as the project matures.

## Worker endpoints

See `openapi.yaml` for the full contract covering items, pricing, inventory movements, purchases, channels, extension task queues, and CSV exports for Google Sheets (`IMPORTDATA`).

## Browser extension

The MV3 extension polls Worker relist/delist task queues, autofills marketplace forms (Facebook Marketplace, Vinted, Gumtree), and writes completion states back via the `/extension` routes. Build output lives in `apps/extension/dist` for packaging.

## Security & compliance

* Secrets live in Wrangler/Vercel secure stores—never commit plaintext credentials.
* Supabase RLS enforces tenant isolation via `auth.uid()`.
* Worker CORS defaults to deny, only allowing localhost development and Vercel deployments.
* HTTP clients apply timeouts and retries with structured logging.
