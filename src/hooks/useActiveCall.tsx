import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActiveCall {
  userId: string;
  isVideo: boolean;
  timestamp: number;
}

export const useActiveCall = (conversationId: string) => {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Subscribe to call presence
    const channel = supabase.channel(`call-presence:${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat() as any[];
        
        // Filter out our own presence
        const otherUsers = presences.filter((p: any) => p.userId !== user.id);
        
        if (otherUsers.length > 0) {
          // There's an active call
          const firstUser = otherUsers[0];
          setActiveCall({
            userId: firstUser.userId,
            isVideo: firstUser.isVideo || false,
            timestamp: firstUser.timestamp || Date.now()
          });
        } else {
          setActiveCall(null);
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined call:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left call:', leftPresences);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user]);

  const announceCall = async (isVideo: boolean) => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`call-presence:${conversationId}`);
    await channel.subscribe();
    
    await channel.track({
      userId: user.id,
      isVideo,
      timestamp: Date.now()
    });

    setIsInCall(true);
    return channel;
  };

  const endCallAnnouncement = async (channel: any) => {
    if (channel) {
      await channel.untrack();
      await channel.unsubscribe();
    }
    setIsInCall(false);
  };

  return {
    activeCall,
    hasActiveCall: !!activeCall && !isInCall,
    isInCall,
    announceCall,
    endCallAnnouncement
  };
};
