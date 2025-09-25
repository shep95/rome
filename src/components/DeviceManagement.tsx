import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock, 
  AlertTriangle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface UserSession {
  id: string;
  device_fingerprint: string | null;
  user_agent: string | null;
  ip_address: unknown;
  last_activity: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export const DeviceManagement: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        toast.error('Failed to fetch active sessions');
        return;
      }

      setSessions(data || []);
    } catch (error) {
      toast.error('Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        toast.error('Failed to revoke session');
        return;
      }

      toast.success('Session revoked successfully');
      await fetchActiveSessions(); // Refresh the list
    } catch (error) {
      toast.error('Error revoking session');
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      // Get current session to exclude it
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('session_token', session?.access_token || '');

      if (error) {
        toast.error('Failed to revoke other sessions');
        return;
      }

      toast.success('All other sessions revoked successfully');
      await fetchActiveSessions();
    } catch (error) {
      toast.error('Error revoking sessions');
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="w-5 h-5" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Device';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('android')) return 'Android Device';
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('mobile')) return 'Mobile Device';
    if (ua.includes('tablet')) return 'Tablet';
    if (ua.includes('windows')) return 'Windows Computer';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Computer';
    if (ua.includes('linux')) return 'Linux Computer';
    return 'Desktop Computer';
  };

  const getBrowser = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Browser';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown Browser';
  };

  const isCurrentSession = (session: UserSession) => {
    // Simple heuristic: the most recent session is likely the current one
    return sessions[0]?.id === session.id;
  };

  if (loading) {
    return (
      <div className="pt-4 border-t border-border">
        <Label className="text-foreground text-lg font-medium">Active Devices</Label>
        <p className="text-muted-foreground text-sm mb-4">Loading active sessions...</p>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Label className="text-foreground text-lg font-medium">Active Devices</Label>
          <p className="text-muted-foreground text-sm">Manage devices signed into your account</p>
        </div>
        {sessions.length > 1 && (
          <Button
            onClick={revokeAllOtherSessions}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Sign Out All Others
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-muted/10 border-border">
          <CardContent className="p-4 text-center">
            <Monitor className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No active sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-muted/10 border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-muted-foreground mt-1">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-foreground font-medium">
                          {getDeviceType(session.user_agent)}
                        </p>
                        {isCurrentSession(session) && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Current Device
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{getBrowser(session.user_agent)}</span>
                        </div>
                        
                        {session.ip_address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{String(session.ip_address)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Last active {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="text-xs">
                          Signed in {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentSession(session) && (
                    <Button
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-4"
                    >
                      {revoking === session.id ? (
                        <span className="text-xs">Signing out...</span>
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-muted/10 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Security tip:</strong> If you see any suspicious activity or devices you don't recognize, 
          sign them out immediately and consider changing your password.
        </p>
      </div>
    </div>
  );
};