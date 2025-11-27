import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, Settings, Shield, UserPlus, Trash2, CheckCircle } from "lucide-react";
import { UserSearchInput } from "./UserSearchInput";
import { useNomadAccess } from "@/hooks/useNomadAccess";

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
  user_role?: string;
  nomad_access?: {
    approved: boolean;
    requested_at: string;
  } | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const { hasAccess: userHasNomadAccess, loading: nomadLoading } = useNomadAccess();

  useEffect(() => {
    loadTeams();

    // Subscribe to real-time changes for teams, team members, and NOMAD access
    const teamsChannel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    const teamMembersChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        () => {
          loadTeams();
          if (selectedTeam) {
            loadTeamMembers(selectedTeam.id);
          }
        }
      )
      .subscribe();

    const nomadAccessChannel = supabase
      .channel('nomad-access-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nomad_team_access'
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
      supabase.removeChannel(nomadAccessChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          description,
          created_at,
          team_members (count),
          nomad_team_access (approved, requested_at)
        `)
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const teamsWithDetails = await Promise.all(
        (teamsData || []).map(async (team: any) => {
          const { data: memberData } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", team.id)
            .eq("user_id", user.id)
            .single();

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            created_at: team.created_at,
            member_count: team.team_members?.[0]?.count || 0,
            user_role: memberData?.role || "member",
            nomad_access: team.nomad_team_access?.[0] || null,
          };
        })
      );

      setTeams(teamsWithDetails);
    } catch (error: any) {
      toast.error("Failed to load teams: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      // First get team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("id, user_id, role, joined_at")
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Then get profiles for those users
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const membersWithProfiles = members.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          ...member,
          profiles: profile || {
            username: member.user_id.slice(0, 8),
            display_name: `User ${member.user_id.slice(0, 8)}`,
            avatar_url: null
          }
        };
      });

      setTeamMembers(membersWithProfiles as any);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      toast.error("Failed to load team members: " + error.message);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Team username is required");
      return;
    }

    // Validate no spaces in username
    if (/\s/.test(newTeamName)) {
      toast.error("Team username cannot contain spaces");
      return;
    }

    // Validate username format (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(newTeamName)) {
      toast.error("Team username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if team username is already taken
      const { data: existingTeam, error: checkError } = await supabase
        .from("teams")
        .select("name")
        .eq("name", newTeamName)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingTeam) {
        toast.error("Team username is already taken");
        return;
      }

      const { error } = await supabase
        .from("teams")
        .insert({
          name: newTeamName,
          description: newTeamDescription || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Team created successfully!");
      setNewTeamName("");
      setNewTeamDescription("");
      setIsCreateDialogOpen(false);
      loadTeams();
    } catch (error: any) {
      toast.error("Failed to create team: " + error.message);
    }
  };

  const addMember = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .insert({
          team_id: selectedTeam.id,
          user_id: userId,
          role: "member",
        });

      if (error) throw error;

      toast.success("Member added successfully!");
      setIsAddMemberDialogOpen(false);
      loadTeamMembers(selectedTeam.id);
    } catch (error: any) {
      toast.error("Failed to add member: " + error.message);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: "owner" | "admin" | "member") => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member role updated!");
      if (selectedTeam) loadTeamMembers(selectedTeam.id);
    } catch (error: any) {
      toast.error("Failed to update role: " + error.message);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member removed from team");
      if (selectedTeam) loadTeamMembers(selectedTeam.id);
    } catch (error: any) {
      toast.error("Failed to remove member: " + error.message);
    }
  };

  const requestNomadAccess = async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("nomad_team_access")
        .insert({
          team_id: teamId,
          requested_by: user.id,
        });

      if (error) throw error;

      toast.success("NOMAD access requested! Awaiting approval.");
      loadTeams();
    } catch (error: any) {
      toast.error("Failed to request NOMAD access: " + error.message);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;

      toast.success("Team deleted successfully");
      setTeamToDelete(null);
      setSelectedTeam(null);
      loadTeams();
    } catch (error: any) {
      toast.error("Failed to delete team: " + error.message);
    }
  };

  if (loading) {
    return <div className="p-6">Loading teams...</div>;
  }

  return (
    <div className="h-full flex">
      {/* NOMAD Access Status Banner */}
      {!nomadLoading && userHasNomadAccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <Badge variant="default" className="gap-2 px-4 py-2 text-sm shadow-lg">
            <CheckCircle className="w-4 h-4" />
            You have NOMAD Access
          </Badge>
        </div>
      )}

      {/* Teams List */}
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a team to collaborate and request NOMAD access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Team Username</Label>
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value.toLowerCase())}
                    placeholder="engineering_team"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    No spaces allowed. Use letters, numbers, underscores, or hyphens.
                  </p>
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Team description..."
                  />
                </div>
                <Button onClick={createTeam} className="w-full">
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto">
          {teams.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No teams yet. Create one to get started!
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedTeam?.id === team.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {team.name}
                      {team.nomad_access?.approved && (
                        <Badge variant="default" className="gap-1">
                          <Shield className="w-3 h-3" />
                          NOMAD
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {team.member_count} {team.member_count === 1 ? "member" : "members"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedTeam ? (
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{selectedTeam.name}</h1>
                {selectedTeam.description && (
                  <p className="text-muted-foreground mt-2">{selectedTeam.description}</p>
                )}
              </div>
              {selectedTeam.user_role === "owner" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setTeamToDelete(selectedTeam)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </Button>
              )}
            </div>

            {/* NOMAD Access Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  NOMAD Access
                </CardTitle>
                <CardDescription>
                  When approved, ALL team members automatically get NOMAD access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTeam.nomad_access ? (
                  <div className="space-y-2">
                    {selectedTeam.nomad_access.approved ? (
                      <>
                        <Badge variant="default" className="gap-1">
                          <Shield className="w-3 h-3" />
                          Access Approved - All Members Have Access
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Approved on {new Date(selectedTeam.nomad_access.requested_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          ✓ All {teamMembers.length} team members now have NOMAD access
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">Pending Approval</Badge>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(selectedTeam.nomad_access.requested_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Once approved, all team members will gain access automatically
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    {(selectedTeam.user_role === "admin" || selectedTeam.user_role === "owner") ? (
                      <>
                        <Button onClick={() => requestNomadAccess(selectedTeam.id)}>
                          Request NOMAD Access
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Once approved, all team members will automatically receive access
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Only team admins can request NOMAD access
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members ({teamMembers.length})
                  </span>
                  {(selectedTeam.user_role === "admin" || selectedTeam.user_role === "owner") && (
                    <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription>
                            Search for a user to add to your team
                          </DialogDescription>
                        </DialogHeader>
                        <UserSearchInput
                          onUserSelect={(user) => {
                            addMember(user.id);
                          }}
                          placeholder="Search users..."
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {member.profiles.display_name?.[0] || member.profiles.username[0]}
                        </div>
                        <div>
                          <div className="font-medium">{member.profiles.display_name || member.profiles.username}</div>
                          <div className="text-sm text-muted-foreground">@{member.profiles.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(selectedTeam.user_role === "admin" || selectedTeam.user_role === "owner") ? (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(value: "owner" | "admin" | "member") => updateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {selectedTeam.user_role === "owner" && (
                                  <SelectItem value="owner">Owner</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline">{member.role}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a team to view details
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{teamToDelete?.name}</span>? 
              This action cannot be undone. All team members will be removed and any pending NOMAD access requests will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToDelete && deleteTeam(teamToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};