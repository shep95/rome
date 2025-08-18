-- CRITICAL SECURITY FIX: Secure the user_search table that currently exposes all user emails publicly
-- This table has no RLS policies and allows public access to sensitive user data

-- First, enable RLS on the user_search table
ALTER TABLE public.user_search ENABLE ROW LEVEL SECURITY;

-- Create a restrictive policy that only allows authenticated users to view their own data
-- This prevents public access to email addresses and personal information
CREATE POLICY "Users can only view their own search data" 
ON public.user_search 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Alternatively, if this table is not being used actively in the application,
-- we should consider dropping it entirely for security.
-- However, for now we'll secure it with RLS policies to maintain functionality.

-- Also ensure no one can insert, update, or delete from this table without proper authorization
CREATE POLICY "Restrict user_search modifications" 
ON public.user_search 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);