import { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallInterface } from './CallInterface';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCallType('voice')}>
          <Phone className="h-4 w-4 mr-2" />
          Voice Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCallType('video')}>
          <Video className="h-4 w-4 mr-2" />
          Video Call
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
