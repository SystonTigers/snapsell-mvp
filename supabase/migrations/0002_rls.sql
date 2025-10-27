alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.items enable row level security;
alter table public.listings enable row level security;
alter table public.pricing_events enable row level security;
alter table public.job_events enable row level security;

create policy tenants_isolation on public.tenants
  using (id = auth.jwt() ->> 'tenant_id');

create policy users_isolation on public.users
  using (tenant_id = auth.jwt() ->> 'tenant_id');

create policy channels_isolation_select on public.channels
  for select using (tenant_id = auth.jwt() ->> 'tenant_id');
create policy channels_isolation_write on public.channels
  for all using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy items_isolation_select on public.items
  for select using (tenant_id = auth.jwt() ->> 'tenant_id');
create policy items_isolation_write on public.items
  for all using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy listings_isolation_select on public.listings
  for select using (tenant_id = auth.jwt() ->> 'tenant_id');
create policy listings_isolation_write on public.listings
  for all using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy pricing_events_isolation_select on public.pricing_events
  for select using (tenant_id = auth.jwt() ->> 'tenant_id');
create policy pricing_events_isolation_write on public.pricing_events
  for all using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy job_events_isolation_select on public.job_events
  for select using (tenant_id = auth.jwt() ->> 'tenant_id');
create policy job_events_isolation_write on public.job_events
  for all using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');
