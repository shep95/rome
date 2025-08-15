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

  // App lock when switching tabs - REMOVED
  // This was causing the 4-digit code prompt for all tabs
  // Now only secure files will require the code

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

  if (selectedConversation) {
    return (
      <div className="flex flex-col md:flex-row bg-background min-h-screen">
        {/* Left Panel - Message Categories */}
        <div className="w-full md:w-80 lg:w-96 bg-card/80 backdrop-blur-xl border-b md:border-r md:border-b-0 border-border flex flex-col">
          {/* Tab Navigation */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-foreground font-semibold">
                {selectedTab === 'conversations' ? 'Direct Messages' : 
                 selectedTab === 'groups' ? 'Group Chats' : 'Secure Files'}
              </h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedConversation(null)}
                className="text-muted-foreground"
              >
                ← Back
              </Button>
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
          <ScrollArea className="flex-1 p-3 md:p-4">
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
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.avatar_url} />
                        <AvatarFallback>
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
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback>
                          <Users className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-medium truncate">{group.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          Click to open group
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col">
          <SecureMessaging conversationId={selectedConversation} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row bg-background min-h-screen">
        {/* Left Panel - Message Categories */}
        <div className="w-full md:w-80 lg:w-96 bg-card/80 backdrop-blur-xl border-b md:border-r md:border-b-0 border-border flex flex-col">
          {/* Tab Navigation */}
          <div className="p-4 border-b border-border flex-shrink-0">
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

          {/* Content Area */}
          <ScrollArea className="flex-1 p-3 md:p-4">
            {selectedTab === 'conversations' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold">Conversations</h3>
                  <Button 
                    size="sm" 
                    onClick={handleNewMessage}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations yet. Start a new chat!
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id} 
                      className="bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all"
                      onClick={() => {
                        console.log('Opening conversation:', conv.id, conv.name);
                        setSelectedConversation(conv.id);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar_url} />
                            <AvatarFallback>
                              {conv.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-foreground font-medium truncate">{conv.name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conv.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message || 'No messages yet'}
                            </p>
                          </div>
                          {conv.unread_count && conv.unread_count > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {selectedTab === 'groups' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold">Group Chats</h3>
                  <Button 
                    size="sm" 
                    onClick={handleNewGroup}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {groupChats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No group chats yet. Create a new group!
                  </div>
                ) : (
                  groupChats.map((group) => (
                    <Card 
                      key={group.id} 
                      className="bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all"
                      onClick={() => {
                        console.log('Opening group chat:', group.id, group.name);
                        setSelectedConversation(group.id);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={group.avatar_url} />
                            <AvatarFallback>
                              <Users className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-foreground font-medium truncate">{group.name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(group.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {group.last_message || 'No messages yet'}
                            </p>
                          </div>
                          {group.unread_count && group.unread_count > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">
                              {group.unread_count}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Area */}
        <div 
          className="hidden md:flex flex-1 items-center justify-center relative"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: backgroundImage ? 'blur(1px)' : undefined
          }}
        >
          {backgroundImage && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" style={{ filter: 'blur(0.5px)' }} />
          )}
          <div className="text-center text-foreground relative z-10">
            <Shield className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="text-muted-foreground text-sm md:text-base">Choose a conversation to start secure messaging</p>
          </div>
        </div>
      </div>

      {/* Modals and Dialogs */}
      <UserSearchDropdown
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
      />

      <GroupChatCreation
        isOpen={isGroupCreationOpen}
        onClose={() => setIsGroupCreationOpen(false)}
        onGroupCreated={loadConversations}
      />
    </>
  );
};