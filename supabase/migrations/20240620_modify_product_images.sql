create extension if not exists pgcrypto;

-- If the table already exists with a unique constraint on product_id, we alter it.
-- First, drop the unique constraint if present.
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_images_product_id_key' AND table_name = 'product_images') THEN
       ALTER TABLE product_images DROP CONSTRAINT product_images_product_id_key;
   END IF;
END $$;

-- Add missing columns if they do not exist.
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS "order" int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure created_at uses timestamp with time zone (if not already).
ALTER TABLE product_images
  ALTER COLUMN created_at SET DATA TYPE timestamp with time zone,
  ALTER COLUMN created_at SET DEFAULT now();

-- Create index on product_id for faster lookups (if not already exists).
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
