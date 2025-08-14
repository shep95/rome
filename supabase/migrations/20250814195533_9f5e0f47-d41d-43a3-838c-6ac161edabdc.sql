-- Create tables for advanced security features

-- User security settings and MFA
CREATE TABLE public.user_security (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,
  backup_codes TEXT[],
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  device_fingerprints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- WebAuthn credentials for passkey support
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  backup_eligible BOOLEAN DEFAULT FALSE,
  backup_state BOOLEAN DEFAULT FALSE,
  transports TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- E2EE key storage (Signal protocol)
CREATE TABLE public.user_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  identity_key_public BYTEA NOT NULL,
  identity_key_private BYTEA NOT NULL, -- Encrypted with user's password
  signed_prekey_id INTEGER NOT NULL,
  signed_prekey_public BYTEA NOT NULL,
  signed_prekey_private BYTEA NOT NULL, -- Encrypted
  signed_prekey_signature BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- One-time prekeys for Signal protocol
CREATE TABLE public.one_time_prekeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  key_id INTEGER NOT NULL,
  public_key BYTEA NOT NULL,
  private_key BYTEA NOT NULL, -- Encrypted
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key_id)
);

-- Conversations and message metadata
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  created_by UUID NOT NULL REFERENCES auth.users,
  encrypted_metadata BYTEA, -- Group name, etc. encrypted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(conversation_id, user_id)
);

-- E2EE messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users,
  encrypted_content BYTEA NOT NULL, -- AES-GCM encrypted message
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  sequence_number BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, sequence_number)
);

-- Rate limiting table
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or user_id
  action TEXT NOT NULL, -- login, signup, message_send
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(identifier, action)
);

-- Enable RLS on all tables
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_prekeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_security
CREATE POLICY "Users can view own security settings" ON public.user_security
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own security settings" ON public.user_security
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own security settings" ON public.user_security
FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for webauthn_credentials
CREATE POLICY "Users can view own webauthn credentials" ON public.webauthn_credentials
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own webauthn credentials" ON public.webauthn_credentials
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_keys
CREATE POLICY "Users can view own keys" ON public.user_keys
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own keys" ON public.user_keys
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for one_time_prekeys
CREATE POLICY "Users can view own prekeys" ON public.one_time_prekeys
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prekeys" ON public.one_time_prekeys
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for conversations (users can only see conversations they're part of)
CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id 
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants AS cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

CREATE POLICY "Users can send messages to their conversations" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
    AND left_at IS NULL
  )
);

-- Function to initialize user security settings
CREATE OR REPLACE FUNCTION public.initialize_user_security()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_security (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to initialize security settings on profile creation
CREATE TRIGGER initialize_user_security_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_security();

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Indexes for performance
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_expires_at ON public.rate_limits(expires_at);
CREATE INDEX idx_messages_conversation_sequence ON public.messages(conversation_id, sequence_number);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id, left_at);
CREATE INDEX idx_webauthn_credentials_user ON public.webauthn_credentials(user_id);
CREATE INDEX idx_one_time_prekeys_user_used ON public.one_time_prekeys(user_id, used_at);