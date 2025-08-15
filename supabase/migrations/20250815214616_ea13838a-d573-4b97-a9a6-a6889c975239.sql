-- Allow conversation creators to delete conversations and messages
DROP POLICY IF EXISTS "Conversation creators can delete conversations" ON public.conversations;
CREATE POLICY "Conversation creators can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (created_by = auth.uid());

-- Allow conversation creators to delete messages in their conversations
DROP POLICY IF EXISTS "Conversation creators can delete all messages" ON public.messages;
CREATE POLICY "Conversation creators can delete all messages" 
ON public.messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = messages.conversation_id 
  AND conversations.created_by = auth.uid()
));

-- Allow conversation creators to remove participants
DROP POLICY IF EXISTS "Conversation creators can remove participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators can remove participants" 
ON public.conversation_participants 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = conversation_participants.conversation_id 
  AND conversations.created_by = auth.uid()
));

-- Allow conversation creators to add participants
DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators can add participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_participants.conversation_id 
    AND conversations.created_by = auth.uid()
  ))
);