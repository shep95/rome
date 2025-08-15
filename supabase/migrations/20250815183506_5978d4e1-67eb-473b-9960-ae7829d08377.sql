-- Fix the function to have proper search path
CREATE OR REPLACE FUNCTION public.user_can_access_file(file_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_user_id uuid;
  conversation_file_url text;
BEGIN
  -- Extract user ID from file path (format: user_id/timestamp_filename.ext)
  file_user_id := split_part(file_path, '/', 1)::uuid;
  
  -- Check if the file is referenced in any messages in conversations where the current user is a participant
  SELECT file_url INTO conversation_file_url
  FROM public.messages m
  JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE m.file_url LIKE '%' || file_path || '%'
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  LIMIT 1;
  
  -- Return true if file is found in user's conversations or if user owns the file
  RETURN conversation_file_url IS NOT NULL OR file_user_id = auth.uid();
END;
$$;