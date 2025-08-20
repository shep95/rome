-- Create updates table for slideshow updates
CREATE TABLE public.updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Create policy - updates are viewable by all authenticated users
CREATE POLICY "Updates are viewable by authenticated users" 
ON public.updates 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true AND expires_at > now());

-- Create function to clean up expired updates
CREATE OR REPLACE FUNCTION public.cleanup_expired_updates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.updates 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Insert the first update as requested
INSERT INTO public.updates (title, description, image_url, display_order)
VALUES (
  'INBOX',
  'Where You Can Accept Messages Request Or Decline Them.',
  '/lovable-uploads/6956a4b0-6ccd-4236-ba93-468e58b85d40.png',
  1
);