-- Reset message requests back to pending and clean up any orphaned conversations
UPDATE message_requests SET status = 'pending' WHERE status = 'accepted';

-- Delete any conversations that might have been created without proper participants
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id 
  FROM conversations c 
  LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id 
  WHERE cp.conversation_id IS NULL
);

-- Delete any orphaned conversation participants
DELETE FROM conversation_participants 
WHERE conversation_id NOT IN (SELECT id FROM conversations);