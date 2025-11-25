import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Mention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  created_at: string;
  read_at?: string;
  message?: {
    content: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
  };
  sender?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface MentionNotificationsProps {
  open: boolean;
  onClose: () => void;
  onNavigateToMessage: (conversationId: string, messageId: string) => void;
}

export const MentionNotifications = ({
  open,
  onClose,
  onNavigateToMessage
}: MentionNotificationsProps) => {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open && user) {
      loadMentions();
    }
  }, [open, user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new mentions
    const channel = supabase
      .channel('user-mentions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions',
          filter: `mentioned_user_id=eq.${user.id}`
        },
        () => {
          loadMentions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadMentions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mentions')
        .select(`
          *,
          messages!inner(
            content,
            sender_id,
            conversation_id,
            created_at,
            profiles:sender_id(username, display_name, avatar_url)
          )
        `)
        .eq('mentioned_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedMentions = data?.map(m => ({
        id: m.id,
        message_id: m.message_id,
        mentioned_user_id: m.mentioned_user_id,
        created_at: m.created_at,
        read_at: m.read_at,
        message: {
          content: (m.messages as any).content,
          sender_id: (m.messages as any).sender_id,
          conversation_id: (m.messages as any).conversation_id,
          created_at: (m.messages as any).created_at
        },
        sender: (m.messages as any).profiles
      })) || [];

      setMentions(processedMentions);
      setUnreadCount(processedMentions.filter(m => !m.read_at).length);
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (mentionId: string) => {
    try {
      const { error } = await supabase
        .from('mentions')
        .update({ read_at: new Date().toISOString() })
        .eq('id', mentionId);

      if (error) throw error;

      setMentions(prev =>
        prev.map(m => m.id === mentionId ? { ...m, read_at: new Date().toISOString() } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  };

  const handleMentionClick = (mention: Mention) => {
    if (mention.message) {
      markAsRead(mention.id);
      onNavigateToMessage(mention.message.conversation_id, mention.message_id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Mentions
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : mentions.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No mentions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mentions.map((mention) => (
                <button
                  key={mention.id}
                  onClick={() => handleMentionClick(mention)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border hover:bg-secondary/50 transition-colors",
                    !mention.read_at && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mention.sender?.avatar_url} />
                      <AvatarFallback>
                        {mention.sender?.display_name?.[0] || mention.sender?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {mention.sender?.display_name || mention.sender?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          mentioned you
                        </span>
                        {!mention.read_at && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {mention.message?.content}
                      </p>
                      
                      <span className="text-xs text-muted-foreground mt-1">
                        {mention.created_at && format(new Date(mention.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
