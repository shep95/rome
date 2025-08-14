import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock } from 'lucide-react';

interface CallHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CallRecord {
  id: string;
  contactName: string;
  contactAvatar?: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'video';
  duration: string;
  timestamp: Date;
}

export const CallHistory = ({ isOpen, onClose }: CallHistoryProps) => {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  useEffect(() => {
    // Mock call history data - in real app this would come from database
    const mockCalls: CallRecord[] = [
      {
        id: '1',
        contactName: 'Alice Johnson',
        contactPhone: '+1 (555) 123-4567',
        type: 'incoming',
        duration: '12:45',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        contactName: 'Bob Smith',
        contactPhone: '+1 (555) 987-6543',
        type: 'outgoing',
        duration: '5:23',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        id: '3',
        contactName: 'Carol Wilson',
        contactPhone: '+1 (555) 456-7890',
        type: 'missed',
        duration: '0:00',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        id: '4',
        contactName: 'David Brown',
        contactPhone: '+1 (555) 321-9876',
        type: 'video',
        duration: '23:12',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: '5',
        contactName: 'Emma Davis',
        contactPhone: '+1 (555) 654-3210',
        type: 'incoming',
        duration: '8:34',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: '6',
        contactName: 'Frank Miller',
        contactPhone: '+1 (555) 789-0123',
        type: 'outgoing',
        duration: '15:47',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];

    setCallHistory(mockCalls.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, []);

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case 'missed':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      default:
        return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'Incoming';
      case 'outgoing':
        return 'Outgoing';
      case 'missed':
        return 'Missed';
      case 'video':
        return 'Video Call';
      default:
        return 'Call';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[90vh] sm:h-[80vh] p-0 overflow-hidden">
        {/* Glassmorphic background */}
        <div className="absolute inset-0 bg-background/20 backdrop-blur-xl border border-border/50 rounded-lg" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Call History</h2>
                <p className="text-sm text-muted-foreground">Recent calls and video conferences</p>
              </div>
            </div>
          </div>

          {/* Call History List */}
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/30 hover:bg-card/50 transition-all cursor-pointer"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={call.contactAvatar} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {call.contactName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Call Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {call.contactName}
                      </h3>
                      {getCallIcon(call.type)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {call.contactPhone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {getCallTypeLabel(call.type)}
                      </Badge>
                      {call.duration !== '0:00' && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {call.duration}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatTime(call.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {callHistory.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <Phone className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No call history</h3>
                <p className="text-sm text-muted-foreground">
                  Your recent calls will appear here
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-border/50">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              All calls are end-to-end encrypted for your privacy
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};