# Production Readiness Review Report
**Date:** 2025-10-30
**Project:** SnapSell MVP
**Reviewer:** Claude Code

---

## Executive Summary

**Overall Assessment: ⚠️ NOT PRODUCTION READY**

The SnapSell MVP demonstrates a solid architectural foundation with modern technologies (Next.js, Cloudflare Workers, Supabase) and follows many best practices. However, **critical security, operational, and reliability gaps must be addressed before production deployment**.

**Risk Level:** HIGH
**Estimated Time to Production Ready:** 2-3 weeks (assuming dedicated team)

---

## 🔴 Critical Blockers (Must Fix Before Production)

### 1. Missing Dependency Lockfile
**Severity:** CRITICAL
**Location:** Root directory
**Issue:** No `pnpm-lock.yaml` file exists in the repository.

**Risk:**
- Non-deterministic builds across environments
- Potential for supply chain attacks
- Different developers/CI may install different package versions
- Impossible to audit exact dependency versions

**Remediation:**
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile for deterministic builds"
```

---

### 2. No Authentication/Authorization on API Endpoints
**Severity:** CRITICAL
**Location:** `apps/worker/src/index.ts`
**Issue:** API endpoints are completely open - no JWT validation, no authentication middleware.

**Risk:**
- Anyone can call pricing endpoints, publish listings, modify data
- RLS policies in database are bypassed (worker uses service role)
- Data exfiltration, abuse, cost explosion from unlimited API calls

**Example of vulnerable endpoint:**
```typescript
// apps/worker/src/routes/items.ts - No auth check!
router.post('/price', async (request, env: Env) => {
  const body = await ensureJson(request);
  // ... pricing logic executes for ANY caller
});
```

**Remediation:**
1. Implement JWT validation middleware:
```typescript
// Add middleware to validate JWT and extract tenant_id
const requireAuth = async (request: Request, env: Env) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new HttpError(401, 'Missing authorization');

  const decoded = await verifyJWT(token, env.JWT_SECRET);
  return decoded.tenant_id;
};
```

2. Apply to all protected routes
3. Pass tenant_id to Supabase queries to leverage RLS

---

### 3. Secrets in Plain Text Examples
**Severity:** CRITICAL
**Location:** `.env.example`, `.dev.vars.example`
**Issue:** Example files suggest storing secrets in plain environment variables.

**Risk:**
- Production secrets may be committed to git
- No secret rotation mechanism
- Secrets visible in Cloudflare/Vercel dashboards

**Remediation:**
1. Use Wrangler Secrets for production:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE
wrangler secret put JWT_SECRET
wrangler secret put EBAY_CLIENT_SECRET
```

2. Use Vercel Environment Variables (encrypted at rest)
3. Document secret rotation procedures
4. Add `.env` to `.gitignore` (already done ✅)

---

### 4. No Error Monitoring / Observability
**Severity:** CRITICAL
**Location:** N/A (missing)
**Issue:** No Sentry, LogDNA, Datadog, or equivalent error tracking.

**Risk:**
- Production errors go unnoticed
- No alerting for critical failures
- Impossible to debug user issues
- No visibility into performance degradation

**Remediation:**
1. Add Sentry SDK to both worker and web:
```typescript
// apps/worker/src/index.ts
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.ENVIRONMENT,
  tracesSampleRate: 0.1,
});
```

2. Configure alerts for:
   - Error rate > 1% of requests
   - Response time p99 > 2s
   - Rate limit violations
   - OAuth failures

---

### 5. No Database Migration Strategy
**Severity:** HIGH
**Location:** `supabase/migrations/`
**Issue:** Migrations exist but no documented deployment process, no rollback plan.

**Risk:**
- Schema changes may break production
- No way to safely test migrations
- Data loss during failed migrations

**Remediation:**
1. Document migration workflow in `docs/MIGRATIONS.md`:
   - Preview: test on staging DB
   - Production: use Supabase CLI with transaction wrapping
   - Rollback: down-migrations for each change

2. Add migration CI check:
```yaml
- name: Validate migrations
  run: supabase db diff --schema public
```

---

