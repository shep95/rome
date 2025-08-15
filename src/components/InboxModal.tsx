import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  is_incoming?: boolean;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestCount: number;
  onRequestCountChange: (count: number) => void;
}

export const InboxModal = ({ isOpen, onClose, requestCount, onRequestCountChange }: InboxModalProps) => {
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MessageRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMessageRequests();
      setupRealtimeSubscription();
    }
  }, [isOpen]);

  // Listen for message request sent events
  useEffect(() => {
    const handleMessageRequestSent = () => {
      if (isOpen) {
        loadMessageRequests();
      }
    };

    window.addEventListener('messageRequestSent', handleMessageRequestSent);
    return () => window.removeEventListener('messageRequestSent', handleMessageRequestSent);
  }, [isOpen]);

  const loadMessageRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get both incoming and outgoing message requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('message_requests')
        .select('*')
        .or(`to_user_id.eq.${user.id},from_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get profile data for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          // For incoming requests, get sender profile
          // For outgoing requests, get recipient profile
          const profileUserId = request.to_user_id === user.id ? request.from_user_id : request.to_user_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', profileUserId)
            .single();

          return {
            ...request,
            is_incoming: request.to_user_id === user.id,
            profiles: profile || { username: '', display_name: '', avatar_url: '' }
          } as MessageRequest & { is_incoming: boolean };
        })
      );

      setRequests(requestsWithProfiles);
      // Only count incoming pending requests for notification badge
      const incomingPendingCount = requestsWithProfiles.filter(
        req => req.is_incoming && req.status === 'pending'
      ).length;
      onRequestCountChange(incomingPendingCount);
    } catch (error) {
      console.error('Error loading message requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('inbox-message-requests')
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
      console.log(`Attempting to ${action} request ${requestId}`);
      
      // Only allow accepting incoming requests
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      if (action === 'accepted' && !request.is_incoming) {
        throw new Error('Cannot accept outgoing requests');
      }
      
      const { error } = await supabase
        .from('message_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating message request status:', error);
        throw error;
      }
      
      console.log(`Successfully updated message request status to ${action}`);

      // If accepted, create a conversation and add the initial message
      if (action === 'accepted') {
        if (request) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('No authenticated user found');
            return;
          }

          // Check if conversation already exists between these users
          console.log('Checking for existing conversation...');
          const { data: existingConversations } = await supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
              conversations!inner (
                id,
                type
              )
            `)
            .eq('user_id', user.id);

          let existingDirectConversation = null;
          if (existingConversations) {
            for (const convParticipant of existingConversations) {
              if (convParticipant.conversations?.type === 'direct') {
                // Check if the other user is also a participant in this conversation
                const { data: otherParticipant } = await supabase
                  .from('conversation_participants')
                  .select('user_id')
                  .eq('conversation_id', convParticipant.conversation_id)
                  .eq('user_id', request.from_user_id)
                  .is('left_at', null)
                  .single();

                if (otherParticipant) {
                  existingDirectConversation = convParticipant.conversations;
                  break;
                }
              }
            }
          }

          if (existingDirectConversation) {
            console.log('Found existing conversation:', existingDirectConversation.id);
            toast({
              title: "Request accepted!",
              description: "Conversation already exists. Check your Messages tab.",
            });
          } else {
            console.log('Creating new conversation...');
            // Create conversation
            const { data: conversation, error: convError } = await supabase
              .from('conversations')
              .insert({
                type: 'direct',
                created_by: request.from_user_id,
                name: `${request.profiles.display_name || request.profiles.username}`
              })
              .select()
              .single();

            if (convError) {
              console.error('Error creating conversation:', convError);
              throw convError;
            }

            console.log('Conversation created:', conversation);
            console.log('Adding participants...');
            
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

            if (participantError) {
              console.error('Error adding participants:', participantError);
              throw participantError;
            }
            
            console.log('Participants added successfully');
            
            toast({
              title: "Request accepted!",
              description: "A new conversation has been started. Check your Messages tab.",
            });
          }
          
          // Force reload conversations by triggering a custom event
          window.dispatchEvent(new CustomEvent('conversationCreated'));
        }
      } else {
        toast({
          title: "Request declined",
          description: "The message request has been declined.",
        });
      }

      setSelectedRequest(null);
      loadMessageRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} request: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const incomingPending = requests.filter(req => req.is_incoming && req.status === 'pending');
  const outgoingPending = requests.filter(req => !req.is_incoming && req.status === 'pending');
  const incomingPast = requests.filter(req => req.is_incoming && req.status !== 'pending');
  const outgoingPast = requests.filter(req => !req.is_incoming && req.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Inbox
            {incomingPending.length > 0 && (
              <Badge variant="destructive">{incomingPending.length} pending</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading requests...</div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-2">📥</div>
                  <p>No message requests found</p>
                  <p className="text-sm">When someone sends you a message request, it will appear here</p>
                </div>
              ) : (
                <>
                  {/* Incoming Pending Requests */}
                  {incomingPending.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Incoming Requests</h3>
                      {incomingPending.map((request) => (
                        <div key={request.id} className="bg-card p-4 rounded-lg border border-primary/20 shadow-sm">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.profiles.avatar_url} />
                              <AvatarFallback className="bg-primary/10">
                                {request.profiles.display_name?.[0] || request.profiles.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {request.profiles.display_name || request.profiles.username}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    @{request.profiles.username}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(request.created_at)}
                                  </span>
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                </div>
                              </div>
                              
                              <div 
                                className="bg-accent/50 p-3 rounded-md mb-3 cursor-pointer hover:bg-accent/70 transition-colors"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <p className="text-sm text-foreground">
                                  {truncateMessage(request.message)}
                                </p>
                                {request.message.length > 50 && (
                                  <button className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline">
                                    <Eye className="h-3 w-3" />
                                    View full message
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleRequestAction(request.id, 'accepted')}
                                  className="flex items-center gap-1 bg-primary hover:bg-primary/90"
                                  disabled={!request.is_incoming}
                                >
                                  <Check className="h-3 w-3" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestAction(request.id, 'declined')}
                                  className="flex items-center gap-1"
                                  disabled={!request.is_incoming}
                                >
                                  <X className="h-3 w-3" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outgoing Pending Requests */}
                  {outgoingPending.length > 0 && (
                    <div className="space-y-3">
                      {incomingPending.length > 0 && <div className="border-t pt-3" />}
                      <h3 className="text-sm font-medium text-muted-foreground">Sent Requests</h3>
                      {outgoingPending.map((request) => (
                        <div key={request.id} className="bg-card/50 p-4 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.profiles.avatar_url} />
                              <AvatarFallback className="bg-orange-100 dark:bg-orange-900">
                                {request.profiles.display_name?.[0] || request.profiles.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {request.profiles.display_name || request.profiles.username}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    @{request.profiles.username}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(request.created_at)}
                                  </span>
                                  <Badge variant="outline" className="flex items-center gap-1 border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                                    <Clock className="h-3 w-3" />
                                    Awaiting Response
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-md">
                                <p className="text-sm text-foreground">
                                  {truncateMessage(request.message)}
                                </p>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-2">
                                Message sent and waiting for {request.profiles.display_name || request.profiles.username} to respond
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Past Requests (Both Incoming and Outgoing) */}
                  {(incomingPast.length > 0 || outgoingPast.length > 0) && (
                    <div className="space-y-3">
                      {(incomingPending.length > 0 || outgoingPending.length > 0) && <div className="border-t pt-3" />}
                      <h3 className="text-sm font-medium text-muted-foreground">Past Requests</h3>
                      {[...incomingPast, ...outgoingPast]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((request) => (
                        <div key={request.id} className="bg-muted/30 p-4 rounded-lg border opacity-70">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={request.profiles.avatar_url} />
                              <AvatarFallback className="bg-muted">
                                {request.profiles.display_name?.[0] || request.profiles.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <p className="font-medium text-sm">
                                    {request.profiles.display_name || request.profiles.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {request.is_incoming ? 'Sent to you' : 'You sent'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(request.created_at)}
                                  </span>
                                  <Badge variant={request.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                                    {request.status}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {truncateMessage(request.message, 80)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Full Message Preview Modal */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedRequest.profiles.avatar_url} />
                    <AvatarFallback>
                      {selectedRequest.profiles.display_name?.[0] || selectedRequest.profiles.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  Message from {selectedRequest.profiles.display_name || selectedRequest.profiles.username}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-accent/50 p-4 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleRequestAction(selectedRequest.id, 'declined')}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                  <Button
                    onClick={() => handleRequestAction(selectedRequest.id, 'accepted')}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Accept & Start Chat
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};