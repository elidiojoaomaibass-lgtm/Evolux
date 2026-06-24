-- Migration: add storage policies for product images bucket
-- Ensure bucket is created in Supabase UI (e.g., product-images)
-- Policies allow authenticated users to upload and public read access

-- Allow authenticated users to upload
CREATE POLICY "allow upload"
ON storage.objects
FOR INSERT
USING (auth.role() = 'authenticated');

-- Allow public read (anyone can download files)
CREATE POLICY "public read"
ON storage.objects
FOR SELECT
USING (true);
