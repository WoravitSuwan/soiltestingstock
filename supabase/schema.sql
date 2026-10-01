-- STS Stock Management — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

create extension if not exists pgcrypto;

-- ---------- products ----------
-- รหัสสินค้า (code) is UNIQUE at the database level — the root fix for duplicate
-- product codes. id is the permanent internal key everything else links to.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit text not null default 'EA',
  unit_price numeric not null default 0,
  opening_qty numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- import_batches ----------
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in', 'out')),
  year integer not null,
  file_name text,
  row_count integer not null default 0,
  new_product_count integer not null default 0,
  imported_at timestamptz not null default now()
);

-- ---------- stock_movements ----------
-- One table for both Stock In and Stock Out rows (direction tells them apart).
-- product_code/product_name are kept as a denormalized snapshot (synced whenever a
-- product is renamed or merged) so historical rows still display correctly even if
-- product_id is later null (product deleted) — matches how the app already worked.
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_code text not null,
  product_name text not null,
  direction text not null check (direction in ('in', 'out')),
  is_opening_balance boolean not null default false,
  qty numeric not null,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  movement_date date not null,
  reference_year integer,
  source text not null default 'manual' check (source in ('manual', 'import')),
  import_batch_id uuid references import_batches(id) on delete set null,
  supplier text,
  po text,
  so_lot text,
  customer text,
  invoice text,
  so text,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_id_idx on stock_movements(product_id);
create index if not exists stock_movements_product_code_idx on stock_movements(product_code);
create index if not exists stock_movements_direction_idx on stock_movements(direction);

-- ---------- Row Level Security ----------
-- This app has its own simple login screen (not Supabase Auth), so every request from
-- the browser uses the shared anon/publishable key. Policies below allow that anon role
-- full read/write — the app's login screen is the only gate. Anyone holding the
-- publishable key could otherwise call the API directly, bypassing that login; tighten
-- this (e.g. by switching to real Supabase Auth) if that matters for your use case.
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table import_batches enable row level security;

drop policy if exists "anon full access" on products;
create policy "anon full access" on products for all to anon using (true) with check (true);

drop policy if exists "anon full access" on stock_movements;
create policy "anon full access" on stock_movements for all to anon using (true) with check (true);

drop policy if exists "anon full access" on import_batches;
create policy "anon full access" on import_batches for all to anon using (true) with check (true);

-- ---------- Realtime ----------
-- So a change made on one device/browser shows up on another without a manual refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table products;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'stock_movements'
  ) then
    alter publication supabase_realtime add table stock_movements;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'import_batches'
  ) then
    alter publication supabase_realtime add table import_batches;
  end if;
end $$;
