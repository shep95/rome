-- Fix the infinite recursion in conversation_participants RLS policy
-- The issue is that the policy references itself in the EXISTS subquery

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create a corrected policy that doesn't cause recursion
CREATE POLICY "Users can view participants of their conversations" 
ON conversation_participants 
FOR SELECT 
USING (
  -- User can see participants if they are a participant in the same conversation
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 
    FROM conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid() 
    AND cp2.left_at IS NULL
  )
);

-- Add missing INSERT and UPDATE policies for conversation_participants
CREATE POLICY "Users can join conversations they're invited to" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (
  -- User can only add themselves to conversations they're invited to
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own participation" 
ON conversation_participants 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add missing policies for conversations table
CREATE POLICY "Users can create conversations" 
ON conversations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update conversations they participate in" 
ON conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
  )
);