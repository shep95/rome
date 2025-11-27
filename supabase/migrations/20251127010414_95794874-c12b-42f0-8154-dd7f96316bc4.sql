-- Create table to track NOMAD access verification
CREATE TABLE public.nomad_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nomad_access ENABLE ROW LEVEL SECURITY;

-- Users can only view their own NOMAD access status
CREATE POLICY "Users can view their own NOMAD access"
ON public.nomad_access
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert verification records
CREATE POLICY "Service can insert NOMAD access"
ON public.nomad_access
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update access records
CREATE POLICY "Service can update NOMAD access"
ON public.nomad_access
FOR UPDATE
USING (auth.role() = 'service_role');