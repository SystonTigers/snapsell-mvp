# Production Readiness Checklist

Use this checklist to track progress on production readiness items identified in `PRODUCTION_READINESS_REPORT.md`.

## 🔴 Phase 1: Critical Fixes (Week 1) - MUST DO BEFORE PRODUCTION

- [ ] **Add pnpm-lock.yaml** (5 min)
  - Run `pnpm install` and commit lockfile
  - Update CI to use `pnpm install --frozen-lockfile`

- [ ] **Implement JWT Authentication** (2 days)
  - Create JWT verification middleware
  - Apply to all protected routes
  - Extract tenant_id from JWT claims
  - Update database queries to use tenant_id
  - Test with valid/invalid/expired tokens

- [ ] **Set Up Error Monitoring** (4 hours)
  - Add Sentry to `apps/worker/package.json`
  - Add Sentry to `apps/web/package.json`
  - Configure Sentry DSN in secrets
  - Set up error alerts (>1% error rate)
  - Test error capturing

- [ ] **Secure Secrets Management** (2 hours)
  - Document secrets in `docs/SECRETS.md`
  - Use `wrangler secret put` for all worker secrets
  - Use Vercel Environment Variables for web
  - Remove any hardcoded secrets from code
  - Document rotation procedures

- [ ] **Add Security Headers** (4 hours)
  - Add headers to worker responses
  - Add headers to Next.js config
  - Test headers with securityheaders.com
  - Document header policy

- [ ] **Implement Token Refresh** (1 day)
  - Create `refreshEbayToken()` function
  - Check `token_expires_at` before API calls
  - Auto-refresh expired tokens
  - Update stored tokens
  - Test refresh flow

**Estimated Total: 4 days**

---

## 🟠 Phase 2: High Priority (Week 2) - REQUIRED FOR STABILITY

- [ ] **Extend Rate Limiting** (1 day)
  - Add RATE_LIMIT_KV to wrangler.toml
  - Rate limit `/listings/ebay/publish`
  - Rate limit all POST/PUT/DELETE endpoints
  - Use tenant_id + IP composite keys
  - Return 429 with Retry-After header
  - Test rate limit enforcement

- [ ] **Add Input Validation** (2 days)
  - Create Zod schemas for all request bodies
  - Validate `/items/price` input
  - Validate `/listings/ebay/publish` input
  - Validate `/purchases` input
  - Return 400 with validation errors
  - Test with malformed inputs

- [ ] **Write RLS Tests** (2 days)
  - Create test suite for tenant isolation
  - Test each table in RLS_MATRIX.md
  - Attempt cross-tenant reads (must fail)
  - Attempt cross-tenant writes (must fail)
  - Add to CI pipeline
  - Require 100% table coverage

- [ ] **Document Migrations** (4 hours)
  - Create `docs/MIGRATIONS.md`
  - Document migration workflow
  - Document rollback procedures
  - Add migration validation to CI
  - Test migration on staging

- [ ] **Improve Health Checks** (2 hours)
  - Add Supabase connectivity check
  - Return 503 if DB unreachable
  - Add optional dependency checks
  - Configure uptime monitoring

**Estimated Total: 6 days**

---

## 🟡 Phase 3: Medium Priority (Week 3) - IMPROVE RELIABILITY

- [ ] **Add Database Indexes** (2 hours)
  - Index `tenant_id` on all tables
  - Index foreign keys
  - Index commonly queried columns
  - Test query performance

- [ ] **Tighten CORS** (1 hour)
  - Remove wildcard Vercel pattern
  - Use explicit production domains
  - Separate dev/prod configs
  - Test CORS with production domains

- [ ] **Set Up Log Aggregation** (4 hours)
  - Choose provider (Axiom/Better Stack)
  - Configure log shipping
  - Set up log retention (90 days)
  - Create dashboards

- [ ] **Write E2E Tests** (3 days)
  - Test authentication flow
  - Test pricing flow
  - Test listing flow (dry run)
  - Test OAuth callback
  - Add to CI pipeline

- [ ] **Document Deployment** (4 hours)
  - Create `docs/DEPLOYMENT.md`
  - Document worker deployment
  - Document web deployment
  - Document rollback procedures
  - Document monitoring setup

**Estimated Total: 4 days**

---

## 🎯 Pre-Production Final Checks

Before deploying to production, verify ALL items below:

### Infrastructure
- [ ] Production Wrangler environment configured
- [ ] Production Vercel project configured
- [ ] Production Supabase project created
- [ ] KV namespace bound to worker
- [ ] Custom domain configured
- [ ] SSL/TLS certificates valid

### Security
- [ ] JWT authentication working
- [ ] All secrets in secret managers (not env vars)
- [ ] Security headers present on all responses
- [ ] CORS restricted to production domains only
- [ ] Input validation on all endpoints
- [ ] Rate limiting active with KV
- [ ] RLS tests passing
- [ ] No secrets in git history

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Error alerts configured (>1% error rate)
- [ ] Health check endpoint verified
- [ ] Uptime monitoring configured
- [ ] Log aggregation working
- [ ] Dashboards created

### Testing
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] RLS enforcement tests passing (100% tables)
- [ ] E2E tests passing
- [ ] Smoke tests passing
- [ ] Load testing completed (>1000 req/min)

### Database
- [ ] Migrations tested on staging
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Backup configured
- [ ] Restore procedure tested

### Documentation
- [ ] Deployment procedures documented
- [ ] Migration procedures documented
- [ ] Rollback procedures documented
- [ ] Secrets rotation documented
- [ ] Incident response plan created
- [ ] On-call runbook created

### Operations
- [ ] On-call rotation established
- [ ] Alerts configured and tested
- [ ] Runbook accessible to on-call
- [ ] Backup/restore tested
- [ ] Disaster recovery plan documented
- [ ] Post-deployment monitoring plan

---

## Launch Day Checklist

On deployment day:

1. [ ] Run final smoke tests on staging
2. [ ] Verify all secrets configured in production
3. [ ] Run database migrations
4. [ ] Deploy worker with `wrangler deploy --env production`
5. [ ] Deploy web to Vercel production
6. [ ] Verify health check responds 200
7. [ ] Run smoke tests against production
8. [ ] Verify Sentry receiving events
9. [ ] Verify logs flowing to aggregation service
10. [ ] Monitor error rates for first hour
11. [ ] Notify team of successful deployment

---

## Rollback Procedure

If critical issues occur:

1. [ ] Notify team immediately
2. [ ] Check error rate in Sentry
3. [ ] Check logs in aggregation service
4. [ ] Decide: hotfix or rollback?

### If rollback needed:
5. [ ] Deploy previous worker version: `wrangler rollback`
6. [ ] Rollback Vercel: redeploy previous deployment
7. [ ] Rollback database migrations if needed
8. [ ] Verify health check
9. [ ] Run smoke tests
10. [ ] Post-mortem within 24 hours

---

## Progress Tracking

**Phase 1 Started:** _________
**Phase 1 Completed:** _________

**Phase 2 Started:** _________
**Phase 2 Completed:** _________

**Phase 3 Started:** _________
**Phase 3 Completed:** _________

**Production Deployment:** _________

---

## Notes

Use this section to track blockers, decisions, or important context:

```
[Date] [Your Name]:
-
```
