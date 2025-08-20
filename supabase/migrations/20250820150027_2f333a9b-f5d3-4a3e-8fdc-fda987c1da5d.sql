-- Fix storage bucket policies properly by dropping ALL existing policies first
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Drop all existing policies on storage.objects
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- Create secure storage policies for avatars bucket (public read, owner write)
CREATE POLICY "Public read access for avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload to avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create secure storage policies for wallpapers bucket (public read, owner write)
CREATE POLICY "Public read access for wallpapers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wallpapers');

CREATE POLICY "Authenticated users can upload to wallpapers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'wallpapers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own wallpapers" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'wallpapers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own wallpapers" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'wallpapers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create secure storage policies for secure-files bucket (private, owner only)
CREATE POLICY "Users can access their own secure files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own secure files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own secure files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own secure files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'secure-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix rate limits table policy to restrict to service role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);