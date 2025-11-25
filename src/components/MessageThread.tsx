import { Reply, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  decrypted_content: string;
  created_at: string;
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar?: string;
  replied_to_message_id?: string;
}

interface MessageThreadProps {
  message: Message;
  repliedToMessage?: Message;
  onReply: (messageId: string) => void;
  onViewThread?: (messageId: string) => void;
  showReplyButton?: boolean;
  compact?: boolean;
  className?: string;
}

export const MessageThread = ({
  message,
  repliedToMessage,
  onReply,
  onViewThread,
  showReplyButton = true,
  compact = false,
  className
}: MessageThreadProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Replied-to message preview */}
      {repliedToMessage && (
        <button
          onClick={() => onViewThread?.(repliedToMessage.id)}
          className="w-full text-left"
        >
          <Card className="p-2 bg-secondary/30 border-l-4 border-primary hover:bg-secondary/50 transition-colors">
            <div className="flex items-start gap-2">
              <Reply className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={repliedToMessage.sender_avatar} />
                    <AvatarFallback className="text-[8px]">
                      {repliedToMessage.sender_display_name?.[0] || 
                       repliedToMessage.sender_username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">
                    {repliedToMessage.sender_display_name || repliedToMessage.sender_username}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {repliedToMessage.decrypted_content}
                </p>
              </div>
              {onViewThread && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </Card>
        </button>
      )}

      {/* Main message content would be rendered by parent */}
      
      {/* Reply button */}
      {showReplyButton && !compact && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(message.id)}
          className="h-7 text-xs"
        >
          <Reply className="h-3 w-3 mr-1" />
          Reply
        </Button>
      )}
    </div>
  );
};
