-- Enable pgcrypto extension first
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix security linter issues  
ALTER TABLE public.security_honeypot ENABLE ROW LEVEL SECURITY;

-- Drop triggers first, then functions
DROP TRIGGER IF EXISTS messages_entropy_trigger ON public.messages;
DROP TRIGGER IF EXISTS secure_files_entropy_trigger ON public.secure_files;

-- Drop and recreate functions with proper search paths
DROP FUNCTION IF EXISTS add_entropy_vector() CASCADE;
DROP FUNCTION IF EXISTS generate_entropy_vector() CASCADE;

CREATE OR REPLACE FUNCTION generate_entropy_vector()
RETURNS bytea
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT gen_random_bytes(32);
$$;

CREATE OR REPLACE FUNCTION add_entropy_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.entropy_vector = generate_entropy_vector();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER messages_entropy_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION add_entropy_vector();

CREATE TRIGGER secure_files_entropy_trigger
  BEFORE INSERT ON public.secure_files
  FOR EACH ROW
  EXECUTE FUNCTION add_entropy_vector();