-- Add missing RLS policy for rate_limits table
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
FOR ALL USING (true);