-- CRITICAL SECURITY FIX: Remove the insecure user_search view that exposes all user emails publicly
-- This view has no RLS policies and allows public access to sensitive user data including emails

-- Drop the insecure user_search view completely
DROP VIEW IF EXISTS public.user_search;

-- Ensure we have the secure search_profiles function as the replacement
-- This function only returns non-sensitive profile data and requires authentication
-- (The function was already created in previous migrations, this is just to ensure it exists)

-- Verify the search_profiles function exists and is properly secured
DO $$
BEGIN
  -- Check if function exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'search_profiles'
  ) THEN
    -- Create the secure function if it doesn't exist
    CREATE FUNCTION public.search_profiles(search_term text DEFAULT '')
    RETURNS TABLE (
      id uuid,
      username text,
      display_name text,
      avatar_url text
    )
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    SET search_path = public
    AS $$
      SELECT 
        p.id,
        p.username,
        p.display_name,
        p.avatar_url
      FROM public.profiles p
      WHERE 
        auth.role() = 'authenticated' AND
        (
          search_term = '' OR
          LOWER(p.username) LIKE LOWER('%' || search_term || '%') OR
          LOWER(p.display_name) LIKE LOWER('%' || search_term || '%')
        )
      ORDER BY p.display_name, p.username
      LIMIT 50;
    $$;
  END IF;
END $$;