import { Calendar, Clock, Trash2, Edit2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScheduledMessages } from '@/hooks/useScheduledMessages';
import { format, formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduledMessagesListProps {
  conversationId?: string;
  onEdit?: (messageId: string) => void;
}

export const ScheduledMessagesList = ({ conversationId, onEdit }: ScheduledMessagesListProps) => {
  const { messages, isLoading, cancelScheduledMessage } = useScheduledMessages(conversationId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          No scheduled messages
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule messages to send them later
        </p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {messages.map((message) => {
          const scheduledDate = new Date(message.scheduled_for);
          const isPast = scheduledDate < new Date();
          const timeUntil = formatDistance(scheduledDate, new Date(), { addSuffix: true });

          return (
            <Card key={message.id} className={cn(
              "p-4",
              isPast && "opacity-60 border-warning"
            )}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm line-clamp-2 flex-1">
                    {message.content}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(message.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => cancelScheduledMessage(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {message.file_name && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>📎</span>
                    <span>{message.file_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(scheduledDate, 'h:mm a')}</span>
                  </div>
                  <div className={cn(
                    "ml-auto",
                    isPast && "text-warning"
                  )}>
                    {isPast ? 'Sending soon...' : timeUntil}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
