import { useState } from 'react';
import { Video, Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallInterface } from './CallInterface';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useActiveCall } from '@/hooks/useActiveCall';
import { Badge } from '@/components/ui/badge';

interface VideoCallButtonProps {
  conversationId: string;
  otherUser?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const VideoCallButton = ({ conversationId, otherUser }: VideoCallButtonProps) => {
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const { activeCall, hasActiveCall } = useActiveCall(conversationId);

  if (callType) {
    return (
      <CallInterface
        conversationId={conversationId}
        isVideo={callType === 'video'}
        onEnd={() => setCallType(null)}
        otherUser={otherUser}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Phone className="h-5 w-5" />
          {hasActiveCall && (
            <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center bg-green-500">
              <span className="sr-only">Active call</span>
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasActiveCall ? (
          <>
            <DropdownMenuItem onClick={() => setCallType(activeCall?.isVideo ? 'video' : 'voice')}>
              <PhoneCall className="h-4 w-4 mr-2 text-green-500" />
              Join Active Call
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={() => setCallType('voice')}>
          <Phone className="h-4 w-4 mr-2" />
          {hasActiveCall ? 'Start New Voice Call' : 'Voice Call'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCallType('video')}>
          <Video className="h-4 w-4 mr-2" />
          {hasActiveCall ? 'Start New Video Call' : 'Video Call'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
