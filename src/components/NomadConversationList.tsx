import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NomadConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface NomadConversationListProps {
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onConversationsChange?: () => void;
}

export const NomadConversationList: React.FC<NomadConversationListProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onConversationsChange,
}) => {
  const [conversations, setConversations] = useState<NomadConversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);
  
  // Reload when external changes occur
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nomad-conversations') {
        loadConversations();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem('nomad-conversations');
      if (stored) {
        const parsed = JSON.parse(stored) as NomadConversation[];
        setConversations(parsed.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Remove conversation from list
      const updated = conversations.filter(c => c.id !== id);
      localStorage.setItem('nomad-conversations', JSON.stringify(updated));
      
      // Remove messages
      localStorage.removeItem(`nomad-conversation-${id}`);
      
      setConversations(updated);
      toast.success('Conversation deleted');
      
      // Notify parent of change
      onConversationsChange?.();
      
      // If deleting current conversation, switch to newest or create new
      if (id === currentConversationId) {
        if (updated.length > 0) {
          onSelectConversation(updated[0].id);
        } else {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border-r border-border">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewConversation}
          className="w-full"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all",
                  "hover:bg-accent/50",
                  currentConversationId === conv.id && "bg-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{conv.title}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatTimestamp(conv.timestamp)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0"
                    onClick={(e) => deleteConversation(conv.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
