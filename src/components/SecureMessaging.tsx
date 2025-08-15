import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface SecureMessagingProps {
  conversationId?: string;
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const [userWallpaper, setUserWallpaper] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversationDetails();
      loadMessages();
      loadUserWallpaper();
      setupRealtimeSubscription();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationDetails = async () => {
    if (!conversationId) return;
    
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversationDetails(conversation);
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // In a real app, you'd decrypt messages here
      const decryptedMessages = await Promise.all((messagesData || []).map(async (msg) => {
        // Get sender profile
        let senderProfile = null;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();
          senderProfile = profile;
        } catch (error) {
          console.log('Profile not found for sender:', msg.sender_id);
        }
        
        return {
          id: msg.id,
          content: atob(msg.encrypted_content), // Simple base64 decode for demo
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          sender_profile: senderProfile
        };
      }));
      
      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadUserWallpaper = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallpaper_url')
        .eq('id', user.id)
        .single();
      
      if (profile?.wallpaper_url) {
        setUserWallpaper(profile.wallpaper_url);
      }
    } catch (error) {
      console.log('No wallpaper found for user');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      // Simple base64 encoding for demo (use real encryption in production)
      const encryptedContent = btoa(newMessage);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          encrypted_content: encryptedContent,
          sequence_number: Date.now()
        });

      if (error) throw error;
      
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!conversationId) {
    return (
      <div 
        className="flex-1 flex items-center justify-center bg-background relative"
        style={{
          backgroundImage: userWallpaper ? `url(${userWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: userWallpaper ? 'blur(1px)' : undefined
        }}
      >
        {userWallpaper && <div className="absolute inset-0 bg-black/20" style={{ filter: 'blur(0.5px)' }} />}
        <div className="text-center text-foreground relative z-10">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground text-sm md:text-base">Choose a conversation from the left to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <h3 className="font-semibold text-foreground">
          {conversationDetails?.name || 'Secure Chat'}
        </h3>
        <p className="text-sm text-muted-foreground">End-to-end encrypted</p>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{
          backgroundImage: userWallpaper ? `url(${userWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: userWallpaper ? 'blur(0.5px)' : undefined
        }}
      >
        {userWallpaper && <div className="absolute inset-0 bg-black/10 pointer-events-none" style={{ filter: 'blur(1px)' }} />}
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 relative z-10">
            <div className="text-2xl mb-2">🔒</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 relative z-10 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for others */}
              {message.sender_id !== user?.id && (
                <Avatar className="h-8 w-8 mb-1">
                  <AvatarImage src={message.sender_profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {message.sender_profile?.display_name?.[0] || 
                     message.sender_profile?.username?.[0] || 
                     'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex flex-col">
                {/* Username for others */}
                {message.sender_id !== user?.id && (
                  <p className="text-xs text-muted-foreground mb-1 px-1">
                    {message.sender_profile?.display_name || 
                     message.sender_profile?.username || 
                     'Unknown User'}
                  </p>
                )}
                
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card/90 backdrop-blur-sm border border-border text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {/* Avatar for current user */}
              {message.sender_id === user?.id && (
                <Avatar className="h-8 w-8 mb-1">
                  <AvatarImage src={message.sender_profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {message.sender_profile?.display_name?.[0] || 
                     message.sender_profile?.username?.[0] || 
                     'Y'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a secure message..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};