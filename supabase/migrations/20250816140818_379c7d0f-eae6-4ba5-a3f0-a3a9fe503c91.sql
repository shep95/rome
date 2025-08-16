-- Add strict RLS policies for storage.objects to prevent admin access to secure files
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Secure files access control" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own secure files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own secure files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own secure files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own secure files" ON storage.objects;

-- Create strict policies for secure-files bucket
CREATE POLICY "Users can view own secure files"
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can upload own secure files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own secure files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own secure files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Allow public access to public buckets (avatars, wallpapers)
CREATE POLICY "Public bucket access for avatars"
ON storage.objects
FOR ALL
USING (bucket_id = 'avatars');

CREATE POLICY "Public bucket access for wallpapers"
ON storage.objects
FOR ALL
USING (bucket_id = 'wallpapers');