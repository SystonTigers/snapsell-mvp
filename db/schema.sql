create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Core listing/drafts
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
  created_at timestamptz default now()
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
  item_id uuid references public.items(id) on delete cascade,
  variant_id uuid,
  platform text not null,
  status text default 'draft',
  platform_listing_id text,
  url text,
  fees_estimate numeric,
  payload_json jsonb,
  created_at timestamptz default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null, -- ebay
  oauth_json jsonb,
  created_at timestamptz default now()
);

-- Inventory & sales
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  sku text unique not null,
  title text not null,
  brand text,
  category text,
  cost numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_sku text unique not null,
  attrs jsonb,
  created_at timestamptz default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.variants(id) on delete cascade,
  qty integer not null,
  reason text not null, -- purchase|correction|sale|refund|transfer
  ref text,
  created_at timestamptz default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  platform text not null, -- ebay|vinted|gumtree|fb|manual
  order_id text,
  variant_id uuid references public.variants(id),
  qty integer not null default 1,
  sale_price numeric not null,
  shipping_paid_by_buyer numeric default 0,
  fees numeric default 0,
  shipping_cost numeric default 0,
  other_costs numeric default 0,
  cogs numeric default 0,
  sold_at timestamptz default now()
);

-- Links
alter table public.items
  add constraint fk_items_product foreign key (product_id) references public.products(id) on delete set null;
alter table public.items
  add constraint fk_items_variant foreign key (variant_id) references public.variants(id) on delete set null;
alter table public.listings
  add constraint fk_listings_variant foreign key (variant_id) references public.variants(id) on delete set null;

-- Views
create view public.vw_stock as
select
  v.id as variant_id,
  p.sku,
  v.variant_sku,
  p.title,
  coalesce(sum(sm.qty),0) as on_hand
from public.variants v
join public.products p on p.id = v.product_id
left join public.stock_movements sm on sm.variant_id = v.id
group by v.id, p.sku, v.variant_sku, p.title;

create view public.vw_profit_per_sale as
select
  s.id as sale_id,
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

-- RLS
alter table public.items enable row level security;
alter table public.media enable row level security;
alter table public.listings enable row level security;
alter table public.accounts enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;

create policy "items_owner_rw" on public.items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "media_owner_rw" on public.media
  for all using (item_id in (select id from public.items where owner_id = auth.uid()))
  with check (item_id in (select id from public.items where owner_id = auth.uid()));

create policy "listings_owner_rw" on public.listings
  for all using (item_id in (select id from public.items where owner_id = auth.uid()))
  with check (item_id in (select id from public.items where owner_id = auth.uid()));

create policy "accounts_owner_rw" on public.accounts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "products_owner_rw" on public.products
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "variants_owner_rw" on public.variants
  for all using (
    product_id in (select id from public.products where owner_id = auth.uid())
  ) with check (
    product_id in (select id from public.products where owner_id = auth.uid())
  );

create policy "stock_owner_rw" on public.stock_movements
  for all using (
    variant_id in (
      select v.id from public.variants v
      join public.products p on p.id = v.product_id
      where p.owner_id = auth.uid()
    )
  ) with check (
    variant_id in (
      select v.id from public.variants v
      join public.products p on p.id = v.product_id
      where p.owner_id = auth.uid()
    )
  );

create policy "sales_owner_rw" on public.sales
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
