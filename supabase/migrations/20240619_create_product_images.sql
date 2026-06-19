create extension if not exists pgcrypto;
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  created_at timestamp with time zone default now(),
  unique(product_id)
);
