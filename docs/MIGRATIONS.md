# Database Migrations Strategy

This document outlines the database migration strategy for the SnapSell MVP, including workflows, best practices, and rollback procedures.

## Overview

We use Supabase for our PostgreSQL database, with migrations stored in `supabase/migrations/`. Each migration is a SQL file with a timestamp prefix.

## Migration Files

Current migrations:

- `0001_core.sql` - Core multi-tenant schema (tenants, users, channels, items, etc.)
- `0002_rls.sql` - Row-Level Security policies for tenant isolation
- `0003_indexes.sql` - Performance indexes (to be created)

## Migration Workflow

### Creating a New Migration

1. **Create the migration file**:
   ```bash
   # Use Supabase CLI (recommended)
   supabase migration new add_feature_name

   # Or manually create with timestamp
   touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_feature_name.sql
   ```

2. **Write the migration**:
   ```sql
   -- Add new column
   alter table public.items add column sku text;

   -- Create index
   create index idx_items_sku on public.items(sku);

   -- Always include RLS if creating new tables
   alter table public.new_table enable row level security;
   create policy new_table_isolation on public.new_table
     using (tenant_id = auth.jwt() ->> 'tenant_id');
   ```

3. **Test locally**:
   ```bash
   # Apply migration to local Supabase
   supabase db reset

   # Or apply specific migration
   supabase db push

   # Verify schema
   supabase db diff --schema public
   ```

4. **Create a rollback migration** (important!):
   ```bash
   supabase migration new rollback_add_feature_name
   ```
   ```sql
   -- Rollback: remove column
   alter table public.items drop column if exists sku;

   -- Rollback: drop index
   drop index if exists idx_items_sku;
   ```

### Testing Migrations

Before applying to production:

1. **Test on local database**:
   ```bash
   supabase start
   supabase db reset
   ```

2. **Test with seed data**:
   ```bash
   pnpm seed
   ```

3. **Run smoke tests**:
   ```bash
   pnpm smoke
   ```

4. **Test on staging environment**:
   - Apply migration to staging Supabase project
   - Run full test suite
   - Verify application works correctly
   - Test rollback migration

### Applying Migrations to Production

**⚠️ Production migrations should be applied during low-traffic periods**

#### Option 1: Supabase CLI (Recommended)

```bash
# Link to production project
supabase link --project-ref your-production-ref

# Review what will be applied
supabase db diff --schema public

# Apply migrations
supabase db push

# Verify migration applied
supabase db diff --schema public
# Should show "No schema differences detected"
```

#### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL from `supabase/migrations/NNNN_name.sql`
3. Review carefully
4. Execute SQL
5. Verify changes in Table Editor

#### Option 3: Automated (CI/CD)

Add to GitHub Actions (use with caution):

```yaml
- name: Apply database migrations
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
  run: |
    supabase link --project-ref $SUPABASE_PROJECT_ID
    supabase db push
```

## Pre-Migration Checklist

Before applying any production migration:

- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Rollback migration created and tested
- [ ] Database backup taken (Supabase does daily backups, but verify recent backup exists)
- [ ] Low traffic period scheduled (or maintenance window announced)
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Rollback plan documented
- [ ] Estimated downtime calculated (if any)

## Migration Types

### Non-Breaking Migrations (Safe)

These can be applied with zero downtime:

- Adding new tables
- Adding nullable columns
- Adding indexes (use `CONCURRENTLY` in production)
- Adding new policies

**Example:**
```sql
-- Safe: Adding nullable column
alter table public.items add column sku text;

-- Safe: Adding index (use CONCURRENTLY for large tables)
create index concurrently idx_items_sku on public.items(sku);
```

### Breaking Migrations (Requires Planning)

These require careful planning and may cause downtime:

- Dropping columns
- Renaming columns
- Changing column types
- Dropping tables
- Changing RLS policies

**Strategy for breaking changes:**

1. **Two-phase deployment** (expand/contract pattern):
   - Phase 1: Add new column, deploy code that writes to both old and new
   - Phase 2: Remove old column after verifying all writes go to new column

2. **Example: Renaming a column**:
   ```sql
   -- Phase 1: Add new column (non-breaking)
   alter table public.items add column new_name text;
   update public.items set new_name = old_name;

   -- Deploy application that reads from new_name, writes to both

   -- Phase 2: Drop old column (breaking, but nothing uses it)
   alter table public.items drop column old_name;
   ```

## Rollback Procedures

### Detecting Issues

Monitor these after migration:

- Error rate in Sentry
- API response times
- Database query performance
- Application logs

