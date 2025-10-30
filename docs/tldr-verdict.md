# TL;DR Verdict

Good skeleton, not yet production-complete. The repo lays out a monorepo with Next.js web, a Cloudflare Worker API, Supabase schema/seed, an MV3 Chrome extension, basic smoke tests, and an OpenAPI spec. It boots locally with `pnpm dev:all`, seeds demo data, and provides a “dry-run” listing flow and pricing helper. But you still need end-to-end coverage, real OAuth + secret wiring, hardened RLS verification, extension store packaging, observability, and a few security hardening steps to confidently call it “production.”

## What Already Works (Per Repo Docs)

- Monorepo surfaces: Next.js web app, Cloudflare Worker API, MV3 extension.
- Quick start: `cp .env.example .env`, `pnpm install`, `pnpm dev:all` → Web at 3000, Worker at 8787.
- Database: Supabase migrations + RLS; `supabase/seed.sql` primes a demo tenant/user/item.
- Worker endpoints: `/health`, `/items/price` (IQR-based), `/listings/ebay/publish` (respects `DRY_RUN`), `/auth/ebay/callback`, `/ext/demoPayload`; structured JSON logs with `x-request-id`.
- Web UX cues: first-run banner to connect channels; seeded Nike item on dashboard to walk “Price → List → Dry run success.”
- Automation: `pnpm smoke` runs a mini flow (health → demo item exists → pricing → dry-run listing) and is wired in CI.
- API contract: `openapi.yaml` present for the Worker.

## Gaps to Close Before “Production-Ready”

- Secrets & multi-env wiring (Vercel + Wrangler + Supabase) beyond `.env.example`, including real eBay OAuth creds and environment segregation.
- Auth + RLS test enforcement: RLS matrix exists but needs automated tests that try to break tenant isolation and assert denials.
- Stronger validation & error contracts: Zod/Valibot on every input, consistent error envelope matching OpenAPI.
- Observability: Sentry (or OpenTelemetry export), health/uptime checks with alerts, and request-ID propagation into logs/Front-end. (IDs exist; wire the rest.)
- Rate limiting & abuse protection: per-tenant/per-IP caps on pricing and listing endpoints.
- E2E coverage: Playwright flows (web ↔ worker ↔ Supabase), plus Dredd/Schemathesis against `openapi.yaml`.
- Extension packaging & QA: MV3 build exists; add e2e tests on eBay listing form (stub/mocks), versioning & release artifacts.
- Security scans: dependency audit, secret scanning, ESLint security rules, Wrangler/Vercel headers (CSP, COOP/COEP if needed).
- Operational runbooks: backup/restore, DB migrations checklist, on-call alerts, rollback plan.
- Legal/ToS check: confirm eBay automation terms for autofill/dry-run vs publish.

## Step-by-Step Implementation Plan

0. **Repo bootstrap**
   - `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm smoke`. Ensure green locally.
   - Create `.env`s for local, preview, prod per README table (root / apps/web / apps/worker). Mirror secrets to Vercel & Wrangler KV/Secrets; never commit real creds.

1. **Secrets & environments**
   - Add `apps/worker/wrangler.toml` env blocks (`[env.preview]`, `[env.production]`) and vars mapping for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `EBAY_CLIENT_ID/SECRET`, `SENTRY_DSN`, `DRY_RUN` (prod=false).
   - In Vercel, add project-scoped envs for web with public/private separation (`NEXT_PUBLIC_*` only where safe).

2. **Input validation + error envelope**
   - Introduce Zod schemas per route (price, publish, auth). On parse fail → standardized `{ ok:false, error:{code, message, details}, requestId }`.
   - Ensure OpenAPI examples match these shapes; regenerate spec snippets if needed.

3. **RLS enforcement tests**
   - Add a test suite (`packages/tests/rls.spec.ts`) that signs in as Tenant A, attempts to read/write Tenant B rows → must fail (403/empty).
   - Cover every table with RLS (`items`, `channels`, `job_events`, etc.).
   - Parse `docs/RLS_MATRIX.md` and assert each row has a test. (Fail CI if any untested).

4. **Pricing helper hardening**
   - Unit-test IQR outlier removal with diverse datasets (heavy tails, tiny samples, all same price).
   - Add min sample-size guardrails; return `{strategy:"median", sampleSize, iqr, suggestedPrice}` transparently.

