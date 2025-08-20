import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, MessageCircle, History } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ReconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreviousContact {
  user_id: string;
  last_interaction: string;
  profile: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const ReconnectModal: React.FC<ReconnectModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [previousContacts, setPreviousContacts] = useState<PreviousContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<PreviousContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<PreviousContact | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreviousContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredContacts(
        previousContacts.filter(contact =>
          contact.profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.profile.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredContacts(previousContacts);
    }
  }, [searchQuery, previousContacts]);

  const loadPreviousContacts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all past conversation participants (including deleted conversations)
      // We'll look for users who had conversations with current user but don't have active ones
      const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          conversation_id,
          joined_at,
          left_at,
          conversations!inner(
            type,
            created_at
          )
        `)
        .neq('user_id', user.id)
        .eq('conversations.type', 'direct'); // Only direct conversations

      if (participantsError) throw participantsError;

      // Get current active conversations to exclude
      const { data: activeConversations, error: activeError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (activeError) throw activeError;

      const activeConversationIds = new Set(activeConversations?.map(c => c.conversation_id) || []);

      // Filter out users who still have active conversations with current user
      const pastContacts = new Map<string, { user_id: string; last_interaction: string }>();
      
      allParticipants?.forEach((participant: any) => {
        // Skip if this conversation is still active
        if (activeConversationIds.has(participant.conversation_id)) return;

        const lastInteraction = participant.left_at || participant.conversations.created_at;
        const existing = pastContacts.get(participant.user_id);
        
        if (!existing || new Date(lastInteraction) > new Date(existing.last_interaction)) {
          pastContacts.set(participant.user_id, {
            user_id: participant.user_id,
            last_interaction: lastInteraction
          });
        }
      });

      // Get profiles for these users
      const userIds = Array.from(pastContacts.keys());
      if (userIds.length === 0) {
        setPreviousContacts([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const contacts: PreviousContact[] = profiles?.map(profile => ({
        user_id: profile.id,
        last_interaction: pastContacts.get(profile.id)?.last_interaction || '',
        profile: {
          display_name: profile.display_name || '',
          username: profile.username || '',
          avatar_url: profile.avatar_url || undefined
        }
      })) || [];

      // Sort by most recent interaction
      contacts.sort((a, b) => new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime());

      setPreviousContacts(contacts);
    } catch (error) {
      console.error('Error loading previous contacts:', error);
      toast.error('Failed to load previous contacts');
    } finally {
      setLoading(false);
    }
  };

  const sendMessageRequest = async () => {
    if (!selectedContact || !message.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('message_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: selectedContact.user_id,
          message: message.trim()
        });

      if (error) throw error;

      toast.success('Message request sent!', {
        description: `Your message request has been sent to ${selectedContact.profile.display_name || selectedContact.profile.username}`
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent('messageRequestSent'));

      onClose();
      setSelectedContact(null);
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message request:', error);
      
      if (error.code === '23505') {
        toast.error('Message request already sent', {
          description: 'You have already sent a message request to this person'
        });
      } else {
        toast.error('Failed to send message request');
      }
    } finally {
      setSending(false);
    }
  };

  const handleContactSelect = (contact: PreviousContact) => {
    setSelectedContact(contact);
    setMessage(`Hi ${contact.profile.display_name || contact.profile.username}! I'd like to reconnect and chat again.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Reconnect with Previous Contacts
          </DialogTitle>
        </DialogHeader>

        {!selectedContact ? (
          <div className="flex-1 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search previous contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading previous contacts...</div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No previous contacts found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchQuery.trim() 
                      ? "No contacts match your search criteria"
                      : "You haven't had any previous conversations that were deleted. Start a new conversation to connect with others!"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.user_id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.profile.avatar_url} />
                        <AvatarFallback>
                          {(contact.profile.display_name || contact.profile.username)?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {contact.profile.display_name || contact.profile.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{contact.profile.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last interaction: {new Date(contact.last_interaction).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Reconnect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {/* Selected Contact */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact.profile.avatar_url} />
                <AvatarFallback>
                  {(selectedContact.profile.display_name || selectedContact.profile.username)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {selectedContact.profile.display_name || selectedContact.profile.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{selectedContact.profile.username}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedContact(null)}
              >
                Change
              </Button>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message to {selectedContact.profile.display_name || selectedContact.profile.username}:
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/500
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedContact(null)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={sendMessageRequest}
                disabled={!message.trim() || sending}
                className="flex-1"
              >
                {sending ? 'Sending...' : 'Send Message Request'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};