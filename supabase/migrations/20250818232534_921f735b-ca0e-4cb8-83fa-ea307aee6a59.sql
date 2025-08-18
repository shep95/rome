-- CRITICAL SECURITY FIX: Remove the insecure user_search view that exposes all user emails publicly
-- This view has no RLS policies and allows public access to sensitive user data including emails

-- Drop the insecure user_search view completely
DROP VIEW IF EXISTS public.user_search;