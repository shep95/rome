-- Add read receipts functionality
-- Update last_read_at when user views messages
CREATE OR REPLACE FUNCTION update_last_read_at(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversation_participants 
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
    AND left_at IS NULL;
END;
$$;

-- Add message read status tracking
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reads
CREATE POLICY "Users can view read status for their conversations"
ON public.message_reads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reads.message_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can mark messages as read in their conversations"
ON public.message_reads
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reads.message_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id uuid, p_up_to_message_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  msg_record RECORD;
BEGIN
  -- Mark all unread messages in conversation as read (or up to specific message)
  FOR msg_record IN 
    SELECT m.id as message_id
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != auth.uid() -- Don't mark own messages as read
      AND (p_up_to_message_id IS NULL OR m.created_at <= (
        SELECT created_at FROM public.messages WHERE id = p_up_to_message_id
      ))
      AND NOT EXISTS (
        SELECT 1 FROM public.message_reads mr 
        WHERE mr.message_id = m.id AND mr.user_id = auth.uid()
      )
  LOOP
    INSERT INTO public.message_reads (message_id, user_id)
    VALUES (msg_record.message_id, auth.uid())
    ON CONFLICT (message_id, user_id) DO NOTHING;
  END LOOP;

  -- Update last_read_at in conversation_participants
  UPDATE public.conversation_participants 
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
    AND left_at IS NULL;
END;
$$;