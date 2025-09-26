-- Fix remaining functions with mutable search_path security issues

-- Fix audit_message_changes function
CREATE OR REPLACE FUNCTION public.audit_message_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix cleanup_expired_security_data function
CREATE OR REPLACE FUNCTION public.cleanup_expired_security_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix validate_user_session function
CREATE OR REPLACE FUNCTION public.validate_user_session(p_session_token text)
 RETURNS TABLE(user_id uuid, is_valid boolean, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix invalidate_all_user_sessions function
CREATE OR REPLACE FUNCTION public.invalidate_all_user_sessions(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id;
END;
$function$;

-- Fix cleanup_expired_updates function
CREATE OR REPLACE FUNCTION public.cleanup_expired_updates()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.updates 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$function$;

-- Add additional security hardening for sensitive functions

-- Enhance get_secure_email function with better security
CREATE OR REPLACE FUNCTION public.get_secure_email(user_uuid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN email_encrypted IS NOT NULL THEN 
      replace(convert_from(decode(encode(email_encrypted, 'escape'), 'base64'), 'UTF8'), 'ENCRYPTED:', '')
    ELSE NULL 
  END
  FROM public.profiles 
  WHERE id = user_uuid AND auth.uid() = user_uuid AND auth.role() = 'authenticated';
$function$;

-- Enhance get_decrypted_email function with better security
CREATE OR REPLACE FUNCTION public.get_decrypted_email(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT email FROM public.profiles 
  WHERE id = user_id AND auth.uid() = user_id AND auth.role() = 'authenticated';
$function$;

-- Add comprehensive security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_suspicious_activity()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  suspicious_events RECORD;
BEGIN
  -- Check for suspicious patterns in security logs
  FOR suspicious_events IN 
    SELECT user_id, event_type, COUNT(*) as event_count
    FROM public.security_audit_logs
    WHERE timestamp > now() - INTERVAL '1 hour'
      AND risk_level IN ('high', 'critical')
    GROUP BY user_id, event_type
    HAVING COUNT(*) > 10
  LOOP
    -- Log critical security alert
    PERFORM public.log_security_event(
      suspicious_events.user_id,
      'suspicious_activity_detected',
      'Multiple high-risk security events detected',
      null,
      null,
      null,
      'critical',
      jsonb_build_object(
        'event_type', suspicious_events.event_type,
        'event_count', suspicious_events.event_count,
        'time_window', '1 hour',
        'requires_immediate_review', true
      )
    );
  END LOOP;
END;
$function$;

-- Add secure data validation function
CREATE OR REPLACE FUNCTION public.validate_secure_data_access(table_name text, operation text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all sensitive data access attempts
  PERFORM public.log_security_event(
    auth.uid(),
    'sensitive_data_access',
    'Attempt to access sensitive data',
    null,
    null,
    null,
    'high',
    jsonb_build_object(
      'table_name', table_name,
      'operation', operation,
      'timestamp', now()
    )
  );
  
  -- Check if user is authenticated and authorized
  IF auth.role() != 'authenticated' OR auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check rate limiting
  RETURN public.check_rate_limit('sensitive_data_access', 50, 60);
END;
$function$;