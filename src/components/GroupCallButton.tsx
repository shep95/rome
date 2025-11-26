import { useState } from 'react';
import { Phone, Video, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupCallInterface } from './GroupCallInterface';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useActiveCall } from '@/hooks/useActiveCall';
import { Badge } from '@/components/ui/badge';

interface GroupCallButtonProps {
  conversationId: string;
}

export const GroupCallButton = ({ conversationId }: GroupCallButtonProps) => {
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const { activeCall, hasActiveCall } = useActiveCall(conversationId);

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
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-primary/20 transition-colors"
          title="Start group call"
        >
          <Phone className="h-5 w-5 text-primary" />
          {hasActiveCall && (
            <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center bg-green-500 animate-pulse">
              <span className="sr-only">Active call</span>
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50 border shadow-lg">
        {hasActiveCall ? (
          <>
            <DropdownMenuItem 
              onClick={() => setCallType(activeCall?.isVideo ? 'video' : 'voice')}
              className="cursor-pointer hover:bg-accent"
            >
              <PhoneCall className="h-4 w-4 mr-2 text-green-500" />
              <span className="font-semibold">Join Active Call</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem 
          onClick={() => setCallType('voice')}
          className="cursor-pointer hover:bg-accent"
        >
          <Phone className="h-4 w-4 mr-2" />
          {hasActiveCall ? 'Start New Voice Call' : 'Start Voice Call'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setCallType('video')}
          className="cursor-pointer hover:bg-accent"
        >
          <Video className="h-4 w-4 mr-2" />
          {hasActiveCall ? 'Start New Video Call' : 'Start Video Call'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