### Rolling Back

#### If migration just applied (< 5 minutes):

1. **Run rollback migration immediately**:
   ```bash
   supabase db push --file supabase/migrations/NNNN_rollback_name.sql
   ```

2. **Verify application recovers**:
   ```bash
   curl https://your-api.workers.dev/health
   pnpm smoke
   ```

#### If issues discovered later (> 5 minutes):

1. **Assess impact**:
   - Is data corrupted?
   - Are users affected?
   - Can we fix with a patch?

2. **Decision: Fix forward or rollback?**
   - **Fix forward**: Create a new migration to fix the issue
   - **Rollback**: Restore from backup and apply rollback migration

3. **If rolling back**:
   ```bash
   # Option 1: Apply rollback migration
   supabase db push --file supabase/migrations/NNNN_rollback_name.sql

   # Option 2: Restore from Supabase backup (if data corrupted)
   # Go to Supabase Dashboard → Database → Backups → Restore
   ```

### Point-in-Time Recovery (PITR)

Supabase Pro/Team plans support PITR:

1. Go to Dashboard → Database → Backups
2. Select "Point in Time Recovery"
3. Choose timestamp before migration
4. Confirm restore

**⚠️ Warning:** PITR will lose all data written after the restore point.

## Common Migration Scenarios

### Adding an Index

```sql
-- For small tables (< 10k rows)
create index idx_items_tenant_id on public.items(tenant_id);

-- For large tables (use CONCURRENTLY to avoid locks)
create index concurrently idx_items_tenant_id on public.items(tenant_id);
```

### Adding a Column

```sql
-- Nullable (safe, no downtime)
alter table public.items add column sku text;

-- With default (may lock table briefly)
alter table public.items add column status text default 'draft';

-- Not null (requires data migration first)
-- Step 1: Add as nullable
alter table public.items add column required_field text;
-- Step 2: Populate data
update public.items set required_field = 'default_value' where required_field is null;
-- Step 3: Make not null
alter table public.items alter column required_field set not null;
```

### Creating a New Table

```sql
create table public.new_feature (
  id text primary key,
  tenant_id text references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Always enable RLS for tenant isolation
alter table public.new_feature enable row level security;

create policy new_feature_isolation on public.new_feature
  using (tenant_id = auth.jwt() ->> 'tenant_id');

-- Add to RLS_MATRIX.md documentation
-- | new_feature | ✅ | new_feature_isolation |
```

### Dropping a Table

```sql
-- Ensure no code references this table first!
-- Check foreign key constraints
drop table if exists public.old_feature cascade;
```

## Migration Best Practices

### DO ✅

- **Always** test migrations locally first
- **Always** create a rollback migration
- **Always** enable RLS on new tables
- Use transactions when possible (`begin; ... commit;`)
- Use `if exists` and `if not exists` for idempotency
- Add indexes `CONCURRENTLY` on large tables
- Document breaking changes
- Take backups before major migrations
- Monitor error rates after deployment

### DON'T ❌

- Never delete migration files
- Never edit applied migration files (create a new one instead)
- Never drop columns without a two-phase deploy
- Never deploy migrations during peak traffic
- Never skip testing on staging
- Never deploy without a rollback plan
- Never modify RLS policies without testing tenant isolation

## Troubleshooting

### "relation already exists"

Your migration isn't idempotent. Use:
```sql
create table if not exists public.my_table (...);
```

### "column does not exist"

Application code deployed before migration. Apply migration first, then deploy code.

### Migration taking too long

For large tables, consider:
- Using `CONCURRENTLY` for index creation
- Running during low-traffic periods
- Breaking into smaller migrations

### RLS policy not working

Check:
1. RLS is enabled: `alter table public.my_table enable row level security;`
2. Policy uses correct JWT claim: `auth.jwt() ->> 'tenant_id'`
3. JWT is being passed in requests
4. Test with RLS test suite

## Monitoring Migrations

After applying a migration, monitor:

- **Error rate**: Should not increase
- **Response time**: Should not degrade significantly
- **Database CPU/Memory**: Watch for spikes
- **Lock waits**: Check `pg_stat_activity` for blocked queries
- **Application logs**: Look for new errors

Query to check for locks:
```sql
select
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
from pg_stat_activity
where cardinality(pg_blocking_pids(pid)) > 0;
```

## Emergency Contacts

If migration goes wrong:

1. **Technical lead**: [Contact info]
2. **Database admin**: [Contact info]
3. **On-call engineer**: [PagerDuty/Oncall link]

## References

- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- Internal: `docs/RLS_MATRIX.md`