### 6. Missing Security Headers
**Severity:** HIGH
**Location:** `apps/worker/src/index.ts`, `apps/web/next.config.mjs`
**Issue:** No CSP, HSTS, X-Frame-Options, or other security headers.

**Risk:**
- XSS attacks
- Clickjacking
- MIME sniffing vulnerabilities
- Mixed content

**Remediation:**

**Worker (`apps/worker/src/lib/http.ts`):**
```typescript
export const securityHeaders = (response: Response): Response => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Add CSP if serving HTML
  return response;
};
```

**Web (`apps/web/next.config.mjs`):**
```javascript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
      }
    ]
  }
]
```

---

## 🟠 High Priority Issues (Fix Before Launch)

### 7. Incomplete Rate Limiting
**Severity:** HIGH
**Location:** `apps/worker/src/index.ts:52-55`
**Issue:** Rate limiting only on 2 endpoints, uses IP address (easily bypassed).

**Current Implementation:**
```typescript
const RATE_LIMITED_PATHS = new Map([
  ['/items/price', { windowSeconds: 60, max: 40 }],
  ['/channels/ebay/sync-qty', { windowSeconds: 60, max: 20 }]
]);
```

**Gaps:**
- No rate limiting on `/listings/ebay/publish` (expensive operation!)
- No tenant-based limiting (IP is insufficient)
- No RATE_LIMIT_KV binding documented in wrangler.toml

**Remediation:**
1. Add KV namespace to `wrangler.toml`:
```toml
kv_namespaces = [
  { binding = "RATE_LIMIT_KV", id = "your-kv-id" }
]
```

2. Extend rate limits to all write operations
3. Use tenant_id (from JWT) + IP for composite key

---

### 8. No Input Validation on Critical Endpoints
**Severity:** HIGH
**Location:** Various route files
**Issue:** Minimal use of Zod schemas for request validation.

**Example:** `apps/worker/src/routes/listings.ts` accepts arbitrary JSON.

**Risk:**
- SQL injection (mitigated by Supabase client, but still risky)
- Business logic bypass (negative prices, invalid statuses)
- DoS via malformed payloads

**Remediation:**
Create Zod schemas for all inputs:
```typescript
// apps/worker/src/schemas/listing.ts
export const PublishListingSchema = z.object({
  tenantId: z.string().uuid(),
  channelId: z.string(),
  itemId: z.string(),
  payload: z.object({
    title: z.string().min(1).max(80),
    price: z.number().positive().max(100000),
    quantity: z.number().int().positive().max(1000),
  }),
});
```

Apply at route level:
```typescript
const body = PublishListingSchema.parse(await ensureJson(request));
```

---

### 9. Token Refresh Not Implemented
**Severity:** HIGH
**Location:** `apps/worker/src/lib/ebay.ts` (likely missing)
**Issue:** eBay OAuth tokens expire but no refresh logic.

**Risk:**
- Listings fail after token expiry
- Users must manually re-authenticate
- No graceful degradation

**Remediation:**
1. Check `token_expires_at` before API calls
2. Refresh using `refresh_token` if expired
3. Retry original request with new token
4. Store new tokens in database

---

### 10. No Health Check Dependencies
**Severity:** MEDIUM
**Location:** `apps/worker/src/routes/health.ts`
**Issue:** Health check doesn't verify Supabase connectivity.

**Current:**
```typescript
export const healthHandler = (): Response => {
  return json({ ok: true, timestamp: new Date().toISOString() });
};
```

**Better:**
```typescript
export const healthHandler = async (env: Env): Promise<Response> => {
  try {
    await supabaseFetch(env, { path: 'tenants', query: { limit: 1 } });
    return json({ ok: true, db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    return json({ ok: false, db: 'disconnected', error }, { status: 503 });
  }
};
```

---

## 🟡 Medium Priority Issues (Address Soon)

### 11. Test Coverage Insufficient
**Current Coverage:**
- ✅ Unit tests: `pricing.test.ts`, `allocation.test.ts`, `description.test.ts`
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No RLS enforcement tests
- ❌ No contract tests against OpenAPI spec

**Recommendation:**
Target 80% code coverage on critical paths:
- Authentication middleware
- Pricing algorithm
- OAuth flow
- RLS policies (must have dedicated tests!)

