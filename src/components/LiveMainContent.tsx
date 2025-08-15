import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Users, 
  Shield, 
  Plus, 
  Inbox
} from 'lucide-react';
import { UserSearchDropdown } from './UserSearchDropdown';
import { GroupChatCreation } from './GroupChatCreation';
import { SecureMessaging } from './SecureMessaging';

interface LiveMainContentProps {
  activeSection: string;
  messageRequestCount: number;
  onMessageRequestCountChange: (count: number) => void;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'secure';
  avatar_url?: string;
  last_message?: string;
  updated_at: string;
  unread_count?: number;
  other_user?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export const LiveMainContent: React.FC<LiveMainContentProps> = ({ activeSection, messageRequestCount, onMessageRequestCountChange }) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'conversations' | 'groups'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupChats, setGroupChats] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isGroupCreationOpen, setIsGroupCreationOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscriptions();
    }
    
    // Load saved background image
    const savedBackground = localStorage.getItem('rome-background-image');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }

    // Listen for wallpaper changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rome-background-image') {
        setBackgroundImage(e.newValue);
      }
    };

    // Listen for conversation creation events (e.g., from accepted message requests)
    const handleConversationCreated = () => {
      console.log('Conversation created event received, reloading conversations...');
      loadConversations();
    };

    // Listen for storage changes and other events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('conversationCreated', handleConversationCreated);
    
    // Also listen for focus events to reload conversations when user comes back
    const handleFocus = () => {
      console.log('Window focused, reloading conversations...');
      loadConversations();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversationCreated', handleConversationCreated);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('live-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => loadConversations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversations = async () => {
    try {
      console.log('Loading conversations for user:', user?.id);
      
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id,
            name,
            type,
            avatar_url,
            updated_at,
            created_by
          )
        `)
        .eq('user_id', user?.id)
        .is('left_at', null);

      if (participantError) {
        console.error('Error fetching participant data:', participantError);
        return;
      }

      console.log('Participant data:', participantData);

      if (participantData) {
        const directChats: Conversation[] = [];
        const groups: Conversation[] = [];

        for (const p of participantData) {
          const conv = p.conversations;
          console.log('Processing conversation:', conv);
          
          if (conv && conv.type === 'direct') {
            // Get other participant for direct chats
            const { data: otherParticipants, error: otherError } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .neq('user_id', user?.id)
              .is('left_at', null);

            if (otherError) {
              console.error('Error fetching other participants:', otherError);
              continue;
            }

            console.log('Other participants:', otherParticipants);

            let otherUserName = 'Unknown User';
            let otherUserAvatar = '';
            if (otherParticipants && otherParticipants[0]) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url')
                .eq('id', otherParticipants[0].user_id)
                .single();

              if (profileError) {
                console.error('Error fetching profile:', profileError);
              } else {
                console.log('Profile data:', profile);
                otherUserName = profile?.display_name || profile?.username || 'Unknown User';
                otherUserAvatar = profile?.avatar_url || '';
              }
            }

            const directChat = {
              id: conv.id,
              type: conv.type as 'direct',
              name: otherUserName,
              avatar_url: otherUserAvatar,
              updated_at: conv.updated_at
            };
            
            console.log('Adding direct chat:', directChat);
            directChats.push(directChat);
          } else if (conv && conv.type === 'group') {
            const groupChat = {
              id: conv.id,
              type: conv.type as 'group',
              name: conv.name || 'Unnamed Group',
              avatar_url: conv.avatar_url,
              updated_at: conv.updated_at
            };
            
            console.log('Adding group chat:', groupChat);
            groups.push(groupChat);
          }
        }

        console.log('Final direct chats:', directChats);
        console.log('Final groups:', groups);
        
        setConversations(directChats);
        setGroupChats(groups);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleTabChange = (tab: 'conversations' | 'groups') => {
    setSelectedTab(tab);
  };

  const handleNewMessage = () => {
    setIsUserSearchOpen(true);
  };

  const handleNewGroup = () => {
    setIsGroupCreationOpen(true);
  };

  if (activeSection !== 'messages') {
    if (activeSection === 'why-us') {
      return (
        <div className="flex-1 flex items-center justify-center bg-background min-h-screen relative overflow-hidden">
          {/* Background with glassmorphism effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/20"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.3) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.2) 0%, transparent 40%),
                radial-gradient(circle at 60% 20%, hsl(var(--primary) / 0.15) 0%, transparent 50%)
              `
            }}
          />
          
          {/* Main content card */}
          <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8">
            <div 
              className="backdrop-blur-xl bg-card/20 border border-border/30 rounded-3xl p-8 md:p-12 shadow-2xl"
              style={{
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="text-center">
                <div className="mb-8">
                  <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                    Why Choose Us?
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
                </div>
                
                <div className="space-y-6 text-lg md:text-xl leading-relaxed text-foreground/90">
                  <p className="font-medium text-primary">
                    The Truth About Popular Messaging Apps:
                  </p>
                  
                  <div className="space-y-4">
                    <p>
                      <span className="font-semibold text-red-400">WhatsApp</span> is data collection. 
                      I mean it's owned by <span className="font-semibold">Meta</span> which is the 
                      <span className="font-bold text-red-400"> King of Data Collection</span>.
                    </p>
                    
                    <p>
                      <span className="font-semibold text-orange-400">Telegram</span> has backdoors 
                      that government can access.
                    </p>
                    
                    <p>
                      <span className="font-semibold text-blue-400">Signal</span> is awesome but 
                      <span className="font-bold"> nobody uses it</span>.
                    </p>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl border border-primary/30">
                    <p className="text-xl md:text-2xl font-bold text-primary">
                      Which is why <span className="text-accent">ZORAK CORP</span> created & invested into this app.
                    </p>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
                    <span className="px-4 text-sm">True Privacy, Real Security</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <h2 className="text-2xl font-bold mb-4">
            {activeSection === 'calls' ? 'Secure Calls' : 'Settings'}
          </h2>
          <p className="text-muted-foreground">
            {activeSection === 'calls' 
              ? 'End-to-end encrypted voice and video calls coming soon'
              : 'Configure your security settings and preferences'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel - Hidden on mobile when conversation is selected */}
      <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-border flex flex-col`}>
        {/* Tab Navigation */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground font-semibold">
              {selectedTab === 'conversations' ? 'Direct Messages' : 'Group Chats'}
            </h3>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={selectedTab === 'conversations' ? handleNewMessage : handleNewGroup}
                className="text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-1 bg-card rounded-lg p-1 border border-border">
            <button
              onClick={() => handleTabChange('conversations')}
              className={`flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-3 px-3 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all ${
                selectedTab === 'conversations'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
            </button>
            <button
              onClick={() => handleTabChange('groups')}
              className={`flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-3 px-3 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all ${
                selectedTab === 'groups'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Groups</span>
            </button>
          </div>
        </div>
        
        {/* Conversation List */}
        <ScrollArea className="flex-1 p-3 md:p-4 custom-scrollbar">
          <div className="space-y-2">
            {selectedTab === 'conversations' && conversations.map((conv) => (
              <Card 
                key={conv.id} 
                className={`bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all ${
                  selectedConversation === conv.id ? 'ring-2 ring-primary bg-primary/10' : ''
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-border/50 flex-shrink-0">
                      <AvatarImage src={conv.avatar_url} className="rounded-lg object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary rounded-lg text-xs sm:text-sm">
                        {conv.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate">{conv.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        Click to open chat
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {selectedTab === 'groups' && groupChats.map((group) => (
              <Card 
                key={group.id} 
                className={`bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all ${
                  selectedConversation === group.id ? 'ring-2 ring-primary bg-primary/10' : ''
                }`}
                onClick={() => setSelectedConversation(group.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-border/50 flex-shrink-0">
                      <AvatarImage src={group.avatar_url} className="rounded-lg object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary rounded-lg text-xs sm:text-sm">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground truncate pr-2">{group.name}</h4>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(group.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {selectedTab === 'conversations' && conversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to get started!</p>
              </div>
            )}
            
            {selectedTab === 'groups' && groupChats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No group chats yet</p>
                <p className="text-sm">Create a group to start chatting!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Right Panel - Chat Area */}
      <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1`}>
        <SecureMessaging 
          conversationId={selectedConversation || undefined} 
          onBackToMessages={() => setSelectedConversation(null)}
        />
      </div>
      
      {/* User Search Modal */}
      <UserSearchDropdown
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
      />
      
      {/* Group Creation Modal */}
      <GroupChatCreation
        isOpen={isGroupCreationOpen}
        onClose={() => setIsGroupCreationOpen(false)}
        onGroupCreated={() => {
          console.log('Group created, reloading conversations...');
          setIsGroupCreationOpen(false);
          loadConversations(); // Reload conversations after creating a group
        }}
      />
    </div>
  );
};