-- Track deleted direct contacts so users can reconnect later
CREATE TABLE IF NOT EXISTS public.deleted_direct_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  other_user_id uuid NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_direct_contacts ENABLE ROW LEVEL SECURITY;

-- Ensure uniqueness per user -> other mapping
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deleted_direct_contacts_unique'
  ) THEN
    ALTER TABLE public.deleted_direct_contacts
    ADD CONSTRAINT deleted_direct_contacts_unique UNIQUE (user_id, other_user_id);
  END IF;
END $$;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their deleted contacts'
  ) THEN
    CREATE POLICY "Users can view their deleted contacts"
    ON public.deleted_direct_contacts
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can record their deleted contacts'
  ) THEN
    CREATE POLICY "Users can record their deleted contacts"
    ON public.deleted_direct_contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their deleted contacts'
  ) THEN
    CREATE POLICY "Users can update their deleted contacts"
    ON public.deleted_direct_contacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can remove their deleted contacts'
  ) THEN
    CREATE POLICY "Users can remove their deleted contacts"
    ON public.deleted_direct_contacts
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;