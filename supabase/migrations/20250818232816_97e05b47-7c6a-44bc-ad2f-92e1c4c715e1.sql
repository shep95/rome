-- SECURITY FIX: Remove SECURITY DEFINER from search_profiles function
-- The search_profiles function should run with the caller's privileges, not the definer's
-- This function doesn't need elevated privileges since it only accesses the profiles table
-- which already has proper RLS policies in place

-- Recreate the search_profiles function without SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.search_profiles(search_term text DEFAULT '')
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
-- Remove SECURITY DEFINER and search_path manipulation for security
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