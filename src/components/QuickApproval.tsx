import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, CheckCircle } from "lucide-react";

export const QuickApproval = () => {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const approveZorakCorp = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call admin operations to approve zorak_corp
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'approve_nomad_access',
          teamId: '80a0c0ca-339b-402d-8d54-06c2e95007bc', // zorak_corp access request ID
          approved: true,
          notes: 'Approved via quick approval'
        }
      });

      if (error) throw error;

      setApproved(true);
      toast.success("NOMAD access approved for zorak_corp! All team members now have access.");
    } catch (error: any) {
      console.error('Error approving:', error);
      toast.error("Failed to approve: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Quick NOMAD Approval
        </CardTitle>
        <CardDescription>
          Approve zorak_corp team for NOMAD access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {approved ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-5 h-5" />
            zorak_corp approved! All team members now have NOMAD access.
          </div>
        ) : (
          <Button 
            onClick={approveZorakCorp} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Approving..." : "Approve zorak_corp for NOMAD"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
