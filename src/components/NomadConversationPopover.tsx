import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, History, Edit2, Check, X, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NomadConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface NomadConversationPopoverProps {
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onConversationsChange?: () => void;
  onOpenBrain?: (conversationId: string) => void;
}

export const NomadConversationPopover: React.FC<NomadConversationPopoverProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onConversationsChange,
  onOpenBrain,
}) => {
  const [conversations, setConversations] = useState<NomadConversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      try {
        const updated = conversations.map(c => 
          c.id === id ? { ...c, title: editTitle.trim() } : c
        );
        localStorage.setItem('nomad-conversations', JSON.stringify(updated));
        setConversations(updated);
        toast.success('Title updated');
        onConversationsChange?.();
      } catch (error) {
        console.error('Error updating title:', error);
        toast.error('Failed to update title');
      }
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
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

  const truncateTitle = (title: string) => {
    return title.length > 8 ? title.slice(0, 8) + '...' : title;
  };

  const truncateDescription = (description: string) => {
    return description.length > 8 ? description.slice(0, 8) + '...' : description;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-1.5 sm:p-2 h-auto flex-shrink-0 hover:bg-primary/10 relative"
          title="Chat history"
        >
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          {conversations.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold flex items-center justify-center text-primary-foreground">
              {conversations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-background backdrop-blur-xl border-border shadow-xl z-[100]" 
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-3 border-b border-border bg-card/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Chat History</h3>
              </div>
              <Button
                onClick={() => {
                  onNewConversation();
                  setIsOpen(false);
                }}
                size="sm"
                variant="default"
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1 h-full">
            <div className="p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start chatting with NOMAD</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      if (editingId !== conv.id) {
                        onSelectConversation(conv.id);
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      "group relative p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                      "hover:bg-muted/50 hover:border-border/30",
                      currentConversationId === conv.id && "bg-muted border-primary/30",
                      editingId === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === conv.id ? (
                          <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(conv.id);
                                if (e.key === 'Escape') {
                                  setEditingId(null);
                                  setEditTitle('');
                                }
                              }}
                              className="h-7 text-sm bg-background"
                              maxLength={50}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0 hover:bg-primary/20 hover:text-primary"
                              onClick={(e) => saveEdit(conv.id, e)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0 hover:bg-destructive/20 hover:text-destructive"
                              onClick={cancelEdit}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <h4 className="text-sm font-medium truncate text-foreground" title={conv.title}>
                            {truncateTitle(conv.title)}
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-1" title={conv.lastMessage}>
                          {truncateDescription(conv.lastMessage)}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatTimestamp(conv.timestamp)}
                        </p>
                      </div>
                      {editingId !== conv.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary"
                            onClick={(e) => startEditing(conv.id, conv.title, e)}
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBrain?.(conv.id);
                              setIsOpen(false);
                            }}
                            title="Brain - Upload data for pattern analysis"
                          >
                            <Brain className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                            onClick={(e) => deleteConversation(conv.id, e)}
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
