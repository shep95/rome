-- Create security helper functions to avoid policy conflicts
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN auth.role() = 'authenticated' AND auth.uid() IS NOT NULL;
END;
$$;

-- Create admin check function (restrict system updates to service role only)
CREATE OR REPLACE FUNCTION public.is_service_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'service_role';
END;
$$;

-- Add restrictive policies for updates table modifications
-- These will work alongside existing view policy
CREATE POLICY "Service role only can insert updates"
ON public.updates
FOR INSERT
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service role only can update updates"
ON public.updates
FOR UPDATE
USING (public.is_service_admin())
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service role only can delete updates"
ON public.updates
FOR DELETE
USING (public.is_service_admin());

-- Add audit logging for security events
CREATE OR REPLACE FUNCTION public.audit_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log security-sensitive operations
  RAISE LOG 'SECURITY AUDIT: % on table % by user % at %', 
    TG_OP, TG_TABLE_NAME, COALESCE(auth.uid()::text, 'anonymous'), now();
  
  -- For high-risk operations, add extra logging
  IF TG_TABLE_NAME IN ('profiles', 'call_history', 'user_keys', 'password_security') THEN
    RAISE LOG 'HIGH RISK: % operation on sensitive table % by user %', 
      TG_OP, TG_TABLE_NAME, COALESCE(auth.uid()::text, 'anonymous');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers (if not already exist)
DROP TRIGGER IF EXISTS security_audit_profiles ON public.profiles;
CREATE TRIGGER security_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_security_event();

DROP TRIGGER IF EXISTS security_audit_call_history ON public.call_history;
CREATE TRIGGER security_audit_call_history
  AFTER INSERT OR UPDATE OR DELETE ON public.call_history
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_security_event();

-- Add function to check if profile data access is legitimate
CREATE OR REPLACE FUNCTION public.validate_profile_access(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Only allow access to own profile data
  RETURN auth.uid() = profile_user_id AND public.is_authenticated_user();
END;
$$;

-- Add function to validate call history access
CREATE OR REPLACE FUNCTION public.validate_call_history_access(history_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Only allow access to own call history
  RETURN auth.uid() = history_user_id AND public.is_authenticated_user();
END;
$$;