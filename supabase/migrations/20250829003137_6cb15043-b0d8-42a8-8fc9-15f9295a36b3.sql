-- Create scheduled_messages table
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  message_type TEXT DEFAULT 'text',
  is_self_destruct BOOLEAN DEFAULT false,
  replied_to_message_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled messages
CREATE POLICY "Users can create scheduled messages in their conversations" 
ON public.scheduled_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = scheduled_messages.conversation_id 
    AND user_id = auth.uid() 
    AND left_at IS NULL
  )
);

CREATE POLICY "Users can view scheduled messages in their conversations" 
ON public.scheduled_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = scheduled_messages.conversation_id 
    AND user_id = auth.uid() 
    AND left_at IS NULL
  )
);

CREATE POLICY "Users can update their own scheduled messages" 
ON public.scheduled_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own scheduled messages" 
ON public.scheduled_messages 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Create function to process scheduled messages
CREATE OR REPLACE FUNCTION public.process_scheduled_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  scheduled_msg RECORD;
  new_message_id UUID;
BEGIN
  -- Get all pending scheduled messages that should be sent now
  FOR scheduled_msg IN 
    SELECT * FROM public.scheduled_messages 
    WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
  LOOP
    -- Insert the message into the messages table
    INSERT INTO public.messages (
      conversation_id,
      sender_id, 
      data_payload,
      message_type,
      file_url,
      file_name,
      file_size,
      replied_to_message_id,
      is_self_destruct,
      sequence_number
    ) VALUES (
      scheduled_msg.conversation_id,
      scheduled_msg.sender_id,
      encode(scheduled_msg.content::bytea, 'base64')::bytea,
      scheduled_msg.message_type,
      scheduled_msg.file_url,
      scheduled_msg.file_name,
      scheduled_msg.file_size,
      scheduled_msg.replied_to_message_id,
      scheduled_msg.is_self_destruct,
      COALESCE((
        SELECT MAX(sequence_number) + 1 
        FROM public.messages 
        WHERE conversation_id = scheduled_msg.conversation_id
      ), 1)
    ) RETURNING id INTO new_message_id;
    
    -- Update the scheduled message status
    UPDATE public.scheduled_messages 
    SET status = 'sent', sent_at = NOW()
    WHERE id = scheduled_msg.id;
  END LOOP;
END;
$$;