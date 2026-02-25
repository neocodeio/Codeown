-- SQL to fix Supabase Storage CORS issues
-- Run this in your Supabase SQL Editor

-- 1. Ensure the 'images' bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'images';

-- 2. Create a policy to allow public access to images
CREATE POLICY "Public images access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 3. Create a policy to allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated'
);

-- 4. Create a policy to allow users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create a policy to allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
