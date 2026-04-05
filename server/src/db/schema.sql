-- =============================================
-- PLATFORM LEVEL
-- =============================================

create table if not exists super_admins (
  id          text primary key default 'sa_' || gen_random_uuid(),
  email       text unique not null,
  password    text not null,
  created_at  timestamptz default now()
);

create table if not exists tenants (
  id          text primary key default 'tenant_' || gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  email       text unique not null,
  plan        text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  status      text not null default 'trial' check (status in ('active', 'trial', 'suspended', 'cancelled')),
  trial_ends_at timestamptz,
  created_at  timestamptz default now()
);

create table if not exists tenant_settings (
  id          text primary key default 'ts_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  currency    text not null default 'LKR',
  tax_rate    numeric(5,4) not null default 0,
  store_name  text,
  timezone    text default 'Asia/Colombo',
  unique(tenant_id)
);

create table if not exists subscriptions (
  id          text primary key default 'sub_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  plan        text not null default 'starter',
  status      text not null default 'trial',
  amount      numeric(10,2) default 0,
  started_at  timestamptz default now(),
  renews_at   timestamptz,
  created_at  timestamptz default now()
);

-- =============================================
-- TENANT LEVEL (all have tenant_id FK)
-- =============================================

create table if not exists users (
  id          text primary key default 'u_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  name        text not null,
  email       text not null,
  password    text not null,
  role        text not null default 'cashier' check (role in ('admin', 'manager', 'cashier')),
  created_at  timestamptz default now(),
  unique(tenant_id, email)
);

create table if not exists categories (
  id          text primary key default 'c_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists products (
  id          text primary key default 'p_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  name        text not null,
  sku         text,
  price       numeric(10,2) not null default 0,
  stock       integer not null default 0,
  category_id text references categories(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists customers (
  id          text primary key default 'cu_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  created_at  timestamptz default now()
);

create table if not exists sales (
  id          text primary key default 's_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  customer_id text references customers(id) on delete set null,
  subtotal    numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  items_count integer not null default 0,
  payment_method text not null default 'cash',
  payment_paid   numeric(10,2) not null default 0,
  created_at  timestamptz default now()
);

create table if not exists sale_items (
  id          text primary key default 'si_' || gen_random_uuid(),
  sale_id     text not null references sales(id) on delete cascade,
  tenant_id   text not null references tenants(id) on delete cascade,
  product_id  text references products(id) on delete set null,
  name        text not null,
  price       numeric(10,2) not null,
  quantity    integer not null default 1
);

create table if not exists inventory_logs (
  id          text primary key default 'il_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  product_id  text references products(id) on delete set null,
  type        text not null check (type in ('set', 'adjust', 'sale', 'purchase')),
  delta       integer not null,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists purchases (
  id          text primary key default 'pu_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  supplier    text,
  total       numeric(10,2) not null default 0,
  items       jsonb not null default '[]',
  created_at  timestamptz default now()
);

create table if not exists expenses (
  id          text primary key default 'ex_' || gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete cascade,
  title       text not null,
  amount      numeric(10,2) not null default 0,
  notes       text,
  created_at  timestamptz default now()
);

-- =============================================
-- INDEXES for tenant_id lookups (important for performance)
-- =============================================

create index if not exists idx_users_tenant         on users(tenant_id);
create index if not exists idx_categories_tenant    on categories(tenant_id);
create index if not exists idx_products_tenant      on products(tenant_id);
create index if not exists idx_customers_tenant     on customers(tenant_id);
create index if not exists idx_sales_tenant         on sales(tenant_id);
create index if not exists idx_sale_items_tenant    on sale_items(tenant_id);
create index if not exists idx_sale_items_sale      on sale_items(sale_id);
create index if not exists idx_purchases_tenant     on purchases(tenant_id);
create index if not exists idx_expenses_tenant      on expenses(tenant_id);
create index if not exists idx_inventory_logs_tenant on inventory_logs(tenant_id);
create index if not exists idx_subscriptions_tenant on subscriptions(tenant_id);

-- =============================================
-- SEED DATA
-- =============================================

insert into super_admins (id, email, password) values
  ('sa_1', 'superadmin@posplatform.com', 'superadmin123')
on conflict (email) do nothing;

insert into tenants (id, name, slug, email, plan, status) values
  ('tenant_demo', 'Demo Store', 'demo', 'owner@demo.com', 'pro', 'active')
on conflict (id) do nothing;

insert into tenant_settings (tenant_id, currency, tax_rate, store_name) values
  ('tenant_demo', 'LKR', 0, 'Demo Store')
on conflict (tenant_id) do nothing;

insert into subscriptions (id, tenant_id, plan, status, amount) values
  ('sub_demo', 'tenant_demo', 'pro', 'active', 29.99)
on conflict (id) do nothing;

insert into users (id, tenant_id, name, email, password, role) values
  ('u_admin', 'tenant_demo', 'Demo Admin', 'admin@example.com', 'admin', 'admin')
on conflict (tenant_id, email) do nothing;

insert into categories (id, tenant_id, name) values
  ('c_general', 'tenant_demo', 'General'),
  ('c_bev', 'tenant_demo', 'Beverages')
on conflict (id) do nothing;

insert into products (id, tenant_id, name, sku, price, stock, category_id) values
  ('p_item_a', 'tenant_demo', 'Item A', 'A-001', 250, 20, 'c_general'),
  ('p_item_b', 'tenant_demo', 'Item B', 'B-001', 450, 12, 'c_bev'),
  ('p_item_c', 'tenant_demo', 'Item C', 'C-001', 120, 35, 'c_general')
on conflict (id) do nothing;
