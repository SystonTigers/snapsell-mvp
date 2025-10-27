create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Core capture + listing tables
-- -----------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text,
  brand text,
  model text,
  category text,
  condition text,
  color text,
  size text,
  description text,
  price_low numeric,
  price_mid numeric,
  price_high numeric,
  price_chosen numeric,
  status text default 'draft',
  product_id uuid,
  variant_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade,
  url text not null,
  exif_json jsonb,
  quality_flags jsonb,
  created_at timestamptz default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  item_id uuid references public.items(id) on delete cascade,
  variant_id uuid references public.variants(id),
  platform text not null,
  status text default 'draft',
  platform_listing_id text,
  url text,
  fees_estimate numeric,
  payload_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null,
  oauth_json jsonb,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 2. Products, variants, inventory, sales
-- -----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  sku text unique not null,
  title text not null,
  brand text,
  category text,
  rrp numeric,
  target_margin_pct numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_sku text unique not null,
  attrs jsonb,
  expected_resale numeric,
  auto_relist_facebook boolean default true,
  auto_relist_vinted boolean default true,
  auto_relist_gumtree boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.items
  add constraint fk_items_product foreign key (product_id) references public.products(id) on delete set null;

alter table public.items
  add constraint fk_items_variant foreign key (variant_id) references public.variants(id) on delete set null;

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  variant_id uuid references public.variants(id) on delete cascade,
  qty integer not null,
  reason text not null,
  ref text,
  meta jsonb,
  created_at timestamptz default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null,
  order_id text,
  variant_id uuid references public.variants(id),
  qty integer not null default 1,
  sale_price numeric not null,
  shipping_paid_by_buyer numeric default 0,
  fees numeric default 0,
  shipping_cost numeric default 0,
  other_costs numeric default 0,
  cogs numeric default 0,
  lot_id uuid references public.inventory_lots(id),
  recovery_applied numeric default 0,
  sold_at timestamptz default now(),
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 3. Purchases, allocations, recovery
-- -----------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  supplier text,
  ref text,
  subtotal numeric default 0,
  shipping_cost numeric default 0,
  duties_cost numeric default 0,
  other_cost numeric default 0,
  currency text default 'GBP',
  status text default 'draft',
  recovery_mode text default 'off',
  recovery_target numeric,
  recovered_amount numeric default 0,
  purchased_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references public.purchases(id) on delete cascade,
  variant_id uuid references public.variants(id) on delete set null,
  qty integer not null,
  declared_unit_cost numeric,
  weight_per_unit numeric,
  declared_value numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.purchase_allocations (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references public.purchases(id) on delete cascade,
  method text not null,
  snapshot jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  variant_id uuid references public.variants(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  purchase_line_id uuid references public.purchase_lines(id) on delete set null,
  qty_received integer not null,
  qty_remaining integer not null,
  unit_cogs numeric not null,
  received_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 4. Channels, tasks
-- -----------------------------------------------------------------------------
create table public.channel_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  variant_id uuid references public.variants(id) on delete cascade,
  platform text not null,
  platform_listing_id text,
  status text default 'active',
  last_synced_qty integer default 0,
  payload_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.relist_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null,
  variant_id uuid references public.variants(id) on delete cascade,
  action text not null default 'create_listing',
  template_payload jsonb,
  status text default 'pending',
  attempts integer default 0,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.delist_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null,
  variant_id uuid references public.variants(id) on delete cascade,
  platform_listing_id text,
  status text default 'pending',
  attempts integer default 0,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 5. Views
-- -----------------------------------------------------------------------------
create or replace view public.vw_stock as
select
  v.id as variant_id,
  p.sku,
  v.variant_sku,
  p.title,
  coalesce(sum(sm.qty), 0) as on_hand
from public.variants v
join public.products p on p.id = v.product_id
left join public.stock_movements sm on sm.variant_id = v.id
where sm.owner_id = p.owner_id or sm.owner_id is null
group by v.id, p.sku, v.variant_sku, p.title;

create or replace view public.vw_inventory_valuation as
select
  v.id as variant_id,
  p.sku,
  v.variant_sku,
  p.title,
  coalesce(sum(il.qty_remaining), 0) as qty_remaining,
  coalesce(sum(il.qty_remaining * il.unit_cogs), 0)::numeric as inventory_value
from public.variants v
join public.products p on p.id = v.product_id
left join public.inventory_lots il on il.variant_id = v.id
group by v.id, p.sku, v.variant_sku, p.title;

create or replace view public.vw_profit_per_sale as
select
  s.id as sale_id,
  s.owner_id,
  s.platform,
  s.order_id,
  s.variant_id,
  s.qty,
  s.sale_price,
  s.shipping_paid_by_buyer,
  s.fees,
  s.shipping_cost,
  s.other_costs,
  s.cogs,
  (s.sale_price * s.qty + s.shipping_paid_by_buyer)
    - (s.fees + s.shipping_cost + s.other_costs + s.cogs * s.qty) as profit,
  s.sold_at
from public.sales s;

create or replace view public.vw_purchase_recovery as
with landed as (
  select
    id as purchase_id,
    owner_id,
    (subtotal + shipping_cost + duties_cost + other_cost)::numeric as total_landed,
    coalesce(recovery_target, (subtotal + shipping_cost + duties_cost + other_cost)::numeric) as target
  from public.purchases
)
select
  p.id as purchase_id,
  p.owner_id,
  p.supplier,
  p.ref,
  l.total_landed,
  p.recovery_mode,
  p.recovered_amount,
  (l.target - p.recovered_amount) as remaining_to_recover,
  p.status,
  p.purchased_at
from public.purchases p
join landed l on l.purchase_id = p.id;

-- -----------------------------------------------------------------------------
-- 6. Row level security
-- -----------------------------------------------------------------------------
alter table public.items enable row level security;
alter table public.media enable row level security;
alter table public.listings enable row level security;
alter table public.accounts enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.stock_movements enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.purchase_allocations enable row level security;
alter table public.channel_listings enable row level security;
alter table public.relist_tasks enable row level security;
alter table public.delist_tasks enable row level security;

create policy items_owner on public.items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy media_owner on public.media
  for all using (item_id in (select id from public.items where owner_id = auth.uid()))
  with check (item_id in (select id from public.items where owner_id = auth.uid()));

create policy listings_owner on public.listings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy accounts_owner on public.accounts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy products_owner on public.products
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy variants_owner on public.variants
  for all using (
    product_id in (select id from public.products where owner_id = auth.uid())
  ) with check (
    product_id in (select id from public.products where owner_id = auth.uid())
  );

create policy stock_owner on public.stock_movements
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy inventory_lots_owner on public.inventory_lots
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy sales_owner on public.sales
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy purchases_owner on public.purchases
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy purchase_lines_owner on public.purchase_lines
  for all using (
    purchase_id in (select id from public.purchases where owner_id = auth.uid())
  ) with check (
    purchase_id in (select id from public.purchases where owner_id = auth.uid())
  );

create policy purchase_allocations_owner on public.purchase_allocations
  for all using (
    purchase_id in (select id from public.purchases where owner_id = auth.uid())
  ) with check (
    purchase_id in (select id from public.purchases where owner_id = auth.uid())
  );

create policy channel_listings_owner on public.channel_listings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy relist_tasks_owner on public.relist_tasks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy delist_tasks_owner on public.delist_tasks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
