# eBay OAuth Overview

```mermaid
graph TD
  A[Web Settings > Connect eBay] -->|/auth/ebay/login| B[eBay Consent Screen]
  B -->|code, state| C[Worker /auth/ebay/callback]
  C --> D[Supabase channels table]
  C --> E[Browser redirect to /settings/channels]
  D --> F[Access token + refresh token stored]
  C --> G[Refresh tokens via /identity/v1/oauth2/token]
```

## Endpoints

| Path | Method | Description |
| ---- | ------ | ----------- |
| `/auth/ebay/login` | GET | Redirects user to eBay OAuth using tenant-scoped state. |
| `/auth/ebay/callback` | GET | Exchanges code for tokens and persists them in `channels`. |
| `/listings/ebay/publish` | POST | Publishes (or dry-runs) listing syncs; logs `job_events`. |
| `/listings/ebay/draft` | POST | Creates a simulated draft payload and logs `job_events`. |
| `/ext/demoPayload` | GET | Returns the demo payload consumed by the browser extension. |
