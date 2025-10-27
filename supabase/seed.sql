-- Tenants & demo user
insert into public.tenants (id, name) values ('demo-tenant', 'Demo Tenant')
on conflict (id) do nothing;

insert into public.users (id, email, tenant_id)
values ('demo-user', 'demo@snap.sell', 'demo-tenant')
on conflict (id) do nothing;

-- Channels (e.g., eBay)
insert into public.channels (id, tenant_id, type, name, status)
values ('demo-ebay', 'demo-tenant', 'ebay', 'Demo eBay', 'disconnected')
on conflict (id) do nothing;

-- A demo item & listing
insert into public.items (id, tenant_id, title, description, base_price, currency, status)
values ('demo-item-1','demo-tenant','Nike Air Max','Lightly worn, size 9', 49.99, 'GBP', 'draft')
on conflict (id) do nothing;

insert into public.pricing_events (id, tenant_id, item_id, source, recommended_price, notes)
values ('pevt-1','demo-tenant','demo-item-1','heuristic', 54.99, 'Initial suggested price')
on conflict (id) do nothing;
