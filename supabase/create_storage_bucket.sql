-- RUN THIS IN THE SUPABASE SQL EDITOR
-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to view images
DROP POLICY IF EXISTS "product_images_public_access" ON storage.objects;
CREATE POLICY "product_images_public_access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 3. Allow authenticated users to upload images
DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
CREATE POLICY "product_images_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow users to update/delete their own uploads
DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
CREATE POLICY "product_images_auth_update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' AND auth.uid() = owner );

DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
CREATE POLICY "product_images_auth_delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' AND auth.uid() = owner );
