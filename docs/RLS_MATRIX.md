# RLS Coverage

| Table            | RLS Enabled | Policies |
| ---------------- | ----------- | -------- |
| tenants          | ✅          | tenants_isolation |
| users            | ✅          | users_isolation |
| channels         | ✅          | channels_isolation_select, channels_isolation_write |
| items            | ✅          | items_isolation_select, items_isolation_write |
| listings         | ✅          | listings_isolation_select, listings_isolation_write |
| pricing_events   | ✅          | pricing_events_isolation_select, pricing_events_isolation_write |
| job_events       | ✅          | job_events_isolation_select, job_events_isolation_write |
