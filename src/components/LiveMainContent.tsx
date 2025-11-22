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
  Inbox,
  Settings
} from 'lucide-react';
import { UserSearchDropdown } from './UserSearchDropdown';
import { GroupChatCreation } from './GroupChatCreation';
import { SecureMessaging } from './SecureMessaging';
import { GroupChatSettings } from './GroupChatSettings';
import { useUnreadTitle } from '@/hooks/useUnreadTitle';

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
  created_by?: string;
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
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isGroupCreationOpen, setIsGroupCreationOpen] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [directUnreadTotal, setDirectUnreadTotal] = useState(0);
  const [groupUnreadTotal, setGroupUnreadTotal] = useState(0);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);

  // Update browser tab title with total unread count
  const totalUnreadCount = directUnreadTotal + groupUnreadTotal;
  useUnreadTitle(totalUnreadCount);

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
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversationCreated', handleConversationCreated);
    };
  }, [user]);

  // Load unread counts for conversations
  const loadUnreadCounts = async () => {
    if (!user) return;

    try {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (!participantData) return;

      const conversationIds = participantData.map(p => p.conversation_id);
      const lastReadMap: { [key: string]: string | null } = {};
      participantData.forEach(p => { lastReadMap[p.conversation_id] = (p as any).last_read_at; });

      const newUnreadCounts: {[key: string]: number} = {};

      // For each conversation, count unread messages after last_read_at (in parallel)
      await Promise.all(conversationIds.map(async (convId) => {
        const lastReadAt = lastReadMap[convId] || null;
        let query = supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', user.id);
        if (lastReadAt) {
          query = query.gt('created_at', lastReadAt as string);
        }
        const { count } = await query;
        newUnreadCounts[convId] = count || 0;
      }));

      setUnreadCounts(newUnreadCounts);

      // Calculate totals
      let directTotal = 0;
      let groupTotal = 0;

      conversations.forEach(conv => {
        directTotal += newUnreadCounts[conv.id] || 0;
      });

      groupChats.forEach(group => {
        groupTotal += newUnreadCounts[group.id] || 0;
      });

      setDirectUnreadTotal(directTotal);
      setGroupUnreadTotal(groupTotal);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  // Load unread counts only when conversations are first loaded or user changes
  useEffect(() => {
    if ((conversations.length > 0 || groupChats.length > 0) && user) {
      loadUnreadCounts();
    }
  }, [user]); // Only re-run when user changes, not on every conversation update

  // Clear notifications when a conversation is opened
  useEffect(() => {
    if (selectedConversation && unreadCounts[selectedConversation] > 0) {
      markConversationAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const markConversationAsRead = async (conversationId: string) => {
    const currentUnread = unreadCounts[conversationId] || 0;

    // Persist last_read_at in DB
    try {
      if (user) {
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.error('Failed to persist last_read_at', e);
    }
    
    // Update unread counts locally
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));

    // Update totals
    const isGroupChat = groupChats.some(group => group.id === conversationId);
    if (isGroupChat) {
      setGroupUnreadTotal(prev => Math.max(0, prev - currentUnread));
    } else {
      setDirectUnreadTotal(prev => Math.max(0, prev - currentUnread));
    }
  };

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          // Only update count if message is not from current user
          if (payload.new.sender_id !== user?.id) {
            loadUnreadCounts();
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
          const allConvs = participantData.map((p: any) => p.conversations).filter(Boolean);

          // Separate direct and group conversation IDs
          const directConvs = allConvs.filter((c: any) => c.type === 'direct');
          const groupConvs = allConvs.filter((c: any) => c.type === 'group');

          const directConvIds = directConvs.map((c: any) => c.id);

          // Fetch counterparties for all direct chats in ONE RPC call (bypasses profile RLS safely)
          if (directConvIds.length > 0) {
            const { data: counterparties, error: rpcError } = await supabase
              .rpc('get_direct_counterparties', { conversation_ids: directConvIds }) as any;

            if (rpcError) {
              console.error('Error fetching counterparties via RPC:', rpcError);
              // Fallback: show generic names
              const directChats: Conversation[] = directConvs.map((conv: any) => ({
                id: conv.id,
                type: 'direct',
                name: 'Direct chat',
                avatar_url: '',
                updated_at: conv.updated_at,
              }));
              setConversations(directChats);
            } else {
              // Type assertion for the RPC result
              const counterpartiesData = counterparties as Array<{
                conversation_id: string;
                id: string;
                username: string;
                display_name: string;
                avatar_url: string;
              }>;
              
              const mapByConv: Record<string, any> = {};
              counterpartiesData.forEach((row) => { 
                mapByConv[row.conversation_id] = row; 
              });

              const directChats: Conversation[] = directConvs.map((conv: any) => {
                const cp = mapByConv[conv.id];
                return {
                  id: conv.id,
                  type: 'direct',
                  name: cp?.display_name || cp?.username || 'Direct chat',
                  avatar_url: cp?.avatar_url || '',
                  updated_at: conv.updated_at,
                } as Conversation;
              });

              setConversations(directChats);
            }
          } else {
            setConversations([]);
          }

          // Build groups without extra queries
          const groups: Conversation[] = groupConvs.map((conv: any) => ({
            id: conv.id,
            type: 'group',
            name: conv.name || 'Unnamed Group',
            avatar_url: conv.avatar_url,
            updated_at: conv.updated_at,
            created_by: conv.created_by,
          }));
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
                      <span className="font-semibold text-red-400">WhatsApp</span> is data collection 
                      and easily hackable. I mean it's owned by <span className="font-semibold">Meta</span> which is the 
                      <span className="font-bold text-red-400"> King of Data Collection</span>.
                    </p>
                    
                    <p>
                      <span className="font-semibold text-orange-400">Telegram</span> has backdoors 
                      that government can access and easily hackable.
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
            {activeSection === 'calls' ? 'Secure Calls' : 'Sovereign Control'}
          </h2>
          <p className="text-muted-foreground">
            {activeSection === 'calls' 
              ? 'End-to-end encrypted voice and video calls coming soon'
              : 'Configure your sovereign control and preferences'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      {/* Mobile/Tablet Toggle Button - shown when conversation is selected */}
      {selectedConversation && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 lg:hidden bg-card/80 backdrop-blur-sm border border-border/50"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      {/* Left Panel - Overlay on mobile/tablet when conversation selected */}
      <div className={`
        ${selectedConversation 
          ? `${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'} absolute inset-y-0 left-0 z-40 bg-background/95 backdrop-blur-md border-r border-border lg:relative lg:translate-x-0 lg:bg-background lg:backdrop-blur-none` 
          : 'relative translate-x-0'
        } 
        w-full lg:w-96 xl:w-[400px] transition-transform duration-300 ease-in-out flex flex-col
      `}>
        {/* Tab Navigation - Enhanced for tablet */}
        <div className="p-4 md:p-5 lg:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-foreground font-semibold text-base md:text-lg lg:text-xl">
              {selectedTab === 'conversations' ? 'Direct Messages' : 'Group Chats'}
            </h3>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={selectedTab === 'conversations' ? handleNewMessage : handleNewGroup}
                className="text-muted-foreground hover:text-primary hover:border-primary/50 md:h-9 md:w-9 lg:h-10 lg:w-10"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-1 bg-card rounded-lg p-1.5 md:p-2 border border-border shadow-sm">
            <button
              onClick={() => handleTabChange('conversations')}
              className={`flex-1 flex items-center justify-center space-x-2 md:space-x-3 py-3 md:py-4 lg:py-5 px-3 md:px-4 lg:px-6 rounded-md text-sm md:text-base lg:text-lg font-medium transition-all relative ${
                selectedTab === 'conversations'
                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]'
                  : 'text-foreground hover:text-primary hover:bg-primary/10 hover:scale-[1.01]'
              }`}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              <span className="font-semibold">Chats</span>
              {directUnreadTotal > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 p-0 text-xs md:text-sm flex items-center justify-center bg-red-500 hover:bg-red-500 shadow-lg"
                >
                  {directUnreadTotal > 99 ? '99+' : directUnreadTotal}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange('groups')}
              className={`flex-1 flex items-center justify-center space-x-2 md:space-x-3 py-3 md:py-4 lg:py-5 px-3 md:px-4 lg:px-6 rounded-md text-sm md:text-base lg:text-lg font-medium transition-all relative ${
                selectedTab === 'groups'
                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]'
                  : 'text-foreground hover:text-primary hover:bg-primary/10 hover:scale-[1.01]'
              }`}
            >
              <Users className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              <span className="font-semibold">Groups</span>
              {groupUnreadTotal > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 p-0 text-xs md:text-sm flex items-center justify-center bg-red-500 hover:bg-red-500 shadow-lg"
                >
                  {groupUnreadTotal > 99 ? '99+' : groupUnreadTotal}
                </Badge>
              )}
            </button>
          </div>
        </div>
        
        {/* Conversation List - Scrollable for all screen sizes */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-3 md:p-4 lg:p-5">
            <div className="space-y-2 md:space-y-3">
            {selectedTab === 'conversations' && conversations.map((conv) => (
              <Card 
                key={conv.id} 
                className={`bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                  selectedConversation === conv.id ? 'ring-2 ring-primary bg-primary/10 shadow-lg' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conv.id);
                  setIsLeftPanelOpen(false); // Close panel on selection for mobile/tablet
                }}
              >
                <CardContent className="p-3 md:p-4 lg:p-5">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg border border-border/50 flex-shrink-0">
                      <AvatarImage src={conv.avatar_url} className="rounded-lg object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary rounded-lg text-sm md:text-base lg:text-lg font-semibold">
                        {conv.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate text-sm md:text-base lg:text-lg">{conv.name}</h4>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground truncate mt-1">
                        Click to open chat
                      </p>
                    </div>
                    {unreadCounts[conv.id] > 0 && (
                      <Badge 
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-500 text-white font-semibold text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
                      >
                        {unreadCounts[conv.id] > 99 ? '99+' : unreadCounts[conv.id]}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {selectedTab === 'groups' && groupChats.map((group) => (
              <Card 
                key={group.id} 
                className={`bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                  selectedConversation === group.id ? 'ring-2 ring-primary bg-primary/10 shadow-lg' : ''
                }`}
              >
                <CardContent className="p-3 md:p-4 lg:p-5">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <Avatar 
                      className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg border border-border/50 flex-shrink-0"
                      onClick={() => {
                        setSelectedConversation(group.id);
                        setIsLeftPanelOpen(false); // Close panel on selection for mobile/tablet
                      }}
                    >
                      <AvatarImage src={group.avatar_url} className="rounded-lg object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary rounded-lg text-sm md:text-base lg:text-lg font-semibold">
                        <Users className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setSelectedConversation(group.id);
                        setIsLeftPanelOpen(false); // Close panel on selection for mobile/tablet
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm md:text-base lg:text-lg font-medium text-foreground truncate pr-2">{group.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">
                            {new Date(group.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {group.created_by === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 md:h-8 md:w-8 lg:h-9 lg:w-9 hover:bg-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroupForSettings(group.id);
                              }}
                            >
                              <Settings className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground truncate mt-1">
                        Group Chat
                      </p>
                    </div>
                    {unreadCounts[group.id] > 0 && (
                      <Badge 
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-500 text-white font-semibold text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
                      >
                        {unreadCounts[group.id] > 99 ? '99+' : unreadCounts[group.id]}
                      </Badge>
                    )}
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
      </div>
      
      {/* Right Panel - Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 items-center justify-center bg-background`}>
        {selectedConversation ? (
          <SecureMessaging 
            key={selectedConversation} // Force re-render when conversation changes
            conversationId={selectedConversation} 
            onBackToMessages={() => {
              setSelectedConversation(null);
              setIsLeftPanelOpen(false);
            }}
          />
        ) : (
          <div 
            className="relative w-full h-full flex items-center justify-center lg:rounded-3xl lg:overflow-hidden lg:m-4 lg:my-8"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {backgroundImage && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            )}
            <div className="text-center text-muted-foreground relative z-10">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a chat or group to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay backdrop for mobile/tablet */}
      {selectedConversation && isLeftPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsLeftPanelOpen(false)}
        />
      )}
      
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

      {/* Group Settings Modal */}
      {selectedGroupForSettings && (
        <GroupChatSettings
          isOpen={!!selectedGroupForSettings}
          onClose={() => setSelectedGroupForSettings(null)}
          conversationId={selectedGroupForSettings}
          conversationName={groupChats.find(g => g.id === selectedGroupForSettings)?.name || ''}
          conversationAvatar={groupChats.find(g => g.id === selectedGroupForSettings)?.avatar_url}
          onUpdate={() => {
            loadConversations();
            setSelectedGroupForSettings(null);
          }}
        />
      )}
    </div>
  );
};