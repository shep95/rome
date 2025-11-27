import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const AdminSetup = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const grantAdminAccess = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setProcessing(true);
    try {
      // Insert admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (error) {
        // Check if already admin
        if (error.code === '23505') { // Unique constraint violation
          setIsAdmin(true);
          toast.success("You already have admin access!");
        } else {
          throw error;
        }
      } else {
        setIsAdmin(true);
        toast.success("Admin access granted successfully!");
      }
    } catch (error: any) {
      console.error('Error granting admin access:', error);
      toast.error("Failed to grant admin access: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Admin Access Granted
            </CardTitle>
            <CardDescription>
              You now have administrator privileges. You can access the Admin Panel from the navigation menu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Grant Admin Access
          </CardTitle>
          <CardDescription>
            Click the button below to grant yourself administrator privileges for this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Admin privileges include:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Approve/deny NOMAD access requests</li>
              <li>Manage user roles</li>
              <li>View system analytics</li>
              <li>Access admin panel</li>
            </ul>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Current user: <span className="font-mono">{user?.email}</span>
          </div>

          <Button 
            onClick={grantAdminAccess}
            disabled={processing}
            className="w-full gap-2"
          >
            <Shield className="w-4 h-4" />
            {processing ? "Processing..." : "Grant Admin Access"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};