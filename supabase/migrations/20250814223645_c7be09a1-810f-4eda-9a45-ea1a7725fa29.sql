-- Fix the security definer function by setting search path
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(conversation_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = $1 
    AND conversation_participants.user_id = $2 
    AND conversation_participants.left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';