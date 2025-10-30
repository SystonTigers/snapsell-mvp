# Secrets Management

This document outlines how to manage secrets for the SnapSell MVP application across different environments.

## Overview

Secrets should **NEVER** be committed to git. We use different secret management systems for each part of the application:

- **Worker (Cloudflare)**: Wrangler Secrets
- **Web (Vercel)**: Environment Variables
- **Database (Supabase)**: Project Settings

## Required Secrets

### Worker Secrets

These secrets are required for the Cloudflare Worker:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE` | Supabase service role key | Supabase Dashboard → Settings → API |
| `JWT_SECRET` | Secret key for JWT signing | Generate with `openssl rand -base64 32` |
| `EBAY_CLIENT_ID` | eBay Application ID | eBay Developer Portal |
| `EBAY_CLIENT_SECRET` | eBay Application Secret | eBay Developer Portal |
| `EBAY_REDIRECT_URI` | OAuth callback URL | Your domain + `/auth/ebay/callback` |
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry Project Settings |

### Web Environment Variables

These are required for the Next.js web application:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Worker API URL | `https://snapsell-api.your-worker.workers.dev` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SnapSell` |

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Setting Secrets

### Development

#### Worker (Local Development)

Create a `.dev.vars` file in `apps/worker/` (this file is gitignored):

```bash
# apps/worker/.dev.vars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
JWT_SECRET=your-dev-secret-at-least-16-chars
EBAY_CLIENT_ID=your-ebay-client-id
EBAY_CLIENT_SECRET=your-ebay-secret
EBAY_REDIRECT_URI=http://localhost:8787/auth/ebay/callback
EBAY_ENV=sandbox
ENVIRONMENT=development
```

#### Web (Local Development)

Create a `.env.local` file in `apps/web/` (this file is gitignored):

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_BASE=http://localhost:8787
NEXT_PUBLIC_APP_NAME=SnapSell
```

### Production

#### Worker (Cloudflare)

Use Wrangler CLI to set secrets:

```bash
# Navigate to worker directory
cd apps/worker

# Set each secret (you'll be prompted for the value)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE
wrangler secret put JWT_SECRET
wrangler secret put EBAY_CLIENT_ID
wrangler secret put EBAY_CLIENT_SECRET
wrangler secret put EBAY_REDIRECT_URI
wrangler secret put SENTRY_DSN

# Verify secrets are set (won't show values)
wrangler secret list
```

For environment-specific secrets:

```bash
# Production
wrangler secret put SUPABASE_URL --env production
wrangler secret put JWT_SECRET --env production

# Staging
wrangler secret put SUPABASE_URL --env staging
wrangler secret put JWT_SECRET --env staging
```

#### Web (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_API_BASE` = `https://your-worker-url.workers.dev`
   - `NEXT_PUBLIC_APP_NAME` = `SnapSell`
3. Select environment: Production, Preview, or Development
4. Click "Save"

Alternatively, use Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_API_BASE production
# When prompted, enter: https://your-worker-url.workers.dev

vercel env add NEXT_PUBLIC_APP_NAME production
# When prompted, enter: SnapSell
```

## Generating Secrets

### JWT Secret

Generate a strong random secret:

```bash
openssl rand -base64 32
```

**Important:** Use the same JWT_SECRET in both production and staging for the same database. If you rotate the JWT_SECRET, all existing tokens become invalid.

### eBay Credentials

1. Go to [eBay Developer Portal](https://developer.ebay.com/)
2. Create a new application
3. Get your Client ID (App ID) and Client Secret (Cert ID)
4. Configure OAuth Redirect URIs:
   - Development: `http://localhost:8787/auth/ebay/callback`
   - Production: `https://your-worker-url.workers.dev/auth/ebay/callback`

## Secret Rotation

### When to Rotate

- **Immediately** if a secret is compromised or leaked
- **Quarterly** for production secrets (as a best practice)
- **Annually** for less critical secrets

### How to Rotate

#### JWT Secret

1. Generate new secret: `openssl rand -base64 32`
2. Update Worker secret: `wrangler secret put JWT_SECRET --env production`
3. Deploy worker: `wrangler deploy --env production`
4. **Important:** All existing user sessions will be invalidated

#### eBay Credentials

1. Generate new credentials in eBay Developer Portal
2. Update Worker secrets:
   ```bash
   wrangler secret put EBAY_CLIENT_ID --env production
   wrangler secret put EBAY_CLIENT_SECRET --env production
   ```
3. Deploy worker
4. Users will need to reconnect their eBay accounts

#### Supabase Keys

1. Generate new service role key in Supabase Dashboard
2. Update Worker secret: `wrangler secret put SUPABASE_SERVICE_ROLE --env production`
3. Deploy worker immediately
4. **Critical:** This must be done quickly to avoid downtime

## Security Best Practices

### DO ✅

- Use Wrangler Secrets for all sensitive data in Workers
- Use different secrets for development, staging, and production
- Rotate secrets regularly
- Use strong, randomly generated secrets (at least 32 characters)
- Document which secrets are required in this file
- Use `.env.example` files as templates (without actual values)
- Add all secret files to `.gitignore`

### DON'T ❌

- Never commit secrets to git (check with `git log -p | grep -i 'password\|secret\|key'`)
- Never log secrets to console or error tracking
- Never share secrets in Slack, email, or other communication tools
- Never use the same secrets across different environments
- Never hardcode secrets in source code
- Never use weak or guessable secrets (like 'secret123')

## Secret Files (Git Ignored)

These files should NEVER be committed:

```
# Worker
apps/worker/.dev.vars

# Web
apps/web/.env.local
apps/web/.env
apps/web/.env.production

# Root
.env
.env.local
.env.production
```

## Verifying Secrets

### Worker

Check if secrets are set (won't show values):

```bash
cd apps/worker
wrangler secret list
wrangler secret list --env production
```

### Web

Vercel Dashboard → Project → Settings → Environment Variables

Or via CLI:

```bash
vercel env ls
```

## Troubleshooting

### "Missing required secret" error

1. Verify secret is set: `wrangler secret list`
2. If missing, set it: `wrangler secret put SECRET_NAME`
3. Deploy again: `wrangler deploy`

### Secrets not working after deploy

1. Check you're deploying to correct environment
2. Verify secrets are set for that environment
3. Try listing secrets: `wrangler secret list --env production`
4. Redeploy: `wrangler deploy --env production`

### Need to view a secret value

You cannot view secret values once set. If you need to know a value:

1. Check your password manager or secret storage
2. If lost, generate a new secret and rotate it

## Emergency Response

If a secret is compromised:

1. **Immediately** rotate the affected secret
2. Deploy the new secret to production
3. Review recent API logs for suspicious activity
4. Revoke any sessions/tokens created with the old secret
5. Document the incident
6. Review access logs to determine how the leak occurred

## References

- [Wrangler Secrets Documentation](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)
