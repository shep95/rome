import { useState } from 'react';
import { Shield, UserMinus, Volume2, VolumeX, Crown, User, MoreVertical, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Participant {
  id: string;
  user_id: string;
  role: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  can_post_anonymously?: boolean;
}

interface GroupAdminControlsProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  participants: Participant[];
  onUpdate: () => void;
}

export const GroupAdminControls = ({
  open,
  onClose,
  conversationId,
  participants,
  onUpdate
}: GroupAdminControlsProps) => {
  const { user } = useAuth();
  const [actionUser, setActionUser] = useState<Participant | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'mute' | 'kick' | null>(null);

  const currentUserRole = participants.find(p => p.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === 'admin';

  const handleRoleChange = async (participantId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ role: newRole })
        .eq('id', participantId);

      if (error) throw error;

      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to member'}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRevokeAnonymous = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({
          can_post_anonymously: false,
          anonymous_revoked_at: new Date().toISOString(),
          anonymous_revoked_by: user?.id
        })
        .eq('id', participantId);

      if (error) throw error;

      toast.success('Anonymous posting revoked');
      onUpdate();
    } catch (error) {
      console.error('Error revoking anonymous:', error);
      toast.error('Failed to revoke anonymous posting');
    }
  };

  const handleKick = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('id', participantId);

      if (error) throw error;

      toast.success('User removed from group');
      onUpdate();
      setActionUser(null);
      setActionType(null);
    } catch (error) {
      console.error('Error kicking user:', error);
      toast.error('Failed to remove user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary text-primary-foreground';
      case 'moderator':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Group Administration
            </DialogTitle>
            <DialogDescription>
              Manage group members, roles, and permissions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {participants.map((participant) => {
                const isCurrentUser = participant.user_id === user?.id;
                const canManage = isAdmin && !isCurrentUser;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {participant.display_name?.[0] || participant.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {participant.display_name || participant.username}
                          {isCurrentUser && <span className="text-muted-foreground text-sm ml-1">(You)</span>}
                        </span>
                        <Badge className={getRoleBadgeColor(participant.role)}>
                          {participant.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                          {participant.role}
                        </Badge>
                      </div>
                      {participant.username && participant.display_name && (
                        <p className="text-xs text-muted-foreground">@{participant.username}</p>
                      )}
                    </div>

                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {participant.role !== 'admin' && (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(participant.id, 'admin')}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}
                          
                          {participant.role === 'admin' && (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(participant.id, 'member')}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Demote to Member
                            </DropdownMenuItem>
                          )}

                          {participant.can_post_anonymously && (
                            <DropdownMenuItem
                              onClick={() => handleRevokeAnonymous(participant.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Revoke Anonymous
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setActionUser(participant);
                              setActionType('kick');
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionUser && !!actionType} onOpenChange={() => {
        setActionUser(null);
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'kick' && 'Remove User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'kick' && `Are you sure you want to remove ${actionUser?.display_name || actionUser?.username} from this group? They can be re-added later.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setActionUser(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => actionUser && handleKick(actionUser.id)}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
