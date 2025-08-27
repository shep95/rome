-- Add reactions table for contextual reactions on messages
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL, -- emoji or predefined reaction
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Enable RLS on reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies - users can only react in conversations they participate in
CREATE POLICY "Users can add reactions in their conversations"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reactions.message_id 
    AND cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reactions.message_id 
    AND cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add anonymous posting capabilities
ALTER TABLE public.messages ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN anonymous_id TEXT; -- e.g., "Anon-47"

-- Add anonymous privilege tracking to conversation participants
ALTER TABLE public.conversation_participants 
ADD COLUMN can_post_anonymously BOOLEAN DEFAULT TRUE,
ADD COLUMN anonymous_revoked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN anonymous_revoked_by UUID;

-- Create admin log for anonymous messages (only visible to admins)
CREATE TABLE public.anonymous_message_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  real_sender_id UUID NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on anonymous log
ALTER TABLE public.anonymous_message_log ENABLE ROW LEVEL SECURITY;

-- Only conversation admins can view the anonymous log
CREATE POLICY "Only admins can view anonymous message log"
ON public.anonymous_message_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = anonymous_message_log.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
    AND cp.left_at IS NULL
  )
);

-- Service role can insert into log (for edge functions)
CREATE POLICY "Service can insert into anonymous log"
ON public.anonymous_message_log
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create function to generate anonymous IDs
CREATE OR REPLACE FUNCTION public.generate_anonymous_id(p_conversation_id UUID, p_sender_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_id TEXT;
  new_id TEXT;
  id_number INTEGER;
BEGIN
  -- Check if user already has an anonymous ID for this conversation
  SELECT anonymous_id INTO existing_id
  FROM public.anonymous_message_log
  WHERE conversation_id = p_conversation_id 
  AND real_sender_id = p_sender_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;
  
  -- Generate new anonymous ID
  SELECT COALESCE(MAX(CAST(SUBSTRING(anonymous_id FROM 'Anon-(\d+)') AS INTEGER)), 0) + 1
  INTO id_number
  FROM public.anonymous_message_log
  WHERE conversation_id = p_conversation_id;
  
  new_id := 'Anon-' || id_number::TEXT;
  
  RETURN new_id;
END;
$$;

-- Update messages table to support reactions count (for performance)
ALTER TABLE public.messages ADD COLUMN reactions_count INTEGER DEFAULT 0;

-- Create function to update reaction counts
CREATE OR REPLACE FUNCTION public.update_message_reaction_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.messages 
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.messages 
    SET reactions_count = GREATEST(reactions_count - 1, 0)
    WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for reaction count updates
CREATE TRIGGER update_reaction_count_trigger
AFTER INSERT OR DELETE ON public.message_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_message_reaction_count();