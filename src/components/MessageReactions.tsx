import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  reaction: string;
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface MessageReactionsProps {
  messageId: string;
  conversationId: string;
  className?: string;
}

const PRESET_REACTIONS = [
  { emoji: '✅', label: 'Seen' },
  { emoji: '🔥', label: 'Agree' },
  { emoji: '🤔', label: 'Question' },
  { emoji: '👀', label: 'Looking into it' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '👎', label: 'Thumbs down' },
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  conversationId,
  className 
}) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
    setupRealtimeSubscription();
  }, [messageId]);

  const loadReactions = async () => {
    try {
      const { data: reactionsData, error } = await supabase
        .from('message_reactions')
        .select(`
          id,
          reaction,
          user_id,
          created_at
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Load user profiles for reactions
      const userIds = Array.from(new Set(reactionsData?.map(r => r.user_id) || []));
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

      const reactionsWithProfiles = reactionsData?.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id)
      })) || [];

      setReactions(reactionsWithProfiles);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addReaction = async (emoji: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(r => 
        r.user_id === user.id && r.reaction === emoji
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction: emoji
          });
        
        if (error) throw error;
      }
      
      setShowReactionPicker(false);
      setCustomEmoji('');
    } catch (error) {
      console.error('Error managing reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomReaction = async () => {
    if (!customEmoji.trim()) return;
    await addReaction(customEmoji.trim());
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = [];
    }
    acc[reaction.reaction].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  if (Object.keys(groupedReactions).length === 0 && !showReactionPicker) {
    return (
      <div className={cn("flex items-center gap-1 mt-1", className)}>
        <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="h-3 w-3 mr-1" />
              React
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_REACTIONS.map(({ emoji, label }) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-10 flex flex-col items-center justify-center gap-1 text-xs"
                    onClick={() => addReaction(emoji)}
                    disabled={loading}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-xs text-muted-foreground truncate">{label}</span>
                  </Button>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type any emoji..."
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomReaction()}
                  />
                  <Button
                    size="sm"
                    onClick={addCustomReaction}
                    disabled={!customEmoji.trim() || loading}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1 mt-2", className)}>
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const isUserReacted = reactionList.some(r => r.user_id === user?.id);
        
        return (
          <HoverCard key={emoji}>
            <HoverCardTrigger asChild>
              <Button
                variant={isUserReacted ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2 py-1 text-xs font-medium rounded-full transition-all",
                  "hover:scale-105 active:scale-95",
                  isUserReacted && "bg-primary/10 text-primary border-primary/30"
                )}
                onClick={() => addReaction(emoji)}
                disabled={loading}
              >
                <span className="mr-1">{emoji}</span>
                <span>{reactionList.length}</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <div className="font-medium text-sm">
                  Reacted with {emoji}
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {reactionList.map((reaction) => (
                    <div key={reaction.id} className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={reaction.profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {reaction.profile?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {reaction.profile?.display_name || reaction.profile?.username || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
      
      <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {PRESET_REACTIONS.map(({ emoji, label }) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-10 flex flex-col items-center justify-center gap-1 text-xs"
                  onClick={() => addReaction(emoji)}
                  disabled={loading}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs text-muted-foreground truncate">{label}</span>
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type any emoji..."
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomReaction()}
                />
                <Button
                  size="sm"
                  onClick={addCustomReaction}
                  disabled={!customEmoji.trim() || loading}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};