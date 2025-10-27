-- Core multi-tenant schema for SnapSell MVP
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table public.tenants (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table public.users (
  id text primary key,
  email text not null unique,
  tenant_id text references public.tenants(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.channels (
  id text primary key,
  tenant_id text references public.tenants(id) on delete cascade,
  type text not null,
  name text not null,
  status text default 'disconnected',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.items (
  id text primary key,
  tenant_id text references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  base_price numeric,
  currency text default 'GBP',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.listings (
  id text primary key,
  tenant_id text references public.tenants(id) on delete cascade,
  item_id text references public.items(id) on delete cascade,
  channel_id text references public.channels(id) on delete cascade,
  status text default 'draft',
  payload jsonb,
  result jsonb,
  dry_run boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.pricing_events (
  id text primary key,
  tenant_id text references public.tenants(id) on delete cascade,
  item_id text references public.items(id) on delete cascade,
  source text not null,
  recommended_price numeric not null,
  notes text,
  created_at timestamptz default now()
);

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text references public.tenants(id) on delete cascade,
  channel_id text references public.channels(id) on delete set null,
  job_id text,
  action text not null,
  payload jsonb,
  result jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);
