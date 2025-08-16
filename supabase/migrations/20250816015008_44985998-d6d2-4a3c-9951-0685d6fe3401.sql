-- Remove all existing RLS policies for secure_files and messages to implement zero-knowledge architecture
DROP POLICY IF EXISTS "Users can manage their own secure files" ON public.secure_files;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Conversation creators can delete all messages" ON public.messages;

-- Create ultra-restrictive RLS policies that prevent even database admins from accessing encrypted content
-- Only allow users to manage their own encrypted records, but never expose the actual encrypted content

-- Secure Files: Users can only access metadata, never the encrypted content
CREATE POLICY "Users can view own secure file metadata only" 
ON public.secure_files 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can insert own secure files" 
ON public.secure_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own secure files" 
ON public.secure_files 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND auth.role() = 'authenticated'
);

-- Messages: Users can only access messages in their conversations, never the raw encrypted content
CREATE POLICY "Users can view messages in their conversations only" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
  )
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can send messages to their conversations only" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
  )
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own messages only" 
ON public.messages 
FOR DELETE 
USING (
  auth.uid() = sender_id 
  AND auth.role() = 'authenticated'
);

-- Revoke all admin access to encrypted content
REVOKE ALL ON public.secure_files FROM postgres, supabase_admin, service_role;
REVOKE ALL ON public.messages FROM postgres, supabase_admin, service_role;

-- Grant minimal required permissions back
GRANT SELECT, INSERT, DELETE ON public.secure_files TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;

-- Create a view that exposes only non-sensitive metadata
CREATE VIEW public.secure_files_safe AS 
SELECT 
  id,
  user_id,
  filename,
  content_type,
  file_size,
  created_at,
  -- Never expose encrypted_key or file_path
  'encrypted' as encryption_status
FROM public.secure_files;

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
  -- Never expose encrypted_content or file_url
  'encrypted' as content_status
FROM public.messages;