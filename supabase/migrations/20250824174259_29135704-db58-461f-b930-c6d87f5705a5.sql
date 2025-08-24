-- FIX SECURITY WARNINGS - Set proper search_path for encryption functions
-- This fixes the "Function Search Path Mutable" warnings from the linter

-- Update the encryption functions to have immutable search paths
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS bytea
LANGUAGE sql
IMMUTABLE STRICT
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pgp_sym_encrypt(data, current_setting('app.encryption_key', true), 'cipher-algo=aes256')
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data bytea)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key', true))
$$;

-- Update the secure view function to have immutable search path
CREATE OR REPLACE FUNCTION public.get_decrypted_email(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.decrypt_sensitive_data(email_encrypted)
  FROM public.profiles 
  WHERE id = user_id AND auth.uid() = user_id;
$$;

-- Log the security fix
INSERT INTO public.security_audit_logs (
  user_id,
  event_type,
  event_description,
  risk_level,
  additional_data
) VALUES (
  null,
  'security_linter_fixes',
  'Fixed function search path security warnings for encryption functions',
  'info',
  jsonb_build_object(
    'functions_fixed', jsonb_build_array(
      'encrypt_sensitive_data',
      'decrypt_sensitive_data', 
      'get_decrypted_email'
    ),
    'security_issue', 'search_path_mutable',
    'fix_applied', 'SET search_path TO public'
  )
);