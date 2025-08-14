-- Fix infinite recursion in conversation_participants RLS policies
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a security definer function to check if user is in conversation
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  public.user_is_conversation_participant(conversation_id, auth.uid())
);