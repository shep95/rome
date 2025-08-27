import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertCircle, User, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AnonymousLogEntry {
  id: string;
  message_id: string;
  anonymous_id: string;
  real_sender_id: string;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  message_content?: string;
}

interface AnonymousMessageLogProps {
  conversationId: string;
  isAdmin: boolean;
}

export const AnonymousMessageLog: React.FC<AnonymousMessageLogProps> = ({
  conversationId,
  isAdmin
}) => {
  const { user } = useAuth();
  const [logEntries, setLogEntries] = useState<AnonymousLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && isAdmin) {
      loadAnonymousLog();
    }
  }, [open, conversationId, isAdmin]);

  const loadAnonymousLog = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data: logData, error } = await supabase
        .from('anonymous_message_log')
        .select(`
          id,
          message_id,
          anonymous_id,
          real_sender_id,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load user profiles for the real senders
      const userIds = Array.from(new Set(logData?.map(entry => entry.real_sender_id) || []));
      let profileMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);
        
        profilesData?.forEach(p => {
          profileMap.set(p.id, p);
        });
      }

      // Get message content preview (first 100 chars)
      const messageIds = logData?.map(entry => entry.message_id) || [];
      let messageMap = new Map();
      
      if (messageIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, data_payload')
          .in('id', messageIds);
        
        // Note: In a real implementation, you'd need to decrypt these messages
        // For now, we'll just show a placeholder
        messagesData?.forEach(m => {
          messageMap.set(m.id, '[Message content - encrypted]');
        });
      }

      const entriesWithProfiles = logData?.map(entry => ({
        ...entry,
        profile: profileMap.get(entry.real_sender_id),
        message_content: messageMap.get(entry.message_id)
      })) || [];

      setLogEntries(entriesWithProfiles);
    } catch (error) {
      console.error('Error loading anonymous log:', error);
      toast.error('Failed to load anonymous message log');
    } finally {
      setLoading(false);
    }
  };

  const revokeAnonymousPrivilege = async (userId: string, displayName: string) => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({
          can_post_anonymously: false,
          anonymous_revoked_at: new Date().toISOString(),
          anonymous_revoked_by: user?.id
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Anonymous privilege revoked for ${displayName}`);
      setOpen(false);
    } catch (error) {
      console.error('Error revoking anonymous privilege:', error);
      toast.error('Failed to revoke anonymous privilege');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Anonymous Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Anonymous Message Log
            <Badge variant="secondary" className="text-xs">
              Admin Only
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Confidential Information
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                This log shows the real identities behind anonymous messages. Use this information responsibly and only for moderation purposes.
              </p>
            </div>
          </div>

          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No anonymous messages found in this conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {entry.profile?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {entry.profile?.display_name || entry.profile?.username || 'Unknown User'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {entry.anonymous_id}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {entry.message_content}
                      </p>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => revokeAnonymousPrivilege(
                          entry.real_sender_id,
                          entry.profile?.display_name || 'User'
                        )}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Revoke Anonymous Privilege
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};