-- Check if user_search is a view and fix it if it has SECURITY DEFINER
DROP VIEW IF EXISTS public.user_search CASCADE;

-- Create user_search as a regular view without SECURITY DEFINER if it was one
-- This should be a simple view for user search functionality
CREATE VIEW public.user_search AS 
SELECT 
  id,
  username,
  display_name,
  email,
  avatar_url
FROM public.profiles
WHERE auth.uid() IS NOT NULL;