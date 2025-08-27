import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserX, User, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AnonymousToggleProps {
  conversationId: string;
  isAnonymous: boolean;
  onToggle: (isAnonymous: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const AnonymousToggle: React.FC<AnonymousToggleProps> = ({
  conversationId,
  isAnonymous,
  onToggle,
  disabled = false,
  className
}) => {
  const { user } = useAuth();
  const [canPostAnonymously, setCanPostAnonymously] = useState(true);
  const [isGroupConversation, setIsGroupConversation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAnonymousPrivileges();
  }, [conversationId, user]);

  const checkAnonymousPrivileges = async () => {
    if (!user || !conversationId) return;
    
    setLoading(true);
    try {
      // Check if this is a group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('type')
        .eq('id', conversationId)
        .single();
      
      if (convError) throw convError;
      
      const isGroup = conversation.type === 'group';
      setIsGroupConversation(isGroup);
      
      if (!isGroup) {
        // Direct conversations don't support anonymous posting
        setCanPostAnonymously(false);
        return;
      }
      
      // Check user's anonymous posting privileges
      const { data: participant, error: participantError } = await supabase
        .from('conversation_participants')
        .select('can_post_anonymously, anonymous_revoked_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .is('left_at', null)
        .single();
      
      if (participantError) throw participantError;
      
      setCanPostAnonymously(
        participant.can_post_anonymously && !participant.anonymous_revoked_at
      );
      
    } catch (error) {
      console.error('Error checking anonymous privileges:', error);
      setCanPostAnonymously(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (!canPostAnonymously && checked) {
      toast.error('Anonymous posting is not available for this conversation');
      return;
    }
    
    onToggle(checked);
    
    if (checked) {
      toast.info('Anonymous mode enabled. Your identity will be hidden.', {
        description: 'Messages will appear as "Anonymous" to other members'
      });
    } else {
      toast.info('Anonymous mode disabled. Your identity will be visible.');
    }
  };

  // Don't show for direct conversations
  if (!isGroupConversation || loading) {
    return null;
  }

  const isToggleDisabled = disabled || !canPostAnonymously;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {isAnonymous ? (
                  <UserX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <Switch
                checked={isAnonymous}
                onCheckedChange={handleToggle}
                disabled={isToggleDisabled}
                className="data-[state=checked]:bg-orange-500"
              />
              
              <span className={cn(
                "text-sm font-medium transition-colors",
                isAnonymous ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
                isToggleDisabled && "opacity-50"
              )}>
                {isAnonymous ? 'Anonymous' : 'Identified'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              {!canPostAnonymously ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Anonymous posting unavailable</p>
                    <p className="text-xs text-muted-foreground">
                      This feature has been disabled for your account or this conversation.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {isAnonymous ? 'Anonymous Mode Active' : 'Send as Yourself'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAnonymous 
                      ? 'Your messages will appear as "Anonymous" to other members. Group admins can still see your identity in private logs.'
                      : 'Toggle to send messages anonymously in this group conversation.'
                    }
                  </p>
                  {isAnonymous && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <Shield className="h-3 w-3" />
                      <span>Admins can identify anonymous messages</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};