# Database setup

1. Open the Supabase SQL editor for your project.
2. Run `schema.sql` to create all tables, views, and RLS policies. The script assumes the `uuid-ossp` and `pgcrypto` extensions are available (enabled by default in Supabase).
3. Run `seed.sql` to load the example data set (one product with two variants, a purchase with allocations, and a sale consuming FIFO lots).

The schema enforces Row Level Security on every user-facing table. Policies scope rows to `auth.uid()` so each merchant only sees their own catalogue, inventory movements, purchases, and tasks.
