import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { X, Trash2, AlertTriangle, History } from 'lucide-react';

interface DirectChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onUpdate?: () => void;
}

interface Participant {
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
    username: string;
  };
}

export const DirectChatSettings: React.FC<DirectChatSettingsProps> = ({
  isOpen,
  onClose,
  conversationId,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, conversationId]);

  const fetchParticipants = async () => {
    // Don't fetch for NOMAD conversations
    if (conversationId === 'nomad-ai-agent' || conversationId.startsWith('nomad-')) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user_id
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null);

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = data.map(p => p.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, username')
          .in('id', userIds);

        if (profileError) throw profileError;

        const participantsWithProfiles = data.map(participant => {
          const profile = profiles?.find(p => p.id === participant.user_id);
          return {
            ...participant,
            profiles: {
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url || '',
              username: profile?.username || ''
            }
          };
        });

        setParticipants(participantsWithProfiles);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load chat info",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConversation = async () => {
    setLoading(true);
    try {
      // Get the other participant's ID to track deleted contact
      const otherParticipant = participants.find(p => p.user_id !== user?.id);
      
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete participants
      await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Track deleted contact for reconnection
      if (otherParticipant && user) {
        await supabase
          .from('deleted_direct_contacts')
          .upsert({
            user_id: user.id,
            other_user_id: otherParticipant.user_id,
            deleted_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,other_user_id'
          });
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully"
      });

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ cleared_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chat history cleared successfully"
      });

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive"
      });
    } finally {
      setClearingHistory(false);
      setShowClearConfirm(false);
    }
  };

  const otherParticipant = participants.find(p => p.user_id !== user?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-0 bg-background/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-white/20">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Chat Sovereign Control</h2>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-2 sm:top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Chat Info */}
          {otherParticipant && (
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/30 border border-white/10">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-white/20 rounded-lg">
                <AvatarImage src={otherParticipant.profiles.avatar_url || ''} className="rounded-lg" />
                <AvatarFallback className="bg-primary/20 text-lg rounded-lg">
                  {otherParticipant.profiles.display_name?.charAt(0).toUpperCase() || 
                   otherParticipant.profiles.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-foreground truncate">
                  {otherParticipant.profiles.display_name || otherParticipant.profiles.username}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{otherParticipant.profiles.username}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  End-to-end encrypted conversation
                </p>
              </div>
            </div>
          )}

          {/* Clear History & Delete Conversation Section */}
          {!showDeleteConfirm && !showClearConfirm ? (
            <div className="space-y-4">
              {/* Clear History Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <History className="h-4 w-4" />
                  <span className="text-sm font-medium">Clear History</span>
                </div>
                <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Clear your message history. The conversation will remain active with a fresh start.
                  </p>
                  <Button
                    onClick={() => setShowClearConfirm(true)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                </div>
              </div>

              {/* Delete Conversation Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Danger Zone</span>
                </div>
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Delete this conversation and all messages. This action cannot be undone.
                  </p>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto bg-destructive/80 hover:bg-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Conversation
                  </Button>
                </div>
              </div>
            </div>
          ) : showClearConfirm ? (
            <div className="space-y-4">
              <div className="text-center">
                <History className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Clear Chat History?
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will clear your view of the conversation history. The conversation will remain active and {otherParticipant?.profiles.display_name || 'the other person'} will still see their messages.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowClearConfirm(false)}
                  variant="outline"
                  className="flex-1 bg-background/50 border-white/20"
                  disabled={clearingHistory}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClearHistory}
                  variant="outline"
                  className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  disabled={clearingHistory}
                >
                  <History className="h-4 w-4 mr-2" />
                  {clearingHistory ? 'Clearing...' : 'Clear History'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Delete Conversation?
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all messages in this conversation. This action cannot be undone.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1 bg-background/50 border-white/20"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConversation}
                  variant="destructive"
                  className="flex-1 bg-destructive/80 hover:bg-destructive"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};