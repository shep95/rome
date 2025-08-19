-- SECURITY FIX: Add proper RLS policy to security_honeypot table
-- This table is a security monitoring honeypot and should be completely inaccessible to all users
-- Any access attempt should be logged as a potential security breach

-- Create a restrictive policy that denies all access to the security_honeypot table
-- This will eliminate the "RLS Enabled No Policy" warning
CREATE POLICY "Security honeypot - deny all access" 
ON public.security_honeypot 
FOR ALL 
TO public
USING (false)
WITH CHECK (false);

-- Add a comment to explain the purpose of this table
COMMENT ON TABLE public.security_honeypot IS 'Security monitoring honeypot - any access attempts are logged as potential security breaches';