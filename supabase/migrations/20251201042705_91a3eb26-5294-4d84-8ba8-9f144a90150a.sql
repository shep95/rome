-- Create table for encrypted NOMAD conversations with zero-knowledge storage
CREATE TABLE nomad_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  title_encrypted TEXT NOT NULL,
  messages_encrypted TEXT NOT NULL,
  last_message_preview TEXT,
  encryption_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE nomad_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own encrypted conversations
CREATE POLICY "Users can view their own NOMAD conversations"
ON nomad_conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NOMAD conversations"
ON nomad_conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NOMAD conversations"
ON nomad_conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own NOMAD conversations"
ON nomad_conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_nomad_conversations_user_id ON nomad_conversations(user_id);
CREATE INDEX idx_nomad_conversations_updated_at ON nomad_conversations(updated_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nomad_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nomad_conversations_updated_at
BEFORE UPDATE ON nomad_conversations
FOR EACH ROW
EXECUTE FUNCTION update_nomad_conversations_updated_at();