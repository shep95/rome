-- Check current policies and fix the naming conflict
DROP POLICY IF EXISTS "Users can only view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a secure function for user search that doesn't expose emails
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

-- Create the secure policy that only allows users to see their own profile
CREATE POLICY "Secure user profile access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);