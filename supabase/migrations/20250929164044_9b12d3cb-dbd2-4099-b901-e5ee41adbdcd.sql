-- Delete specified user accounts from profiles table
-- This will also delete the auth.users records due to foreign key constraints

DELETE FROM public.profiles 
WHERE email IN ('ashernewtonx@gmail.com', 'killerbattleasher@gmail.com');

-- Log the deletion for security audit
INSERT INTO public.security_audit_logs (
  user_id,
  event_type,
  event_description,
  risk_level,
  additional_data
) VALUES (
  null,
  'account_deletion',
  'Admin deleted user accounts',
  'high',
  jsonb_build_object(
    'deleted_emails', ARRAY['ashernewtonx@gmail.com', 'killerbattleasher@gmail.com'],
    'deleted_by', 'admin',
    'timestamp', now()
  )
);