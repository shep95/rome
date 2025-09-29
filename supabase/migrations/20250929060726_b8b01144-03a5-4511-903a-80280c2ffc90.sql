-- CRITICAL SECURITY FIX: Add RLS policies to prevent unauthorized access to sensitive security data

-- 1. Fix security_audit_logs table exposure
-- Enable RLS on security_audit_logs (if not already enabled)
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Add policy to prevent public access and ensure only users can see their own logs
DROP POLICY IF EXISTS "Users can only view their own audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can only view their own audit logs" 
ON public.security_audit_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Prevent all other operations except by service role
CREATE POLICY "Only service role can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update audit logs" 
ON public.security_audit_logs 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete audit logs" 
ON public.security_audit_logs 
FOR DELETE 
TO service_role
USING (true);

-- 2. Fix file_security_scans table exposure
-- Enable RLS on file_security_scans (if not already enabled)
ALTER TABLE public.file_security_scans ENABLE ROW LEVEL SECURITY;

-- Remove the overly permissive service role policy and add proper restrictions
DROP POLICY IF EXISTS "Service can manage file security scans" ON public.file_security_scans;

-- Only service role can manage scan data, no public access
CREATE POLICY "Only service role can insert scan results" 
ON public.file_security_scans 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can view scan results" 
ON public.file_security_scans 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Only service role can update scan results" 
ON public.file_security_scans 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete scan results" 
ON public.file_security_scans 
FOR DELETE 
TO service_role
USING (true);

-- 3. Fix rate_limits table exposure
-- Enable RLS on rate_limits (if not already enabled)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Remove the overly permissive service role policy and add proper restrictions
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Only service role can manage rate limits, no public access
CREATE POLICY "Only service role can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can view rate limits" 
ON public.rate_limits 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Only service role can update rate limits" 
ON public.rate_limits 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete rate limits" 
ON public.rate_limits 
FOR DELETE 
TO service_role
USING (true);

-- 4. Additional security hardening: Ensure no anonymous access to any sensitive tables
-- Revoke any public permissions that might exist
REVOKE ALL ON public.security_audit_logs FROM anon, public;
REVOKE ALL ON public.file_security_scans FROM anon, public;
REVOKE ALL ON public.rate_limits FROM anon, public;

-- Grant only necessary permissions to authenticated users
GRANT SELECT ON public.security_audit_logs TO authenticated;

-- Service role gets full access to security tables
GRANT ALL ON public.security_audit_logs TO service_role;
GRANT ALL ON public.file_security_scans TO service_role;
GRANT ALL ON public.rate_limits TO service_role;