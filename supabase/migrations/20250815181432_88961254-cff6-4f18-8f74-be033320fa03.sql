-- Allow users to delete messages from their conversations
ALTER TABLE public.messages DROP POLICY IF EXISTS "Users can delete messages in their conversations";

CREATE POLICY "Users can delete messages in their conversations" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
  )
);