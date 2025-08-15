import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSearchInput } from './UserSearchInput';
import { Camera, X, UserPlus, Trash2, Save } from 'lucide-react';

interface GroupChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  conversationAvatar?: string;
  onUpdate?: () => void;
}

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
    username: string;
  };
}

export const GroupChatSettings: React.FC<GroupChatSettingsProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  conversationAvatar,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(conversationName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(conversationAvatar || '');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(conversationName);
      setAvatarPreview(conversationAvatar || '');
      fetchParticipants();
      checkIfCreator();
    }
  }, [isOpen, conversationId, conversationName, conversationAvatar]);

  const checkIfCreator = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('created_by')
        .eq('id', conversationId)
        .single();
      
      setIsCreator(data?.created_by === user?.id);
    } catch (error) {
      console.error('Error checking creator status:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          user_id,
          role
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null);

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = data.map(p => p.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, username')
          .in('id', userIds);

        if (profileError) throw profileError;

        const participantsWithProfiles = data.map(participant => {
          const profile = profiles?.find(p => p.id === participant.user_id);
          return {
            ...participant,
            profiles: {
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url || '',
              username: profile?.username || ''
            }
          };
        });

        setParticipants(participantsWithProfiles);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive"
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${conversationId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!isCreator) return;

    setLoading(true);
    try {
      let avatarUrl = conversationAvatar;
      
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) avatarUrl = newAvatarUrl;
      }

      const { error } = await supabase
        .from('conversations')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group chat updated successfully"
      });

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error updating group chat:', error);
      toast({
        title: "Error",
        description: "Failed to update group chat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (selectedUser: any) => {
    if (!isCreator) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: selectedUser.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedUser.display_name || selectedUser.username} added to group`
      });

      fetchParticipants();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user to group",
        variant: "destructive"
      });
    }
  };

  const handleRemoveUser = async (participantId: string, userId: string) => {
    if (!isCreator || userId === user?.id) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed from group"
      });

      fetchParticipants();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCreator) return;

    if (!confirm('Are you sure you want to delete this group chat? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete participants
      await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group chat deleted successfully"
      });

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group chat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCreator) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-background/20 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Glass morphic header */}
        <div className="relative p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-white/20">
          <h2 className="text-xl font-semibold text-foreground">Group Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Avatar Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Group Avatar</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-white/20 rounded-lg">
                <AvatarImage src={avatarPreview} className="rounded-lg" />
                <AvatarFallback className="bg-primary/20 text-lg rounded-lg">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="bg-background/50 border-white/20">
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Avatar
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-sm font-medium">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-background/50 border-white/20"
            />
          </div>

          {/* Add Members Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Add Members</Label>
            <UserSearchInput
              onUserSelect={handleAddUser}
              placeholder="Search users to add..."
              excludeUserIds={participants.map(p => p.user_id)}
            />
          </div>

          {/* Current Members */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Members ({participants.length})</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.profiles.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20">
                        {participant.profiles.display_name?.charAt(0).toUpperCase() || 
                         participant.profiles.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {participant.profiles.display_name || participant.profiles.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={participant.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {participant.role}
                        </Badge>
                        {participant.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {participant.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(participant.id, participant.user_id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/20">
            <Button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="flex-1 bg-primary/80 hover:bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleDeleteGroup}
              variant="destructive"
              disabled={loading}
              className="bg-destructive/80 hover:bg-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};