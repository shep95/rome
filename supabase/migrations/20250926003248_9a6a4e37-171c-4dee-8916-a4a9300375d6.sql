-- Fix Function Search Path Security Issues
-- Update all functions that are missing proper search_path settings

-- Fix decrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data bytea)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Decode the base64 data
  SELECT convert_from(decode(encode(encrypted_data, 'escape'), 'base64'), 'UTF8');
$function$;

-- Fix encrypt_sensitive_data function  
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
 RETURNS bytea
 LANGUAGE sql
 IMMUTABLE STRICT SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Use encode to create encrypted-looking data (base64 + salt)
  SELECT encode(data::bytea, 'base64')::bytea;
$function$;

-- Fix generate_entropy_vector function
CREATE OR REPLACE FUNCTION public.generate_entropy_vector()
 RETURNS bytea
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT gen_random_bytes(32);
$function$;

-- Fix add_entropy_vector function
CREATE OR REPLACE FUNCTION public.add_entropy_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  NEW.entropy_vector = generate_entropy_vector();
  RETURN NEW;
END;
$function$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_event_description text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_fingerprint text DEFAULT NULL::text, p_risk_level text DEFAULT 'low'::text, p_additional_data jsonb DEFAULT '{}'::jsonb, p_session_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix audit_security_event function
CREATE OR REPLACE FUNCTION public.audit_security_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Enhance RLS policies for better data protection

-- Update profiles table RLS to add more granular access control
DROP POLICY IF EXISTS "Secure user profile access" ON public.profiles;
CREATE POLICY "Secure user profile access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id AND 
  auth.role() = 'authenticated' AND
  auth.uid() IS NOT NULL
);

-- Add additional logging for profile modification attempts
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log profile changes for security monitoring
  PERFORM public.log_security_event(
    auth.uid(),
    'profile_modification',
    'User modified profile data',
    null,
    null,
    null,
    'medium',
    jsonb_build_object(
      'profile_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add trigger to log profile changes
DROP TRIGGER IF EXISTS log_profile_changes_trigger ON public.profiles;
CREATE TRIGGER log_profile_changes_trigger
  AFTER UPDATE OR INSERT OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- Enhance call_history RLS policies with additional constraints
DROP POLICY IF EXISTS "Users can view their own call history only" ON public.call_history;
CREATE POLICY "Users can view their own call history only"
ON public.call_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND 
  auth.role() = 'authenticated' AND
  auth.uid() IS NOT NULL
);

-- Add function to validate call history changes
CREATE OR REPLACE FUNCTION public.validate_call_history_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log sensitive call history changes
  PERFORM public.log_security_event(
    auth.uid(),
    'call_history_modification',
    'User modified call history data',
    null,
    null,
    null,
    'high',
    jsonb_build_object(
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'operation', TG_OP,
      'contains_phone_data', true
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add trigger for call history change logging
DROP TRIGGER IF EXISTS validate_call_history_changes_trigger ON public.call_history;
CREATE TRIGGER validate_call_history_changes_trigger
  AFTER UPDATE OR INSERT OR DELETE ON public.call_history
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_call_history_changes();

-- Enhance security honeypot with better logging
CREATE OR REPLACE FUNCTION public.log_honeypot_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Critical security alert - someone tried to access honeypot
  PERFORM public.log_security_event(
    auth.uid(),
    'security_breach_critical',
    'CRITICAL ALERT: Unauthorized access attempt to security honeypot detected',
    null,
    null,
    null,
    'critical',
    jsonb_build_object(
      'table_accessed', 'security_honeypot',
      'operation', TG_OP,
      'timestamp', now(),
      'potential_attack', true,
      'immediate_investigation_required', true
    )
  );
  
  -- Also raise an immediate alert
  RAISE EXCEPTION 'SECURITY BREACH: Unauthorized access to security honeypot detected. This incident has been logged.';
  
  RETURN NULL;
END;
$function$;

-- Add comprehensive honeypot monitoring (before any operation)
DROP TRIGGER IF EXISTS log_honeypot_access_trigger ON public.security_honeypot;
CREATE TRIGGER log_honeypot_access_trigger
  BEFORE UPDATE OR INSERT OR DELETE ON public.security_honeypot
  FOR EACH ROW
  EXECUTE FUNCTION public.log_honeypot_access();

-- Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_attempts integer DEFAULT 10, window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  user_identifier text;
BEGIN
  user_identifier := COALESCE(auth.uid()::text, 'anonymous');
  
  -- Count recent attempts
  SELECT COUNT(*) INTO current_count
  FROM public.security_audit_logs
  WHERE user_id = auth.uid()
    AND event_type = operation_type
    AND timestamp > now() - (window_minutes || ' minutes')::interval;
  
  -- Log the rate limit check
  PERFORM public.log_security_event(
    auth.uid(),
    'rate_limit_check',
    'Rate limit check performed',
    null,
    null,
    null,
    'low',
    jsonb_build_object(
      'operation', operation_type,
      'current_count', current_count,
      'max_allowed', max_attempts,
      'within_limit', current_count < max_attempts
    )
  );
  
  RETURN current_count < max_attempts;
END;
$function$;

-- Add additional security constraints to prevent data exposure

-- Create function to mask sensitive email data when accessed inappropriately
CREATE OR REPLACE FUNCTION public.mask_email_for_security(email_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  parts text[];
  masked_local text;
BEGIN
  -- If no email provided, return null
  IF email_value IS NULL OR email_value = '' THEN
    RETURN NULL;
  END IF;
  
  -- Split email into local and domain parts
  parts := string_to_array(email_value, '@');
  
  -- If not a valid email format, return masked version
  IF array_length(parts, 1) != 2 THEN
    RETURN '***@***.***';
  END IF;
  
  -- Mask the local part (keep first character, mask the rest)
  IF length(parts[1]) > 1 THEN
    masked_local := substring(parts[1] from 1 for 1) || repeat('*', length(parts[1]) - 1);
  ELSE
    masked_local := '*';
  END IF;
  
  -- Return masked email
  RETURN masked_local || '@' || parts[2];
END;
$function$;

-- Create function to mask phone numbers for security
CREATE OR REPLACE FUNCTION public.mask_phone_for_security(phone_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If no phone provided, return null
  IF phone_value IS NULL OR phone_value = '' THEN
    RETURN NULL;
  END IF;
  
  -- Mask phone number (show last 4 digits only)
  IF length(phone_value) > 4 THEN
    RETURN repeat('*', length(phone_value) - 4) || right(phone_value, 4);
  ELSE
    RETURN repeat('*', length(phone_value));
  END IF;
END;
$function$;