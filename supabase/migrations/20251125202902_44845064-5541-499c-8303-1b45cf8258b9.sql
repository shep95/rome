-- Create poll_votes table for tracking user votes on polls
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

-- Enable RLS
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Users can view votes in polls they can access
CREATE POLICY "Users can view votes in their conversations"
  ON public.poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.messages m ON m.id = p.message_id
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE p.id = poll_votes.poll_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

-- Users can vote in polls they can access
CREATE POLICY "Users can vote in their conversations"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.messages m ON m.id = p.message_id
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE p.id = poll_votes.poll_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);