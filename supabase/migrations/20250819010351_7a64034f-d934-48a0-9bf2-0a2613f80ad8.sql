-- SECURITY FIX: Set search_path on functions to prevent Function Search Path Mutable warning
-- This prevents potential SQL injection through search_path manipulation

-- Fix search_profiles function by adding SET search_path
CREATE OR REPLACE FUNCTION public.search_profiles(search_term text DEFAULT '')
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
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