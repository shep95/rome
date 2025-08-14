-- Create secure_files table for user posts with file attachments
CREATE TABLE IF NOT EXISTS public.secure_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secure_files ENABLE ROW LEVEL SECURITY;

-- Create policies for secure files
CREATE POLICY "Users can manage their own secure files" 
ON public.secure_files 
FOR ALL 
USING (auth.uid() = user_id);

-- Create storage bucket for secure files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('secure-files', 'secure-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for secure files
CREATE POLICY "Users can view their own secure files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own secure files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own secure files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own secure files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'secure-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_secure_files_updated_at
BEFORE UPDATE ON public.secure_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();