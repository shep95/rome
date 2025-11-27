import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

interface TypingUser {
  user_id: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  conversationId, 
  currentUserId 
}) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!conversationId || conversationId === 'nomad-ai-agent') return;

    // Load initial typing users
    loadTypingUsers();

    // Subscribe to typing indicator changes with more specific filtering
    const channel = supabase
      .channel(`typing_indicators:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Typing indicator changed:', payload);
          loadTypingUsers();
        }
      )
      .subscribe((status) => {
        console.log('Typing indicator subscription status:', status);
      });

    // Also set up a cleanup interval to remove stale typing indicators
    const cleanupInterval = setInterval(() => {
      loadTypingUsers();
    }, 5000); // Check every 5 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [conversationId, currentUserId]);

  const loadTypingUsers = async () => {
    try {
      const { data: typingData, error } = await supabase
        .from('typing_indicators')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('is_typing', true)
        .neq('user_id', currentUserId)
        .gte('updated_at', new Date(Date.now() - 10000).toISOString()); // Only users who typed in last 10 seconds

      if (error) throw error;

      if (typingData && typingData.length > 0) {
        // Get profiles for typing users
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', typingData.map(t => t.user_id));

        if (profileError) throw profileError;

        const usersWithProfiles = typingData.map(t => ({
          user_id: t.user_id,
          profile: profiles?.find(p => p.id === t.user_id)
        }));

        setTypingUsers(usersWithProfiles);
      } else {
        setTypingUsers([]);
      }
    } catch (error) {
      console.error('Error loading typing users:', error);
      setTypingUsers([]);
    }
  };

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {typingUsers.map((user) => (
        <div
          key={user.user_id}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/20"
        >
          <Avatar className="w-6 h-6 rounded-xl">
            <AvatarImage 
              src={user.profile?.avatar_url} 
              alt={user.profile?.display_name || user.profile?.username || 'User'}
            />
            <AvatarFallback className="rounded-xl text-xs bg-primary/20">
              {(user.profile?.display_name || user.profile?.username || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '333ms', animationDuration: '1s' }}></div>
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '666ms', animationDuration: '1s' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};