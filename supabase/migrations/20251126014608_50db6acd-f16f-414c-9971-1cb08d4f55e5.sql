-- Create file_tags table for custom tags and categories
CREATE TABLE IF NOT EXISTS public.file_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.secure_files(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  UNIQUE(file_id, tag_name)
);

-- Enable RLS
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_tags
CREATE POLICY "Users can view their own file tags"
  ON public.file_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file tags"
  ON public.file_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file tags"
  ON public.file_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Create file_versions table for version history
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.secure_files(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  secure_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  change_description TEXT
);

-- Enable RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_versions
CREATE POLICY "Users can view their own file versions"
  ON public.file_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file versions"
  ON public.file_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON public.file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_user_id ON public.file_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_user_id ON public.file_versions(user_id);

-- Update secure_files table to add view_count and last_accessed
ALTER TABLE public.secure_files 
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;