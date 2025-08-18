-- Fix the public_profiles view to not be SECURITY DEFINER
-- and ensure it properly respects RLS policies
DROP VIEW IF EXISTS public.public_profiles;

-- Create a more secure approach: Update the existing policy to be more restrictive
-- Remove the current authenticated policy that still allows access to email
DROP POLICY IF EXISTS "Authenticated users can view public profile info" ON public.profiles;

-- Create a policy that allows authenticated users to view only non-sensitive profile info
-- But we need to handle this differently since we can't filter columns in RLS policies

-- Instead, let's create a secure function for user search that doesn't expose emails
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

-- Create a restrictive policy that only allows users to view their own full profile
CREATE POLICY "Users can only view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);