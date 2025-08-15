import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CallHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CallRecord {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  contact_phone: string;
  call_type: 'incoming' | 'outgoing' | 'missed' | 'video';
  duration_seconds: number;
  created_at: string;
}

export const CallHistory = ({ isOpen, onClose }: CallHistoryProps) => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      loadCallHistory();
    }
  }, [user, isOpen]);

  const loadCallHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCallHistory((data || []) as CallRecord[]);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                    <AvatarImage src={call.contact_avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {call.contact_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Call Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {call.contact_name}
                      </h3>
                      {getCallIcon(call.call_type)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {call.contact_phone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {getCallTypeLabel(call.call_type)}
                      </Badge>
                      {call.duration_seconds > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDuration(call.duration_seconds)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatTime(call.created_at)}
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