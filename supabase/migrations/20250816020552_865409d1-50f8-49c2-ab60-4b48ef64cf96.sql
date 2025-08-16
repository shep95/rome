-- Fix security linter issues
ALTER TABLE public.security_honeypot ENABLE ROW LEVEL SECURITY;

-- Fix function search paths
DROP FUNCTION IF EXISTS generate_entropy_vector();
CREATE OR REPLACE FUNCTION generate_entropy_vector()
RETURNS bytea
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gen_random_bytes(32);
$$;

DROP FUNCTION IF EXISTS add_entropy_vector();
CREATE OR REPLACE FUNCTION add_entropy_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.entropy_vector = generate_entropy_vector();
  RETURN NEW;
END;
$$;