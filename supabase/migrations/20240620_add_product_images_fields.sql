-- Migration: add order column and index to product_images
-- Run after initial product_images creation
alter table product_images
  drop constraint if exists product_images_product_id_key, -- remove unique if present
  add column "order" int default 0;

create index if not exists idx_product_images_product_id on product_images (product_id);
