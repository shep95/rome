-- Fix Security Issue #1: Strengthen profiles table RLS policies
-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create stronger RLS policies for profiles table
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND auth.role() = 'authenticated')
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Prevent deletion of profiles
CREATE POLICY "Profiles cannot be deleted"
ON public.profiles
FOR DELETE
USING (false);

-- Fix Security Issue #2: Strengthen call_history table RLS policies
-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Users can manage their own call history" ON public.call_history;

-- Create separate policies for each operation
CREATE POLICY "Users can view their own call history"
ON public.call_history
FOR SELECT
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own call history"
ON public.call_history
FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own call history"
ON public.call_history
FOR UPDATE
USING (auth.uid() = user_id AND auth.role() = 'authenticated')
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call history"
ON public.call_history
FOR DELETE
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Fix Security Issue #3: Secure updates table
-- Enable RLS on updates table
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to view updates
CREATE POLICY "Authenticated users can view updates"
ON public.updates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only allow admin users to manage updates (assuming admin role exists)
-- For now, restrict to specific user IDs - replace with actual admin mechanism
CREATE POLICY "Only authorized users can manage updates"
ON public.updates
FOR ALL
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email IN ('admin@yourapp.com') -- Replace with actual admin emails
  )
);

-- Add additional security constraints
-- Ensure all sensitive operations require authentication
CREATE OR REPLACE FUNCTION public.check_authenticated()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.role() = 'authenticated' AND auth.uid() IS NOT NULL;
END;
$$;

-- Add audit logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the operation (you can expand this to write to an audit table)
  RAISE LOG 'Sensitive operation on table % by user %', TG_TABLE_NAME, auth.uid();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_operation();

DROP TRIGGER IF EXISTS audit_call_history_trigger ON public.call_history;
CREATE TRIGGER audit_call_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.call_history
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_operation();