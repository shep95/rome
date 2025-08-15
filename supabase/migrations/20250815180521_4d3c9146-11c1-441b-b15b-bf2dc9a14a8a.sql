-- Update profiles table to have screenshot protection enabled by default
ALTER TABLE public.profiles 
ALTER COLUMN screenshot_protection_enabled SET DEFAULT true;