-- REMOVE ALL PUBLIC ACCESS - ABSOLUTE ZERO EXPOSURE
-- Lock down everything to prevent any public access

-- Remove public access from ALL tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Remove usage on public schema
REVOKE USAGE ON SCHEMA public FROM PUBLIC, anon;

-- Ensure only authenticated users can access their own data
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant minimal permissions only to authenticated users for specific tables they own
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.secure_files TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.call_history TO authenticated;

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on typing indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policy for typing indicators - users can only see/update their conversation typing status
CREATE POLICY "Users can manage typing in their conversations"
ON public.typing_indicators
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = typing_indicators.conversation_id 
    AND conversation_participants.user_id = auth.uid() 
    AND conversation_participants.left_at IS NULL
  )
  AND auth.role() = 'authenticated'
);

-- Grant permissions for typing indicators
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_indicators TO authenticated;

-- Function to auto-cleanup old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove typing indicators older than 10 seconds
  DELETE FROM public.typing_indicators 
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NULL;
END;
$$;

-- Trigger to cleanup old typing indicators
CREATE OR REPLACE TRIGGER cleanup_typing_trigger
  AFTER INSERT OR UPDATE ON public.typing_indicators
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_typing_indicators();