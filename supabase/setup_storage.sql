-- 1. Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the store-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the avatars bucket
-- 1. Allow public to view avatars
CREATE POLICY "Public Access Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 2. Allow authenticated users to upload their own avatar
CREATE POLICY "Individual User Upload Avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Allow authenticated users to update their own avatar
CREATE POLICY "Individual User Update Avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Allow authenticated users to delete their own avatar
CREATE POLICY "Individual User Delete Avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policies for the store-assets bucket
-- 1. Allow public to view store-assets
CREATE POLICY "Public Access Assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

-- 2. Allow authenticated users to upload their own store-assets
CREATE POLICY "Individual User Upload Assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Allow authenticated users to update their own store-assets
CREATE POLICY "Individual User Update Assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
