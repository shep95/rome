-- Voice Messages Table
CREATE TABLE IF NOT EXISTS public.voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  waveform_data JSONB, -- Store waveform peaks for visualization
  transcript TEXT, -- Optional transcript from speech-to-text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view voice messages in their conversations
CREATE POLICY "Users can view voice messages in their conversations"
ON public.voice_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = voice_messages.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- Policy: Users can create voice messages in their conversations
CREATE POLICY "Users can create voice messages in their conversations"
ON public.voice_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = voice_messages.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
    AND m.sender_id = auth.uid()
  )
);

-- Message Drafts Table
CREATE TABLE IF NOT EXISTS public.message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  replied_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own drafts
CREATE POLICY "Users can manage their own drafts"
ON public.message_drafts FOR ALL
USING (user_id = auth.uid());

-- File Access Logs Table
CREATE TABLE IF NOT EXISTS public.file_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.secure_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: File owners can view access logs
CREATE POLICY "File owners can view access logs"
ON public.file_access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.secure_files
    WHERE secure_files.id = file_access_logs.file_id
    AND secure_files.user_id = auth.uid()
  )
);

-- Policy: Service can insert access logs
CREATE POLICY "Service can insert access logs"
ON public.file_access_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

-- File Sharing Table (time-limited access)
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.secure_files(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID, -- NULL means public link
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download')),
  password_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_views INTEGER,
  current_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create shares for their files
CREATE POLICY "Users can create shares for their files"
ON public.file_shares FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.secure_files
    WHERE secure_files.id = file_shares.file_id
    AND secure_files.user_id = auth.uid()
  )
  AND shared_by = auth.uid()
);

-- Policy: Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.file_shares FOR SELECT
USING (shared_by = auth.uid() OR shared_with = auth.uid());

-- Policy: Users can update their own shares
CREATE POLICY "Users can update their own shares"
ON public.file_shares FOR UPDATE
USING (shared_by = auth.uid());

-- File Folders Table
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own folders
CREATE POLICY "Users can manage their own folders"
ON public.file_folders FOR ALL
USING (user_id = auth.uid());

-- Add folder_id to secure_files
ALTER TABLE public.secure_files 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL;

-- Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, text, votes: []}
  multiple_choice BOOLEAN DEFAULT false,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view polls in their conversations
CREATE POLICY "Users can view polls in their conversations"
ON public.polls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = polls.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- Policy: Users can create polls in their conversations
CREATE POLICY "Users can create polls in their conversations"
ON public.polls FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = polls.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
    AND m.sender_id = auth.uid()
  )
);

-- Policy: Users can update polls they created
CREATE POLICY "Users can update polls they created"
ON public.polls FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = polls.message_id
    AND m.sender_id = auth.uid()
  )
);

-- Mentions Table
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their mentions
CREATE POLICY "Users can view their mentions"
ON public.mentions FOR SELECT
USING (mentioned_user_id = auth.uid());

-- Policy: Users can create mentions
CREATE POLICY "Users can create mentions"
ON public.mentions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = mentions.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
    AND m.sender_id = auth.uid()
  )
);

-- Policy: Users can mark their mentions as read
CREATE POLICY "Users can mark mentions as read"
ON public.mentions FOR UPDATE
USING (mentioned_user_id = auth.uid());

-- Function to log file access
CREATE OR REPLACE FUNCTION public.log_file_access(
  p_file_id UUID,
  p_user_id UUID,
  p_access_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.file_access_logs (
    file_id,
    user_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    p_file_id,
    p_user_id,
    p_access_type,
    p_ip_address::inet,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to check file share validity
CREATE OR REPLACE FUNCTION public.validate_file_share(
  p_share_id UUID,
  p_password TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  share_record RECORD;
BEGIN
  SELECT * INTO share_record
  FROM public.file_shares
  WHERE id = p_share_id
  AND revoked_at IS NULL
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_views IS NULL OR current_views < max_views);
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check password if required
  IF share_record.password_hash IS NOT NULL THEN
    IF p_password IS NULL THEN
      RETURN false;
    END IF;
    -- Note: In production, use proper password hashing
    IF share_record.password_hash != p_password THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Increment view count
  UPDATE public.file_shares
  SET current_views = current_views + 1
  WHERE id = p_share_id;
  
  RETURN true;
END;
$$;

-- Function to cleanup expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_file_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.file_shares
  SET revoked_at = NOW()
  WHERE revoked_at IS NULL
  AND (
    (expires_at IS NOT NULL AND expires_at < NOW())
    OR (max_views IS NOT NULL AND current_views >= max_views)
  );
END;
$$;

-- Trigger to update message_drafts updated_at
CREATE OR REPLACE FUNCTION public.update_draft_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_message_drafts_updated_at
BEFORE UPDATE ON public.message_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_draft_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_messages_message_id ON public.voice_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_message_drafts_conversation_user ON public.message_drafts(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON public.file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON public.file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON public.file_shares(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_folders_user_id ON public.file_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent_id ON public.file_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_polls_message_id ON public.polls(message_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON public.mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_message_id ON public.mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_secure_files_folder_id ON public.secure_files(folder_id);