---

### 12. CORS Configuration Too Permissive
**Location:** `apps/worker/src/lib/env.ts:3-7`
**Issue:** Wildcard patterns in default allowed origins.

```typescript
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://*.vercel.app'  // ⚠️ Too broad!
];
```

**Risk:** Any Vercel app can make requests to your API.

**Fix:** Use explicit production domains:
```typescript
const DEFAULT_ALLOWED_ORIGINS =
  env.ENVIRONMENT === 'production'
    ? ['https://snapsell.app']
    : ['http://localhost:3000'];
```

---

### 13. No Request Size Limits on /items/ingest
**Location:** `apps/worker/src/index.ts:51`
**Issue:** `/items/ingest` is exempt from body size limits.

```typescript
const BODY_EXEMPT_PATHS = ['/items/ingest'];
```

**Risk:** Large file uploads could DoS the worker.

**Fix:** Set a reasonable limit (e.g., 10MB) even for exempt paths.

---

### 14. No Database Indexes Documented
**Location:** `supabase/migrations/0001_core.sql`
**Issue:** No indexes on foreign keys or commonly queried columns.

**Performance Impact:**
- Queries on `tenant_id` will table scan
- Listing lookups by `item_id` unoptimized

**Recommendation:**
```sql
create index idx_items_tenant_id on public.items(tenant_id);
create index idx_listings_item_id on public.listings(item_id);
create index idx_channels_tenant_id on public.channels(tenant_id);
```

---

### 15. No Logging Retention Policy
**Issue:** Console logs in Cloudflare Workers have limited retention.

**Risk:** Unable to debug issues after 24-48 hours.

**Fix:** Stream logs to external service (Axiom, Better Stack, CloudFlare Logpush).

---

## 🟢 Low Priority / Nice-to-Have

### 16. No API Versioning
**Issue:** `/items/price` could break clients if signature changes.

**Recommendation:** Use `/v1/items/price` pattern.

---

### 17. No Graceful Degradation
**Issue:** If Supabase is down, entire app fails.

**Recommendation:** Cache channel configs, fallback pricing logic.

---

### 18. No Deployment Documentation
**Issue:** README shows dev setup only, no production deployment guide.

**Recommendation:** Add `docs/DEPLOYMENT.md` with:
- Wrangler production deployment
- Vercel production deployment
- Secret management
- Database migration steps
- Rollback procedures

---

## ✅ What's Working Well

1. **Monorepo Structure:** Clean separation with Turbo/pnpm
2. **RLS Policies:** Comprehensive tenant isolation (needs testing!)
3. **Error Handling:** Structured JSON errors with request IDs
4. **Type Safety:** TypeScript throughout with strict mode
5. **CORS Enforcement:** Basic implementation in place
6. **Smoke Tests:** Automated sanity checks in CI
7. **OpenAPI Spec:** API documented in `openapi.yaml`
8. **.gitignore:** Properly excludes secrets and build artifacts

---

## Detailed Risk Matrix

| Issue | Severity | Likelihood | Impact | Time to Fix |
|-------|----------|-----------|--------|-------------|
| No dependency lockfile | Critical | High | High | 5 min |
| Missing authentication | Critical | High | Catastrophic | 2-3 days |
| No error monitoring | Critical | Medium | High | 4 hours |
| Secrets in env vars | Critical | Medium | High | 2 hours |
| Missing security headers | High | High | Medium | 4 hours |
| Incomplete rate limiting | High | High | High | 1 day |
| No input validation | High | Medium | Medium | 2 days |
| Token refresh missing | High | Medium | Medium | 1 day |
| Insufficient tests | Medium | Low | Medium | 1-2 weeks |
| No migration strategy | High | Low | High | 1 day |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Week 1)
**Must complete before ANY production deployment**

1. ✅ Add `pnpm-lock.yaml` → **5 minutes**
2. ✅ Implement JWT authentication middleware → **2 days**
3. ✅ Set up Sentry error monitoring → **4 hours**
4. ✅ Move secrets to Wrangler Secrets → **2 hours**
5. ✅ Add security headers → **4 hours**
6. ✅ Implement token refresh logic → **1 day**

