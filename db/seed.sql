-- Sample data for SnapSell MVP
-- Assumes schema.sql has been applied

truncate table public.sales cascade;
truncate table public.stock_movements cascade;
truncate table public.inventory_lots cascade;
truncate table public.purchase_allocations cascade;
truncate table public.purchase_lines cascade;
truncate table public.purchases cascade;
truncate table public.items cascade;
truncate table public.variants cascade;
truncate table public.products cascade;
truncate table public.channel_listings cascade;
truncate table public.relist_tasks cascade;
truncate table public.delist_tasks cascade;

-- Product + variants
insert into public.products (id, owner_id, sku, title, brand, category, rrp, target_margin_pct)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '11111111-1111-1111-1111-111111111111',
  'SS-PRO-001',
  'Nintendo Switch Console',
  'Nintendo',
  'Gaming',
  279.99,
  0.4
);

insert into public.variants (id, product_id, variant_sku, expected_resale)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'SS-0001', 199.99),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'SS-0002', 219.99);

insert into public.items (id, owner_id, title, product_id, variant_id, status, price_mid)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Nintendo Switch Console', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'ready', 199.99);

-- Purchase + allocation + stock
insert into public.purchases (id, owner_id, supplier, ref, subtotal, shipping_cost, duties_cost, other_cost, status, recovery_mode, recovery_target)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'UK Pallet Co',
  'PAL-778',
  800,
  120,
  60,
  20,
  'received',
  'allocate_recovery',
  1200
);

insert into public.purchase_lines (id, purchase_id, variant_id, qty, declared_unit_cost)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 5, 100),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 3, 105);

insert into public.purchase_allocations (id, purchase_id, method, snapshot)
values (
  'ffffffff-ffff-ffff-ffff-fffffffffff1',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'units',
  '{"lines":[{"purchase_line_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1","unit_cogs":110},{"purchase_line_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2","unit_cogs":115}]}'::jsonb
);

insert into public.inventory_lots (id, owner_id, variant_id, purchase_id, purchase_line_id, qty_received, qty_remaining, unit_cogs)
values
  ('11112222-3333-4444-5555-666677778888', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 5, 4, 110),
  ('88887777-6666-5555-4444-333322221111', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 3, 3, 115);

insert into public.stock_movements (id, owner_id, variant_id, qty, reason, ref)
values
  ('99999999-aaaa-bbbb-cccc-ddddeeeeffff', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 5, 'purchase', 'PAL-778'),
  ('ffffeeee-dddd-cccc-bbbb-aaaabbbbcccc', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 3, 'purchase', 'PAL-778'),
  ('12345678-90ab-cdef-1234-567890abcdef', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', -1, 'sale', 'EB12345');

-- Sale consuming FIFO lot
insert into public.sales (id, owner_id, platform, order_id, variant_id, qty, sale_price, fees, shipping_cost, other_costs, cogs, lot_id, sold_at)
values (
  '12121212-3434-5656-7878-909090909090',
  '11111111-1111-1111-1111-111111111111',
  'ebay',
  'EB12345',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  1,
  199.99,
  20.5,
  4.99,
  0,
  110,
  '11112222-3333-4444-5555-666677778888',
  now()
);
