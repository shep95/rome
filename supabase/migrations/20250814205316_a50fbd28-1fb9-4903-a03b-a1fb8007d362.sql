
-- Create users search view for finding users by username
CREATE OR REPLACE VIEW public.user_search AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.email
FROM public.profiles p
WHERE p.username IS NOT NULL;

-- Create message requests table
CREATE TABLE public.message_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users NOT NULL,
  to_user_id UUID REFERENCES auth.users NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS on message requests
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for message requests
CREATE POLICY "Users can view their own message requests" 
  ON public.message_requests 
  FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create message requests" 
  ON public.message_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own message requests" 
  ON public.message_requests 
  FOR UPDATE 
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Add group chat settings to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_delete_after INTERVAL;

-- Create secure files table
CREATE TABLE public.secure_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  encrypted_key BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on secure files
ALTER TABLE public.secure_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for secure files
CREATE POLICY "Users can manage their own secure files" 
  ON public.secure_files 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add trigger for updating message requests updated_at
CREATE TRIGGER update_message_requests_updated_at
  BEFORE UPDATE ON public.message_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for message requests
ALTER TABLE public.message_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_requests;

-- Enable realtime for conversations (if not already enabled)
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Enable realtime for messages (if not already enabled)  
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for conversation participants
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