**Total:** ~4 days

---

### Phase 2: High Priority (Week 2)
**Required for stable production operation**

1. ✅ Extend rate limiting to all write endpoints → **1 day**
2. ✅ Add Zod input validation → **2 days**
3. ✅ Write RLS enforcement tests → **2 days**
4. ✅ Document migration workflow → **4 hours**
5. ✅ Improve health checks → **2 hours**

**Total:** ~6 days

---

### Phase 3: Medium Priority (Week 3)
**Improve reliability and observability**

1. ✅ Add database indexes → **2 hours**
2. ✅ Tighten CORS configuration → **1 hour**
3. ✅ Set up log aggregation → **4 hours**
4. ✅ Write E2E tests (critical paths) → **3 days**
5. ✅ Document deployment procedures → **4 hours**

**Total:** ~4 days

---

## Production Deployment Checklist

Before flipping the switch to production, verify:

- [ ] `pnpm-lock.yaml` committed and CI uses `--frozen-lockfile`
- [ ] JWT authentication enforced on all protected routes
- [ ] Sentry configured with alerts for error rate > 1%
- [ ] All secrets stored in Wrangler Secrets / Vercel encrypted variables
- [ ] Security headers present on all responses
- [ ] Rate limiting active on all write endpoints with KV binding
- [ ] Input validation (Zod) on all POST/PUT/PATCH endpoints
- [ ] OAuth token refresh implemented and tested
- [ ] RLS enforcement tests passing (100% table coverage)
- [ ] Database indexes created for foreign keys
- [ ] Health check validates Supabase connectivity
- [ ] Smoke tests passing in production-like environment
- [ ] Migration rollback procedure documented and tested
- [ ] On-call rotation established with runbook
- [ ] CORS allowlist configured with exact production domains
- [ ] Backup/restore procedure tested
- [ ] Log retention configured (90+ days recommended)
- [ ] API versioning strategy decided
- [ ] Load testing completed (1000 req/min minimum)
- [ ] Incident response plan documented

---

## Security Audit Summary

### Authentication & Authorization
- ❌ No authentication on API endpoints
- ✅ RLS policies defined (not tested)
- ❌ No JWT validation
- ❌ Service role used for all DB queries (bypasses RLS)

### Secrets Management
- ⚠️ Example files exist but no production secret docs
- ❌ No secret rotation procedure
- ✅ `.gitignore` excludes `.env` files

### Input Validation
- ⚠️ Partial (only environment variables validated)
- ❌ Most endpoints accept arbitrary JSON
- ❌ No SQL injection tests (low risk with Supabase client)

### Network Security
- ✅ CORS enforcement implemented
- ⚠️ Too permissive (wildcard Vercel domains)
- ❌ No security headers
- ❌ No DDoS protection beyond basic rate limiting

### Data Protection
- ✅ RLS policies for tenant isolation
- ❌ No encryption at rest documentation (Supabase handles this)
- ❌ No PII handling procedures
- ❌ No data retention policy

### Monitoring & Response
- ❌ No error tracking
- ❌ No performance monitoring
- ❌ No security event logging
- ❌ No incident response plan

---

## Conclusion

The SnapSell MVP has a **solid architectural foundation** but requires **significant security and operational hardening** before production deployment. The most critical gap is **missing authentication** on API endpoints, which exposes the entire system to unauthorized access.

### Timeline Estimate
- **Minimum viable production:** 2 weeks (Phase 1 + 2)
- **Production-ready with confidence:** 3-4 weeks (all phases)

### Cost Estimate (Additional Services)
- Sentry (error monitoring): ~$26/mo (Team plan)
- Axiom/Better Stack (log aggregation): ~$25/mo
- Cloudflare KV (rate limiting): Included in Workers paid plan
- Total: ~$50/mo additional operational costs

---

**Recommendation:** Do not deploy to production until at minimum Phase 1 items are completed. The current state poses unacceptable security and reliability risks.

**Next Steps:**
1. Review this report with the team
2. Prioritize Phase 1 fixes
3. Schedule security audit after Phase 2 completion
4. Plan load testing before public launch

---

*Generated by Claude Code Production Readiness Review*
*Report Version: 1.0*
