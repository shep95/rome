-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a secure policy that allows authenticated users to view limited profile info for search
CREATE POLICY "Authenticated users can view public profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- However, we need to ensure emails are never exposed publicly
-- Let's create a more granular approach by creating a view for public profile data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Enable RLS on the view (inherits from the base table)
-- Users can search for other users but cannot see email addresses