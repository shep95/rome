-- Create team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create nomad_team_access table for approval workflow
CREATE TABLE public.nomad_team_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,
  approved BOOLEAN NOT NULL DEFAULT false,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomad_team_access ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

-- Helper function to check if user is team admin or owner
CREATE OR REPLACE FUNCTION public.is_team_admin(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid 
      AND user_id = user_uuid 
      AND role IN ('admin', 'owner')
  );
$$;

-- Helper function to check if user has NOMAD access via any team
CREATE OR REPLACE FUNCTION public.user_has_nomad_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.nomad_team_access nta ON nta.team_id = tm.team_id
    WHERE tm.user_id = user_uuid AND nta.approved = true
  );
$$;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they're members of"
  ON public.teams FOR SELECT
  USING (public.is_team_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams"
  ON public.teams FOR UPDATE
  USING (public.is_team_admin(id, auth.uid()));

CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team admins can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Team admins can update member roles"
  ON public.team_members FOR UPDATE
  USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Team admins can remove members"
  ON public.team_members FOR DELETE
  USING (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid());

-- RLS Policies for nomad_team_access
CREATE POLICY "Team members can view their team's NOMAD access status"
  ON public.nomad_team_access FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team admins can request NOMAD access"
  ON public.nomad_team_access FOR INSERT
  WITH CHECK (public.is_team_admin(team_id, auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Only service role can approve NOMAD access"
  ON public.nomad_team_access FOR UPDATE
  USING (auth.role() = 'service_role');

-- Trigger to auto-add creator as owner when team is created
CREATE OR REPLACE FUNCTION public.add_team_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_team_creator_as_owner();

-- Update updated_at timestamp
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();