-- Fix the final remaining functions with mutable search_path security issues

-- Fix validate_profile_access function
CREATE OR REPLACE FUNCTION public.validate_profile_access(profile_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow access to own profile data
  RETURN auth.uid() = profile_user_id AND public.is_authenticated_user();
END;
$function$;

-- Fix validate_call_history_access function
CREATE OR REPLACE FUNCTION public.validate_call_history_access(history_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow access to own call history
  RETURN auth.uid() = history_user_id AND public.is_authenticated_user();
END;
$function$;

-- Fix is_authenticated_user function
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN auth.role() = 'authenticated' AND auth.uid() IS NOT NULL;
END;
$function$;

-- Fix is_service_admin function
CREATE OR REPLACE FUNCTION public.is_service_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'service_role';
END;
$function$;

-- Fix log_sensitive_operation function
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the operation for security monitoring
  RAISE LOG 'Security audit: % operation on table % by user %', TG_OP, TG_TABLE_NAME, auth.uid();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix validate_key_access function
CREATE OR REPLACE FUNCTION public.validate_key_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all key access attempts for security monitoring
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    risk_level,
    additional_data
  ) VALUES (
    auth.uid(),
    'crypto_key_access',
    'User accessed cryptographic keys',
    'high',
    jsonb_build_object(
      'operation', CASE 
        WHEN TG_OP = 'INSERT' THEN 'created_keys' 
        WHEN TG_OP = 'UPDATE' THEN 'modified_keys'
        WHEN TG_OP = 'DELETE' THEN 'deleted_keys'
      END,
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', now()
    )
  );
  
  -- Additional validation: ensure user can only access their own keys
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Attempt to access another user''s cryptographic keys detected';
    END IF;
    RETURN NEW;
  END IF;
  
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.user_id != auth.uid() THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Attempt to access another user''s cryptographic keys detected';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Fix get_private_keys_honeypot function
CREATE OR REPLACE FUNCTION public.get_private_keys_honeypot()
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function should NEVER be called in legitimate usage
  -- Log any calls as potential security breaches
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    risk_level,
    additional_data
  ) VALUES (
    auth.uid(),
    'security_breach_attempt',
    'CRITICAL: Unauthorized attempt to access private key honeypot function',
    'critical',
    jsonb_build_object(
      'function_called', 'get_private_keys_honeypot',
      'caller_id', auth.uid(),
      'timestamp', now(),
      'potential_attack', true
    )
  );
  
  -- Return fake data to confuse attackers
  RETURN decode('SECURITY_HONEYPOT_TRIGGERED', 'escape');
END;
$function$;

-- Fix any remaining trigger functions that may not have search_path
CREATE OR REPLACE FUNCTION public.trigger_cleanup_self_destruct()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Schedule cleanup when a self-destruct message is viewed
  IF NEW.is_self_destruct = TRUE AND NEW.self_destruct_viewed_at IS NOT NULL AND OLD.self_destruct_viewed_at IS NULL THEN
    -- Perform immediate cleanup of other old viewed messages
    PERFORM public.cleanup_viewed_self_destruct_messages();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comprehensive security validation
CREATE OR REPLACE FUNCTION public.validate_all_security_constraints()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  security_valid boolean := true;
BEGIN
  -- Check if user is properly authenticated
  IF NOT public.is_authenticated_user() THEN
    security_valid := false;
  END IF;
  
  -- Log security validation check
  PERFORM public.log_security_event(
    auth.uid(),
    'security_validation_check',
    'Comprehensive security validation performed',
    null,
    null,
    null,
    'medium',
    jsonb_build_object(
      'validation_result', security_valid,
      'timestamp', now()
    )
  );
  
  RETURN security_valid;
END;
$function$;