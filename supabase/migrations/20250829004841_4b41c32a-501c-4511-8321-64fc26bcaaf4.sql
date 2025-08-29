-- Fix Security Issue #1: Strengthen profiles table RLS policies
-- Replace existing policy with stronger version
DROP POLICY IF EXISTS "Secure user profile access" ON public.profiles;
CREATE POLICY "Secure user profile access"
ON public.profiles
FOR SELECT
USING (auth.uid() = id AND auth.role() = 'authenticated');

-- Strengthen existing update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND auth.role() = 'authenticated')
WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Strengthen existing insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Prevent profile deletion
CREATE POLICY "Profiles cannot be deleted"
ON public.profiles
FOR DELETE
USING (false);

-- Fix Security Issue #2: Strengthen call_history table RLS policies
-- Replace existing policies with stronger versions
DROP POLICY IF EXISTS "Users can view their own call history" ON public.call_history;
CREATE POLICY "Users can view their own call history only"
ON public.call_history
FOR SELECT
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own call history" ON public.call_history;
CREATE POLICY "Users can insert their own call history only"
ON public.call_history
FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own call history" ON public.call_history;
CREATE POLICY "Users can update their own call history only"
ON public.call_history
FOR UPDATE
USING (auth.uid() = user_id AND auth.role() = 'authenticated')
WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own call history" ON public.call_history;
CREATE POLICY "Users can delete their own call history only"
ON public.call_history
FOR DELETE
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Fix Security Issue #3: Secure updates table
-- Keep existing view policy but rename for clarity
DROP POLICY IF EXISTS "Updates are viewable by authenticated users" ON public.updates;
CREATE POLICY "Authenticated users can view active updates"
ON public.updates
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true AND expires_at > now());

-- Add admin-only modification policies (restrict to service role for now)
CREATE POLICY "Only service role can modify updates"
ON public.updates
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the operation for security monitoring
  RAISE LOG 'Security audit: % operation on table % by user %', TG_OP, TG_TABLE_NAME, auth.uid();
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

DROP TRIGGER IF EXISTS audit_updates_trigger ON public.updates;
CREATE TRIGGER audit_updates_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.updates
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_operation();