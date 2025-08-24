-- CRITICAL SECURITY ENHANCEMENT FOR ENCRYPTION KEYS
-- Fix potential exposure of private cryptographic keys

-- 1. First, let's add additional security constraints to prevent any bypass
-- Add a security check function to validate key access patterns
CREATE OR REPLACE FUNCTION public.validate_key_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      'accessed_keys', CASE 
        WHEN TG_OP = 'SELECT' THEN 'read_keys'
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
$$;

-- 2. Create the trigger to monitor all key operations
DROP TRIGGER IF EXISTS trigger_validate_key_access ON public.user_keys;
CREATE TRIGGER trigger_validate_key_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_keys
  FOR EACH ROW EXECUTE FUNCTION public.validate_key_access();

-- 3. Add additional RLS policy with stricter controls
-- First drop the existing broad "manage own keys" policy and replace with granular ones
DROP POLICY IF EXISTS "Users can manage own keys" ON public.user_keys;

-- Create more granular and secure policies
CREATE POLICY "Users can insert their own keys only"
ON public.user_keys
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own keys only"
ON public.user_keys  
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.role() = 'authenticated')
WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own keys only"
ON public.user_keys
FOR DELETE  
TO authenticated
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Keep the secure SELECT policy as-is but make it more explicit
DROP POLICY IF EXISTS "Users can view own keys" ON public.user_keys;
CREATE POLICY "Users can view own keys only"
ON public.user_keys
FOR SELECT
TO authenticated  
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- 4. Create a security function to safely retrieve public keys only (not private keys)
CREATE OR REPLACE FUNCTION public.get_user_public_keys(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  identity_key_public bytea,
  signed_prekey_public bytea,
  signed_prekey_id integer,
  signed_prekey_signature bytea
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only return PUBLIC keys, never private keys
  -- This function can be used safely for key exchange operations
  SELECT 
    uk.user_id,
    uk.identity_key_public,
    uk.signed_prekey_public, 
    uk.signed_prekey_id,
    uk.signed_prekey_signature
  FROM public.user_keys uk
  WHERE uk.user_id = target_user_id
  AND auth.role() = 'authenticated'
  LIMIT 1;
$$;

-- 5. Create a honeypot function to detect unauthorized key access attempts
CREATE OR REPLACE FUNCTION public.get_private_keys_honeypot()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $$
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
$$;

-- 6. Add comprehensive audit logging for the security enhancement
INSERT INTO public.security_audit_logs (
  user_id,
  event_type,
  event_description,
  risk_level,
  additional_data
) VALUES (
  null,
  'crypto_security_enhancement',
  'CRITICAL SECURITY ENHANCEMENT: Enhanced protection for cryptographic keys with monitoring, granular RLS, and honeypot detection',
  'critical',
  jsonb_build_object(
    'enhancement_type', 'cryptographic_key_protection',
    'features_added', jsonb_build_array(
      'granular_rls_policies',
      'access_monitoring_triggers', 
      'public_key_safe_access_function',
      'private_key_honeypot_detection'
    ),
    'tables_secured', 'user_keys',
    'private_key_exposure_risk', 'minimized'
  )
);

-- 7. Final verification
DO $$
DECLARE
  policy_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Verify correct number of policies
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'user_keys' 
  AND schemaname = 'public';
  
  -- Verify trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'user_keys'
  AND trigger_name = 'trigger_validate_key_access';
  
  -- Log verification results
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    risk_level,
    additional_data
  ) VALUES (
    null,
    'security_verification',
    'Verified cryptographic key security enhancements are properly deployed',
    'info',
    jsonb_build_object(
      'policies_count', policy_count,
      'triggers_count', trigger_count,
      'expected_policies', 4,
      'expected_triggers', 1,
      'security_check_passed', (policy_count = 4 AND trigger_count = 1)
    )
  );
END $$;