-- Comprehensive Security Implementation for ROME
-- Military-grade security infrastructure

-- 1. Password Security Table
CREATE TABLE IF NOT EXISTS public.password_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL, -- bcrypt hashed passwords only
  salt TEXT NOT NULL, -- individual salt for each password
  hash_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
  hash_rounds INTEGER NOT NULL DEFAULT 12,
  last_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previous_hashes JSONB DEFAULT '[]'::jsonb, -- store last 5 password hashes to prevent reuse
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password security
ALTER TABLE public.password_security ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for password security
CREATE POLICY "Users can only access their own password security"
  ON public.password_security
  FOR ALL
  USING (auth.uid() = user_id);

-- 2. Security Audit Logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'failed_login', 'data_access', 'api_call'
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  additional_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit logs (users can only see their own logs)
CREATE POLICY "Users can only view their own audit logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. User Sessions Table for enhanced session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user sessions
CREATE POLICY "Users can only access their own sessions"
  ON public.user_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 4. File Security Scans
CREATE TABLE IF NOT EXISTS public.file_security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'clean', 'infected', 'suspicious'
  threat_detected TEXT,
  scan_results JSONB DEFAULT '{}'::jsonb,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on file security scans
ALTER TABLE public.file_security_scans ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for file security scans
CREATE POLICY "Service can manage file security scans"
  ON public.file_security_scans
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Security Functions

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_description TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_additional_data JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    ip_address,
    user_agent,
    device_fingerprint,
    risk_level,
    additional_data,
    session_id
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_description,
    p_ip_address::inet,
    p_user_agent,
    p_device_fingerprint,
    p_risk_level,
    p_additional_data,
    p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to validate user session
CREATE OR REPLACE FUNCTION public.validate_user_session(p_session_token TEXT)
RETURNS TABLE(
  user_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    (us.is_active AND us.expires_at > now()) as is_valid,
    us.expires_at
  FROM public.user_sessions us
  WHERE us.session_token = p_session_token
    AND us.is_active = true;
END;
$$;

-- Function to invalidate all user sessions (for security events)
CREATE OR REPLACE FUNCTION public.invalidate_all_user_sessions(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id;
END;
$$;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_security_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.user_sessions
  WHERE expires_at < now() AND is_active = false;
  
  -- Clean up old audit logs (keep 1 year)
  DELETE FROM public.security_audit_logs
  WHERE timestamp < now() - INTERVAL '1 year';
  
  -- Clean up expired rate limits
  DELETE FROM public.rate_limits
  WHERE expires_at < now();
END;
$$;

-- 6. Enhanced RLS Policies for existing tables

-- Ensure all critical tables have RLS enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create audit trail for message editing
CREATE OR REPLACE FUNCTION public.audit_message_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log message edits
  IF TG_OP = 'UPDATE' AND OLD.data_payload != NEW.data_payload THEN
    PERFORM public.log_security_event(
      NEW.sender_id,
      'message_edit',
      'Message content modified',
      null,
      null,
      null,
      'low',
      jsonb_build_object(
        'message_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'edit_count', NEW.edit_count
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for message audit
CREATE TRIGGER audit_message_changes
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_message_changes();

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id_timestamp 
  ON public.security_audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type 
  ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active 
  ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
  ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_security_user_id 
  ON public.password_security(user_id);

-- 8. Security permissions - revoke public access to sensitive functions
REVOKE ALL ON FUNCTION public.log_security_event FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_user_session FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invalidate_all_user_sessions FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_security_data FROM PUBLIC;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_all_user_sessions TO authenticated;

-- 9. Initialize password security for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    INSERT INTO public.password_security (user_id, password_hash, salt, hash_algorithm)
    VALUES (user_record.id, 'MIGRATED_USER', 'MIGRATED_SALT', 'bcrypt')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;