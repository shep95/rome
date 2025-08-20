-- Add cleared_at column to conversation_participants to track when user cleared their history
ALTER TABLE conversation_participants 
ADD COLUMN cleared_at timestamp with time zone;

-- Add comment to explain the column
COMMENT ON COLUMN conversation_participants.cleared_at IS 'Timestamp when user cleared their conversation history. Messages before this time are hidden from this user.';