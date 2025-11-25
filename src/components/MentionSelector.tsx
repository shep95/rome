import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { AtSign } from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface MentionSelectorProps {
  conversationId: string;
  searchQuery: string;
  onSelect: (user: User) => void;
  onClose: () => void;
}

export const MentionSelector = ({
  conversationId,
  searchQuery,
  onSelect,
  onClose
}: MentionSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [conversationId, searchQuery]);

  const loadUsers = async () => {
    try {
      // Get conversation participants
      const { data, error } = await supabase
        .rpc('get_conversation_participant_profiles', {
          conversation_uuid: conversationId
        });

      if (error) throw error;

      // Filter by search query
      const filtered = data?.filter((user: User) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

      setUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandList>
        <CommandGroup heading="Mention user">
          {users.map((user) => (
            <CommandItem
              key={user.id}
              onSelect={() => {
                onSelect(user);
                onClose();
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.display_name?.[0] || user.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.display_name || user.username}
                  </span>
                  {user.display_name && (
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  )}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
