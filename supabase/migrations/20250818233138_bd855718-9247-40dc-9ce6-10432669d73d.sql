-- SECURITY FIX: Remove problematic SECURITY DEFINER views entirely
-- Since we cannot change ownership and these views bypass RLS due to postgres ownership,
-- we'll remove them completely as they pose a security risk

-- These views were likely created for debugging/monitoring but they bypass RLS policies
-- Applications should query the actual tables (messages, secure_files) directly
-- which will properly enforce RLS policies

DROP VIEW IF EXISTS public.messages_safe;
DROP VIEW IF EXISTS public.secure_files_safe;

-- Note: If these views are needed for the application, they would need to be recreated
-- by a non-superuser role or with proper RLS enforcement mechanisms