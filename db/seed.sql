-- Minimal seed data for local testing
insert into public.items (id, owner_id, title, status)
values ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Demo Jacket', 'draft')
on conflict do nothing;

insert into public.products (id, owner_id, sku, title, category, target_margin_pct)
values ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'SKU-100', 'Demo Jacket', 'apparel', 0.35)
on conflict do nothing;

insert into public.variants (id, product_id, variant_sku, attrs, expected_resale)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'SKU-100-RED-M',
  jsonb_build_object('color', 'Red', 'size', 'Medium'),
  120
)
on conflict do nothing;

insert into public.purchases (id, owner_id, supplier, ref, subtotal, shipping_cost, status)
values (
  '40000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Demo Supplier',
  'PO-1',
  300,
  20,
  'received'
)
on conflict do nothing;

insert into public.purchase_lines (id, purchase_id, variant_id, qty, declared_unit_cost, weight_per_unit, declared_value)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    2,
    80,
    1.2,
    160
  )
on conflict do nothing;

insert into public.inventory_lots (id, variant_id, purchase_id, purchase_line_id, qty_received, qty_remaining, unit_cogs)
values (
  '60000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  2,
  2,
  90
)
on conflict do nothing;

insert into public.sales (id, owner_id, platform, order_id, variant_id, qty, sale_price, shipping_paid_by_buyer, fees, shipping_cost, sold_at)
values (
  '70000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'ebay',
  'EB-1',
  '30000000-0000-0000-0000-000000000001',
  1,
  150,
  5,
  15,
  8,
  now()
)
on conflict do nothing;

insert into public.channel_listings (id, owner_id, variant_id, platform, platform_listing_id, status, last_synced_qty)
values (
  '80000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '30000000-0000-0000-0000-000000000001',
  'ebay',
  'OFFER-123',
  'active',
  1
)
on conflict do nothing;