5. **eBay OAuth & publish flow**
   - Wire real callback to `/auth/ebay/callback`; store tokens in channels. Ensure token refresh path exists with jittered retry + idempotency key on publish.
   - Keep `DRY_RUN` honored in non-prod; in prod enable guarded “real publish” behind feature flag + per-tenant quota.

6. **Rate limiting**
   - Add Hono/Itty middleware (or custom) for per-route limits:
     - `/items/price`: 30/min per tenant.
     - `/listings/ebay/publish`: 5/min per tenant.
   - Return 429 with `Retry-After`.

7. **Observability**
   - Add Sentry to Worker & Web (release + environment tags); capture unhandled rejections.
   - Ensure `x-request-id` created at edge → propagated to web logs, API logs, DB `job_events`.
   - Add Cloudflare health checks that poll `/health` and page on failure.

8. **Security headers & CORS**
   - Lock CORS allow-list (localhost in dev; Vercel hostnames in preview/prod).
   - Add CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy on both Web & Worker.

9. **Extension build, test, package**
   - Confirm `pnpm --filter snapsell-extension build` emits MV3 `dist/`.
   - Add Playwright test that loads a mocked eBay listing form page, pulls `/ext/demoPayload`, and exercises autofill fields.
   - Create a packaging step that zips `dist/` with version from `apps/extension/package.json`.
   - Draft release notes + `CHANGELOG.md` entry; attach zip in GitHub Release.

10. **Contract tests against OpenAPI**
    - Add Dredd or Schemathesis CI job against `openapi.yaml` so responses match the spec. Any drift fails CI.

11. **CI hardening**
    - Update `.github/workflows/ci.yml` to run:
      - `pnpm install`
      - `pnpm lint` + `pnpm typecheck`
      - `pnpm test` (unit)
      - `pnpm smoke` (with a seeded ephemeral DB)
      - `pnpm run rls:test` (the new suite)
      - `pnpm run contract:test` (Dredd/Schemathesis)
      - Build the extension and upload the artifact.

12. **Deployment pipelines**
    - Preview: on PR → deploy Worker (`wrangler deploy --env preview`) + Web (Vercel Preview), run smoke tests against preview URLs.
    - Prod: on main tag → DB migrations, Worker deploy (`--env production`), Web promote, extension packaging, create GitHub Release.

13. **Operational docs**
    - Add `docs/RUNBOOK.md` (migrations, rollbacks, rotating eBay creds), `docs/ALERTS.md` (what pages whom and why), `docs/BACKUPS.md` (Supabase PITR/exports).

## Test Plan (Execute Automatically)

### Unit tests

- **Worker**
  - `/items/price`: pricing math, edge cases, input validation.
  - `/listings/ebay/publish`: dry-run behavior, idempotency key, retry/backoff, token refresh path (mocked).
  - `/auth/ebay/callback`: happy path + invalid states.
- **Shared packages**
  - Utilities (fetch wrappers, schema parsers), logger adds `requestId`.

### Contract tests

- Use Dredd/Schemathesis against `openapi.yaml` for all documented endpoints; ensure status codes, shapes, examples are honored.

### Integration tests (API + DB)

- Spin up Supabase (test schema). Run seeds.
- Run flows: create tenant → connect channel (mock OAuth) → price → publish (dry run) → assert `job_events` logs include `requestId` + correct payload.

### RLS tests

- Auth as Tenant A; attempt cross-tenant read/write to every table in `docs/RLS_MATRIX.md` → expect denial. Fail if any pass.

### E2E tests (Playwright)

- **Web**: first-run banner, connect-channel CTA, seeded item path “Price → List (dry-run) → success toast.”
- **Extension**: load mocked eBay form, hit `/ext/demoPayload`, verify DOM autofill & field mapping.

### Performance & limits

- Locust/K6 smoke on `/items/price` and `/listings/ebay/publish` to verify rate limiting and non-degradation.

### Security checks

- `pnpm audit` (or `pnpm audit --prod`), ESLint security rules, secret-scan.
- Headers test: assert CSP, Referrer-Policy, etc. present in responses.

### Deployment checklist (production)

- All CI stages green including RLS + contract tests.
- Wrangler production env live; Vercel prod env secrets set.
- `DRY_RUN=false` in prod for publish (kept feature-flagged).
- Sentry DSNs wired; alerts integrated.
- Extension packaged, versioned, and ready for Chrome Web Store submission.
- Runbook + on-call docs committed.
