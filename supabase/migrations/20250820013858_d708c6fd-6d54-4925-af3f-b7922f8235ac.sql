-- Fix RLS policies to ensure proper access to profiles for messaging
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to view message participants' profiles
CREATE OR REPLACE FUNCTION public.get_conversation_participant_profiles(conversation_uuid uuid)
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url
  FROM public.profiles p
  JOIN public.conversation_participants cp ON cp.user_id = p.id
  WHERE cp.conversation_id = conversation_uuid
  AND cp.left_at IS NULL;
$$;

-- Add message editing capability
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;

-- Update messages policy to allow updates by sender
CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id AND auth.role() = 'authenticated'::text)
WITH CHECK (auth.uid() = sender_id AND auth.role() = 'authenticated'::text);