-- Add last_read_at column to conversation_participants to track when user last read messages
ALTER TABLE public.conversation_participants 
ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();