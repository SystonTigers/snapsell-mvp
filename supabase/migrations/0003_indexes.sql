-- Performance indexes for SnapSell MVP
-- These indexes improve query performance for common operations

-- Tenant ID indexes (used in virtually every query due to RLS)
create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_channels_tenant_id on public.channels(tenant_id);
create index if not exists idx_items_tenant_id on public.items(tenant_id);
create index if not exists idx_listings_tenant_id on public.listings(tenant_id);
create index if not exists idx_pricing_events_tenant_id on public.pricing_events(tenant_id);
create index if not exists idx_job_events_tenant_id on public.job_events(tenant_id);

-- Foreign key indexes (improve join performance)
create index if not exists idx_listings_item_id on public.listings(item_id);
create index if not exists idx_listings_channel_id on public.listings(channel_id);
create index if not exists idx_pricing_events_item_id on public.pricing_events(item_id);
create index if not exists idx_job_events_channel_id on public.job_events(channel_id);

-- Status indexes (frequently filtered)
create index if not exists idx_channels_status on public.channels(tenant_id, status);
create index if not exists idx_items_status on public.items(tenant_id, status);
create index if not exists idx_listings_status on public.listings(tenant_id, status);

-- Timestamp indexes (for sorting and filtering recent records)
create index if not exists idx_items_created_at on public.items(tenant_id, created_at desc);
create index if not exists idx_listings_created_at on public.listings(tenant_id, created_at desc);
create index if not exists idx_pricing_events_created_at on public.pricing_events(tenant_id, created_at desc);
create index if not exists idx_job_events_created_at on public.job_events(tenant_id, created_at desc);

-- Composite index for listing by item (common query pattern)
create index if not exists idx_listings_tenant_item on public.listings(tenant_id, item_id);

-- Composite index for job events by channel and status
create index if not exists idx_job_events_channel_status on public.job_events(tenant_id, channel_id, status);

-- User email lookup (for authentication)
create index if not exists idx_users_email on public.users(email);

-- Add comments for documentation
comment on index idx_users_tenant_id is 'Speeds up RLS policy checks for users table';
comment on index idx_channels_tenant_id is 'Speeds up RLS policy checks for channels table';
comment on index idx_items_tenant_id is 'Speeds up RLS policy checks for items table';
comment on index idx_listings_tenant_id is 'Speeds up RLS policy checks for listings table';
