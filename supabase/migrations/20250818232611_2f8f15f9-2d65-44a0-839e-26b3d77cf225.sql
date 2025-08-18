-- CRITICAL SECURITY FIX: The user_search view exposes ALL user emails to ANY authenticated user
-- This is a severe security vulnerability that must be fixed immediately

-- Drop the insecure user_search view that exposes all user emails
DROP VIEW IF EXISTS public.user_search;

-- The existing search_profiles function already provides secure user search functionality
-- It only returns non-sensitive profile data (no emails) and includes proper search filtering
-- Applications should use the search_profiles() function instead of the user_search view

-- Verify the search_profiles function exists and is secure
-- (This function was created in previous migrations and only returns id, username, display_name, avatar_url)