import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load profile image from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('rome-profile-image');
    if (savedProfile) setProfileImage(savedProfile);
  }, []);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <div className="group fixed left-2 md:left-4 top-2 md:top-4 bottom-2 md:bottom-4 z-30 flex flex-col">
        {/* Main Navigation */}
        <div className="w-12 md:w-16 group-hover:w-32 md:group-hover:w-48 bg-background/80 backdrop-blur-xl border border-border rounded-xl md:rounded-2xl p-2 md:p-4 transition-all duration-300 overflow-hidden">
          {/* Logo/Brand */}
          <div className="flex items-center mb-4 md:mb-8">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm">
              R
            </div>
            <div className="ml-2 md:ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <h1 className="text-foreground font-bold text-sm md:text-lg">ROME</h1>
            </div>
          </div>
          
          {/* Navigation Items */}
          <nav className="space-y-2 md:space-y-3">
            <Button
              onClick={() => onSectionChange('messages')}
              variant={activeSection === 'messages' ? 'default' : 'ghost'}
              className={`w-full justify-start p-2 md:p-3 h-auto ${
                activeSection === 'messages'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 min-w-[16px] md:min-w-[20px]" />
              <span className="ml-2 md:ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-xs md:text-sm">
                Messages
              </span>
            </Button>
            
            <Button
              onClick={() => onSectionChange('calls')}
              variant={activeSection === 'calls' ? 'default' : 'ghost'}
              className={`w-full justify-start p-2 md:p-3 h-auto ${
                activeSection === 'calls'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5 min-w-[16px] md:min-w-[20px]" />
              <span className="ml-2 md:ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-xs md:text-sm">
                Calls
              </span>
            </Button>
            
            <Button
              onClick={handleSettingsClick}
              variant={activeSection === 'settings' ? 'default' : 'ghost'}
              className={`w-full justify-start p-2 md:p-3 h-auto ${
                activeSection === 'settings'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 min-w-[16px] md:min-w-[20px]" />
              <span className="ml-2 md:ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-xs md:text-sm">
                Settings
              </span>
            </Button>
          </nav>
          
          {/* Profile Section */}
          <div className="mt-auto pt-4 md:pt-8">
            <div className="flex items-center">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-6 h-6 md:w-8 md:h-8 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-medium text-xs md:text-sm">
                  {getUserInitial()}
                </div>
              )}
              <div className="ml-2 md:ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <p className="text-foreground font-medium text-xs md:text-sm truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-muted-foreground text-[10px] md:text-xs">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};