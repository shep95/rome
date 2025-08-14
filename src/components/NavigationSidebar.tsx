import React from 'react';
import { MessageCircle, Phone, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavigationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Generate a simple avatar background color based on user email
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarColor = user?.email ? getAvatarColor(user.email) : 'bg-gray-500';

  return (
    <div className="w-16 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-4 hover:w-48 transition-all duration-300 group overflow-hidden">
      {/* Header with ROME title and profile */}
      <div className="flex items-center justify-between w-full px-3 mb-8">
        <div className="flex items-center space-x-3">
          {/* ROME Logo/Title */}
          <div className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            ROME
          </div>
        </div>
        
        {/* Profile Picture - Square Rounded */}
        <div className={`w-8 h-8 ${avatarColor} rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-2 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};