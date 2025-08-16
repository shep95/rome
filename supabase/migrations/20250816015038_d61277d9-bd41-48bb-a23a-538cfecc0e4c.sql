-- Fix the Security Definer View issues by dropping and recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.secure_files_safe;
DROP VIEW IF EXISTS public.messages_safe;

-- Create regular views instead of security definer views
CREATE VIEW public.secure_files_safe AS 
SELECT 
  id,
  user_id,
  filename,
  content_type,
  file_size,
  created_at,
  'encrypted' as encryption_status
FROM public.secure_files
WHERE auth.uid() = user_id;

CREATE VIEW public.messages_safe AS 
SELECT 
  id,
  conversation_id,
  sender_id,
  message_type,
  file_name,
  file_size,
  created_at,
  sequence_number,
  'encrypted' as content_status
FROM public.messages
WHERE EXISTS (
  SELECT 1 
  FROM public.conversation_participants 
  WHERE conversation_participants.conversation_id = messages.conversation_id 
  AND conversation_participants.user_id = auth.uid() 
  AND conversation_participants.left_at IS NULL
);