-- Create secure-files storage bucket for secure file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('secure-files', 'secure-files', false);

-- Create storage policies for secure files
CREATE POLICY "Users can upload their own secure files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own secure files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own secure files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own secure files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create call_history table for real call data
CREATE TABLE IF NOT EXISTS public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_avatar TEXT,
  call_type TEXT NOT NULL CHECK (call_type IN ('incoming', 'outgoing', 'missed', 'video')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for call_history
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for call_history
CREATE POLICY "Users can view their own call history" 
ON public.call_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call history" 
ON public.call_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call history" 
ON public.call_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call history" 
ON public.call_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add some sample call history data for demonstration
INSERT INTO public.call_history (user_id, contact_name, contact_phone, call_type, duration_seconds, created_at)
SELECT 
  auth.uid(),
  'Alice Johnson',
  '+1 (555) 123-4567',
  'incoming',
  765,
  now() - interval '2 hours'
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.call_history (user_id, contact_name, contact_phone, call_type, duration_seconds, created_at)
SELECT 
  auth.uid(),
  'Bob Smith', 
  '+1 (555) 987-6543',
  'outgoing',
  323,
  now() - interval '4 hours'
WHERE auth.uid() IS NOT NULL;