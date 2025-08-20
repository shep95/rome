-- Comprehensive Security Implementation for Military-Grade Protection

-- 1. Password Security Table (for tracking password strength and breach checks)
CREATE TABLE IF NOT EXISTS public.password_security (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash_version INTEGER DEFAULT 1,
  last_strength_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  breach_check_count INTEGER DEFAULT 0,
  last_breach_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Audit Logging Table for Security Events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'password_change', 'breach_detected', etc.
  event_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enhanced Rate Limiting Table (already exists, adding indexes)
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits(expires_at);

-- 4. Session Security Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 5. File Upload Security Table
CREATE TABLE IF NOT EXISTS public.file_security_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  scan_status TEXT CHECK (scan_status IN ('pending', 'safe', 'quarantined', 'deleted')) DEFAULT 'pending',
  scan_results JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new security tables
ALTER TABLE public.password_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_security_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Password Security
CREATE POLICY "Users can only view their own password security data" 
ON public.password_security 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own password security data" 
ON public.password_security 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own password security data" 
ON public.password_security 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Security Audit Logs (Admin or own logs only)
CREATE POLICY "Users can view their own security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- RLS Policies for User Sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for File Security Scans
CREATE POLICY "Users can view scans for their uploaded files" 
ON public.file_security_scans 
FOR SELECT 
USING (auth.uid() = uploaded_by);

-- Security Functions

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_severity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user session validity
CREATE OR REPLACE FUNCTION public.validate_user_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  session_valid BOOLEAN := FALSE;
BEGIN
  UPDATE public.user_sessions 
  SET last_activity = now()
  WHERE session_token = p_session_token 
    AND expires_at > now() 
    AND is_active = true
    AND user_id = auth.uid()
  RETURNING true INTO session_valid;
  
  RETURN COALESCE(session_valid, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate all user sessions
CREATE OR REPLACE FUNCTION public.invalidate_all_user_sessions()
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE user_id = auth.uid();
  
  -- Log the event
  PERFORM public.log_security_event(
    'all_sessions_invalidated',
    '{"reason": "user_requested"}',
    NULL,
    NULL,
    'high'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced message table security (ensure RLS is enabled)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Ensure profiles table has proper security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add message editing audit trail
CREATE TABLE IF NOT EXISTS public.message_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_content TEXT,
  new_content TEXT,
  edit_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_edit_history ENABLE ROW LEVEL SECURITY;

-- Policy for message edit history
CREATE POLICY "Users can view message edit history for messages they can access" 
ON public.message_edit_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_id AND cp.user_id = auth.uid() AND cp.left_at IS NULL
  )
);

-- Trigger to automatically clean up expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Clean up expired rate limits
  DELETE FROM public.rate_limits WHERE expires_at < now();
  
  -- Clean up old audit logs (keep last 90 days)
  DELETE FROM public.security_audit_logs 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR (last_activity < now() - INTERVAL '7 days' AND is_active = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_security_scans_file_hash ON public.file_security_scans(file_hash);

-- Initialize password security for existing users
INSERT INTO public.password_security (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.password_security);

-- Grant necessary permissions (revoke public execute on sensitive functions)
REVOKE EXECUTE ON FUNCTION public.log_security_event FROM public;
REVOKE EXECUTE ON FUNCTION public.validate_user_session FROM public;
REVOKE EXECUTE ON FUNCTION public.invalidate_all_user_sessions FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data FROM public;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_all_user_sessions TO authenticated;