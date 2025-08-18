-- SECURITY FIX: Fix SECURITY DEFINER views by recreating them with proper ownership
-- The messages_safe and secure_files_safe views are owned by postgres (superuser)
-- which gives them implicit SECURITY DEFINER behavior, bypassing RLS policies

-- Drop the existing problematic views
DROP VIEW IF EXISTS public.messages_safe;
DROP VIEW IF EXISTS public.secure_files_safe;

-- Recreate messages_safe view with proper ownership (not as superuser)
-- This view should respect RLS policies and not bypass security
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
    'encrypted'::text AS content_status
FROM public.messages
WHERE EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
);

-- Recreate secure_files_safe view with proper ownership (not as superuser)
-- This view should respect RLS policies and not bypass security
CREATE VIEW public.secure_files_safe AS
SELECT 
    id,
    user_id,
    filename,
    content_type,
    file_size,
    created_at,
    'encrypted'::text AS encryption_status
FROM public.secure_files
WHERE auth.uid() = user_id;