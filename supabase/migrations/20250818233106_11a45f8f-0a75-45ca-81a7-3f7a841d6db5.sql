-- SECURITY FIX: Change ownership of views from postgres (superuser) to authenticator
-- Views owned by postgres have implicit SECURITY DEFINER behavior which bypasses RLS
-- We need to change ownership to a non-superuser role

-- Change ownership of the views to the authenticator role
-- This removes the implicit SECURITY DEFINER behavior
ALTER VIEW public.messages_safe OWNER TO authenticator;
ALTER VIEW public.secure_files_safe OWNER TO authenticator;