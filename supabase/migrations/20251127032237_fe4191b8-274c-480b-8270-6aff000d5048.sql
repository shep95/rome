-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- Update NOMAD access policy to allow admins to approve
DROP POLICY IF EXISTS "Only service role can approve NOMAD access" ON public.nomad_team_access;

CREATE POLICY "Admins can approve NOMAD access"
  ON public.nomad_team_access FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create view for pending NOMAD requests (admins only)
CREATE OR REPLACE VIEW public.pending_nomad_requests AS
SELECT 
  nta.id,
  nta.team_id,
  nta.approved,
  nta.requested_at,
  nta.requested_by,
  nta.notes,
  t.name as team_name,
  t.description as team_description,
  p.username as requester_username,
  p.display_name as requester_display_name,
  (SELECT COUNT(*) FROM team_members WHERE team_id = nta.team_id) as member_count
FROM public.nomad_team_access nta
JOIN public.teams t ON t.id = nta.team_id
JOIN public.profiles p ON p.id = nta.requested_by
WHERE nta.approved = false;

-- Grant access to view
GRANT SELECT ON public.pending_nomad_requests TO authenticated;