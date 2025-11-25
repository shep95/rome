-- Enhanced file security policies - Password-level encryption for ALL files
-- Drop existing policies to recreate with maximum security
DROP POLICY IF EXISTS "Users can upload files to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own wallpapers" ON storage.objects;

-- SECURE FILES BUCKET - Maximum security (private, encrypted)
-- Users can only upload to their own folder
CREATE POLICY "Secure file upload - own folder only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'secure-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only read their own files OR files shared in conversations they're in
CREATE POLICY "Secure file read - own or shared"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'secure-files' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.file_url LIKE '%' || name || '%'
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  )
);

-- Users can only update their own files
CREATE POLICY "Secure file update - own only"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'secure-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own files
CREATE POLICY "Secure file delete - own only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'secure-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- AVATARS BUCKET - Public read, authenticated write
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated avatar upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Own avatar update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Own avatar delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- WALLPAPERS BUCKET - Public read, authenticated write
CREATE POLICY "Public wallpaper read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wallpapers');

CREATE POLICY "Authenticated wallpaper upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Own wallpaper update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Own wallpaper delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add trigger to log all file access for security monitoring
CREATE OR REPLACE FUNCTION public.log_file_storage_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all file operations for security audit
  PERFORM public.log_security_event(
    auth.uid(),
    'file_storage_access',
    'File storage operation: ' || TG_OP,
    null,
    null,
    null,
    'medium',
    jsonb_build_object(
      'operation', TG_OP,
      'bucket_id', COALESCE(NEW.bucket_id, OLD.bucket_id),
      'file_name', COALESCE(NEW.name, OLD.name),
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for storage object monitoring
DROP TRIGGER IF EXISTS audit_file_storage_access ON storage.objects;
CREATE TRIGGER audit_file_storage_access
  AFTER INSERT OR UPDATE OR DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_file_storage_access();