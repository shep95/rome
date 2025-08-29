-- Add self-destruct functionality to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_self_destruct BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS self_destruct_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS self_destruct_viewed_by UUID REFERENCES auth.users(id);

-- Create function to handle self-destruct message viewing
CREATE OR REPLACE FUNCTION public.mark_self_destruct_viewed(p_message_id uuid, p_viewer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark message as viewed if it's a self-destruct message and viewer is not the sender
  UPDATE public.messages 
  SET 
    self_destruct_viewed_at = NOW(),
    self_destruct_viewed_by = p_viewer_id
  WHERE 
    id = p_message_id 
    AND is_self_destruct = TRUE 
    AND sender_id != p_viewer_id
    AND self_destruct_viewed_at IS NULL;
END;
$$;

-- Create function to clean up viewed self-destruct messages
CREATE OR REPLACE FUNCTION public.cleanup_viewed_self_destruct_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete self-destruct messages that have been viewed for more than 5 seconds
  DELETE FROM public.messages 
  WHERE 
    is_self_destruct = TRUE 
    AND self_destruct_viewed_at IS NOT NULL 
    AND self_destruct_viewed_at < NOW() - INTERVAL '5 seconds';
END;
$$;

-- Create trigger to automatically cleanup viewed self-destruct messages
CREATE OR REPLACE FUNCTION public.trigger_cleanup_self_destruct()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Schedule cleanup when a self-destruct message is viewed
  IF NEW.is_self_destruct = TRUE AND NEW.self_destruct_viewed_at IS NOT NULL AND OLD.self_destruct_viewed_at IS NULL THEN
    -- Perform immediate cleanup of other old viewed messages
    PERFORM public.cleanup_viewed_self_destruct_messages();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_self_destruct_cleanup ON public.messages;
CREATE TRIGGER trigger_self_destruct_cleanup
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_self_destruct();

-- Add RLS policy for self-destruct messages
CREATE POLICY "Users can view self-destruct messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
  AND (
    -- Regular messages or self-destruct messages that haven't been viewed yet
    is_self_destruct = FALSE 
    OR self_destruct_viewed_at IS NULL
    OR sender_id = auth.uid()
  )
);