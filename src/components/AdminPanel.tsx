import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Users, Clock } from "lucide-react";

interface NomadRequest {
  id: string;
  team_id: string;
  requested_at: string;
  member_count?: number;
  teams: {
    name: string;
    description: string | null;
  };
  profiles: {
    username: string;
    display_name: string;
  };
}

export const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<NomadRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NomadRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPendingRequests();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'check_admin' }
      });

      if (error) throw error;
      setIsAdmin(data?.isAdmin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_pending_requests' }
      });

      if (error) throw error;
      setRequests(data?.requests || []);
    } catch (error: any) {
      toast.error("Failed to load requests: " + error.message);
    }
  };

  const handleApprove = async (approve: boolean) => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'approve_nomad_access',
          teamId: selectedRequest.id,
          approved: approve,
          notes: notes || null
        }
      });

      if (error) throw error;

      if (approve) {
        toast.success(
          `NOMAD access approved! All ${selectedRequest.member_count || 0} team members now have access automatically.`
        );
      } else {
        toast.success("NOMAD access denied");
      }
      
      setSelectedRequest(null);
      setNotes("");
      loadPendingRequests();
    } catch (error: any) {
      toast.error("Failed to process request: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have administrator privileges.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage NOMAD access requests and system settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending NOMAD Access Requests
          </CardTitle>
          <CardDescription>
            Review and approve team requests for NOMAD AI agent access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No pending requests
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold">{request.teams.name}</h3>
                    </div>
                    {request.teams.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.teams.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Requested by {request.profiles.display_name || request.profiles.username}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review NOMAD Access Request</DialogTitle>
            <DialogDescription>
              Review this team's request for NOMAD AI agent access
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">{selectedRequest.teams.name}</h3>
                {selectedRequest.teams.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.teams.description}
                  </p>
                )}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Requested by: </span>
                <span className="font-medium">
                  {selectedRequest.profiles.display_name || selectedRequest.profiles.username}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(true)}
                  disabled={processing}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleApprove(false)}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};