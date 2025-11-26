import { useState } from 'react';
import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupCallInterface } from './GroupCallInterface';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupCallButtonProps {
  conversationId: string;
}

export const GroupCallButton = ({ conversationId }: GroupCallButtonProps) => {
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);

  if (callType) {
    return (
      <GroupCallInterface
        conversationId={conversationId}
        isVideo={callType === 'video'}
        onEnd={() => setCallType(null)}
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
          Start Voice Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCallType('video')}>
          <Video className="h-4 w-4 mr-2" />
          Start Video Call
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
