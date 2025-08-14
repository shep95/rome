import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageRequest {
  id: string;
  from_user_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface MessageRequestsProps {
  requestCount: number;
  onRequestCountChange: (count: number) => void;
}

export const MessageRequests = ({ requestCount, onRequestCountChange }: MessageRequestsProps) => {
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMessageRequests();
    setupRealtimeSubscription();
  }, []);

  const loadMessageRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get message requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('message_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then get profile data for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', request.from_user_id)
            .single();

          return {
            ...request,
            profiles: profile || { username: '', display_name: '', avatar_url: '' }
          } as MessageRequest;
        })
      );

      setRequests(requestsWithProfiles);
      const pendingCount = requestsWithProfiles.filter(req => req.status === 'pending').length;
      onRequestCountChange(pendingCount);
    } catch (error) {
      console.error('Error loading message requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('message-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests'
        },
        () => {
          loadMessageRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRequestAction = async (requestId: string, action: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      // If accepted, create a conversation
      if (action === 'accepted') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Create conversation
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              type: 'direct',
              created_by: request.from_user_id
            })
            .select()
            .single();

          if (convError) throw convError;

          // Add both users as participants
          const { error: participantError } = await supabase
            .from('conversation_participants')
            .insert([
              {
                conversation_id: conversation.id,
                user_id: request.from_user_id,
                role: 'member'
              },
              {
                conversation_id: conversation.id,
                user_id: user.id,
                role: 'member'
              }
            ]);

          if (participantError) throw participantError;
        }
      }

      toast({
        title: action === 'accepted' ? "Request accepted!" : "Request declined",
        description: action === 'accepted' ? 
          "A new conversation has been started." : 
          "The message request has been declined.",
      });

      loadMessageRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const otherRequests = requests.filter(req => req.status !== 'pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Message Requests</h2>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive">{pendingRequests.length}</Badge>
        )}
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {pendingRequests.length === 0 && otherRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No message requests found
            </div>
          ) : (
            <>
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-card p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profiles.avatar_url} />
                      <AvatarFallback>
                        {request.profiles.display_name?.[0] || request.profiles.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-medium">
                          {request.profiles.display_name || request.profiles.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.profiles.username}
                        </p>
                      </div>
                      <p className="text-sm bg-accent p-2 rounded">
                        {request.message}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'accepted')}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAction(request.id, 'declined')}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Decline
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}

              {otherRequests.map((request) => (
                <div key={request.id} className="bg-muted/30 p-4 rounded-lg border opacity-60">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profiles.avatar_url} />
                      <AvatarFallback>
                        {request.profiles.display_name?.[0] || request.profiles.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {request.profiles.display_name || request.profiles.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.message}
                      </p>
                    </div>
                    <Badge variant={request.status === 'accepted' ? 'default' : 'secondary'}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};