import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  email: string;
}

interface UserSearchInputProps {
  onUserSelect: (user: User) => void;
  placeholder?: string;
  excludeUserIds?: string[];
}

export const UserSearchInput: React.FC<UserSearchInputProps> = ({
  onUserSelect,
  placeholder = "Search users...",
  excludeUserIds = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchUsers();
    } else {
      setUsers([]);
      setIsOpen(false);
    }
  }, [searchQuery, excludeUserIds]);

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_search')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .not('id', 'in', `(${excludeUserIds.join(',')})`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setIsOpen(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setSearchQuery('');
    setUsers([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50 border-white/20"
          onFocus={() => searchQuery.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>
      
      {isOpen && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary/20">
                  {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};