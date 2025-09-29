-- Add login_username column to profiles table for separate login credentials
ALTER TABLE public.profiles ADD COLUMN login_username TEXT;

-- Create unique index on login_username for fast lookups
CREATE UNIQUE INDEX idx_profiles_login_username ON public.profiles(login_username) WHERE login_username IS NOT NULL;

-- Update existing profiles to use current username as login_username
UPDATE public.profiles SET login_username = username WHERE login_username IS NULL;