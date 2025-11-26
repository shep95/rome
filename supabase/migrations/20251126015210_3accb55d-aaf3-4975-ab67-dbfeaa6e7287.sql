-- Security: Create a secure PIN reset function that can only be called by the user themselves
-- This function will:
-- 1. Delete all secure files and related data for the authenticated user
-- 2. Update their security code
-- Note: This should only work for the authenticated user (not arbitrary usernames)

CREATE OR REPLACE FUNCTION public.reset_secure_files_and_pin(new_pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
  deleted_files_count INT;
  deleted_tags_count INT;
  deleted_folders_count INT;
BEGIN
  -- Get the authenticated user's ID
  user_uuid := auth.uid();
  
  -- Validate user is authenticated
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Validate PIN format (4 digits)
  IF new_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;
  
  -- Delete file tags
  DELETE FROM public.file_tags WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_tags_count = ROW_COUNT;
  
  -- Delete secure files
  DELETE FROM public.secure_files WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_files_count = ROW_COUNT;
  
  -- Delete folders
  DELETE FROM public.file_folders WHERE user_id = user_uuid;
  GET DIAGNOSTICS deleted_folders_count = ROW_COUNT;
  
  -- Update security code in auth.users metadata
  -- Note: This updates the raw_user_meta_data which is what the app uses
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('security_code', new_pin)
  WHERE id = user_uuid;
  
  -- Return summary
  RETURN json_build_object(
    'success', true,
    'deleted_files', deleted_files_count,
    'deleted_tags', deleted_tags_count,
    'deleted_folders', deleted_folders_count,
    'message', 'All secure files cleared and PIN updated successfully'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_secure_files_and_pin(TEXT) TO authenticated;

COMMENT ON FUNCTION public.reset_secure_files_and_pin IS 'Allows authenticated users to reset their secure files and update their security PIN';
