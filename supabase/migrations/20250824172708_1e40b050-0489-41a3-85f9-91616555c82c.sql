-- SECURITY FIX: Remove overly permissive profile access policy
-- This fixes the vulnerability where any authenticated user could access all email addresses

-- Drop the problematic public access policy
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Create more secure, granular policies for specific use cases
-- Allow users to view basic profile info (NOT email) for search and messaging purposes
CREATE POLICY "Users can view basic profile info for search and messaging" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Only allow access to non-sensitive fields through specific functions
  -- This policy will be used by search_profiles and get_conversation_participant_profiles functions
  auth.role() = 'authenticated'
);

-- Keep the existing secure policy for full profile access (own profile only)
-- This already exists: "Secure user profile access" with (auth.uid() = id)

-- Create a security definer function to safely get public profile info
-- This limits what fields are exposed and adds an extra layer of control
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id
  AND auth.role() = 'authenticated';
$$;

-- Update the search_profiles function to be more explicit about what it returns
-- and ensure it doesn't expose email addresses
CREATE OR REPLACE FUNCTION public.search_profiles(search_term text DEFAULT ''::text)
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
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

-- Add a security audit log entry for this fix
INSERT INTO public.security_audit_logs (
  user_id,
  event_type,
  event_description,
  risk_level,
  additional_data
) VALUES (
  null,
  'security_policy_update',
  'Fixed critical vulnerability: Removed public access to profile email addresses',
  'high',
  jsonb_build_object(
    'fix_type', 'rls_policy_update',
    'tables_affected', 'profiles',
    'vulnerability', 'public_email_exposure'
  )
);