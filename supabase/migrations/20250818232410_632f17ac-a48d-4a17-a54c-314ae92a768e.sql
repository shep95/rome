-- Fix the search path for the function to address security warning
CREATE OR REPLACE FUNCTION public.search_profiles(search_term text DEFAULT '')
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