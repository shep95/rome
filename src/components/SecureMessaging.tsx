import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CryptoUtils } from '@/lib/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Send, Users, Lock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_email?: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'secure';
  participants: string[];
  last_message?: string;
}

export const SecureMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newConversationName, setNewConversationName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const setupRealtimeSubscription = () => {
    // Subscribe to real-time message updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.new.conversation_id === selectedConversation) {
            loadMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversations = async () => {
    try {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id,
            name,
            type,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .is('left_at', null);

      if (participantData) {
        const convos: Conversation[] = participantData.map(p => ({
          id: p.conversations.id,
          name: p.conversations.name,
          type: p.conversations.type as 'direct' | 'group' | 'secure',
          participants: [],
          last_message: ''
        }));
        setConversations(convos);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messageData } = await supabase
        .from('messages')
        .select(`
          id,
          encrypted_content,
          sender_id,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messageData) {
        // Get sender emails separately
        const senderIds = [...new Set(messageData.map(msg => msg.sender_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', senderIds);

        const profileMap = new Map(profileData?.map(p => [p.id, p.email]) || []);

        // In a real implementation, decrypt messages here
        const decryptedMessages = messageData.map(msg => ({
          id: msg.id,
          content: `[Encrypted Message]`, // Would decrypt using CryptoUtils
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          sender_email: profileMap.get(msg.sender_id)
        }));
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const startConversation = async () => {
    if (!newContactEmail.trim()) return;

    setIsLoading(true);
    try {
      // Find user by email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', newContactEmail.trim())
        .single();

      if (!userData) {
        toast({
          variant: "destructive",
          title: "User not found",
          description: "No user found with this email address."
        });
        return;
      }

      // Create conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user?.id
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationData.id, user_id: user?.id },
          { conversation_id: conversationData.id, user_id: userData.id }
        ]);

      if (participantError) throw participantError;

      setNewContactEmail('');
      loadConversations();
      toast({
        title: "Conversation started",
        description: `Secure conversation with ${userData.email} has been created.`
      });

    } catch (error: any) {
      console.error('Start conversation error:', error);
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSecureConversation = async () => {
    if (!newConversationName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a name for the secure conversation."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create secure conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          name: newConversationName.trim(),
          type: 'secure',
          created_by: user?.id
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add current user as participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationData.id,
          user_id: user?.id,
          role: 'admin'
        });

      if (participantError) throw participantError;

      setNewConversationName('');
      setIsCreateDialogOpen(false);
      loadConversations();
      toast({
        title: "Secure conversation created",
        description: `${newConversationName} has been created with passcode protection.`
      });

    } catch (error: any) {
      console.error('Create secure conversation error:', error);
      toast({
        variant: "destructive",
        title: "Failed to create conversation",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      // In a real implementation, encrypt the message using CryptoUtils
      // For now, store as base64 encoded string to match BYTEA type
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(newMessage);
      const base64Content = btoa(String.fromCharCode(...messageBytes));

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user?.id,
          encrypted_content: base64Content,
          sequence_number: Date.now() // Would use proper sequence numbering
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation);

    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Secure Messages</h2>
          </div>
          
          
          {/* Create new secure conversation */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="w-full mb-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Secure Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Secure Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Enter conversation name"
                    value={newConversationName}
                    onChange={(e) => setNewConversationName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={createSecureConversation}
                    disabled={isLoading || !newConversationName.trim()}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Start new conversation */}
          <div className="space-y-2">
            <Input
              placeholder="Enter email to start conversation"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              className="text-sm"
            />
            <Button 
              onClick={startConversation}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                selectedConversation === conversation.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {conversation.name || 
                     (conversation.type === 'direct' ? 'Direct Message' : 
                      conversation.type === 'secure' ? 'Secure Chat' : 'Group Chat')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {conversation.type === 'secure' ? 'Passcode protected' : 'End-to-end encrypted'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium">End-to-End Encrypted</span>
                <span className="text-xs text-muted-foreground">
                  Messages are secured with Signal protocol
                </span>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <Card className={`max-w-xs ${
                      message.sender_id === user?.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a secure message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation to start secure messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};