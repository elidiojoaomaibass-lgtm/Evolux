-- Adiciona colunas para guardar os Pixel IDs na conta do utilizador
-- Correr no Supabase Dashboard → SQL Editor

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT;
