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
      {/* Mobile Navigation - Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
              R
            </div>
            <h1 className="text-foreground font-bold text-lg">ROME</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onSectionChange('messages')}
              variant={activeSection === 'messages' ? 'default' : 'ghost'}
              size="sm"
              className={activeSection === 'messages' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onSectionChange('calls')}
              variant={activeSection === 'calls' ? 'default' : 'ghost'}
              size="sm"
              className={activeSection === 'calls' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSettingsClick}
              variant={activeSection === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className={activeSection === 'settings' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-8 h-8 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-medium text-sm">
                {getUserInitial()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Sidebar */}
      <div className="hidden md:block group fixed left-4 top-4 bottom-4 z-30">
        <div className="w-16 group-hover:w-48 bg-background/80 backdrop-blur-xl border border-border rounded-2xl p-4 transition-all duration-300 overflow-hidden h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
              RO
            </div>
            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <h1 className="text-foreground font-bold text-lg">ROME</h1>
            </div>
          </div>
          
          {/* Navigation Items */}
          <nav className="space-y-3">
            <Button
              onClick={() => onSectionChange('messages')}
              variant={activeSection === 'messages' ? 'default' : 'ghost'}
              className={`w-full justify-start p-3 h-auto ${
                activeSection === 'messages'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle className="w-5 h-5 min-w-[20px]" />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
                Messages
              </span>
            </Button>
            
            <Button
              onClick={() => onSectionChange('calls')}
              variant={activeSection === 'calls' ? 'default' : 'ghost'}
              className={`w-full justify-start p-3 h-auto ${
                activeSection === 'calls'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Phone className="w-5 h-5 min-w-[20px]" />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
                Calls
              </span>
            </Button>
            
            <Button
              onClick={handleSettingsClick}
              variant={activeSection === 'settings' ? 'default' : 'ghost'}
              className={`w-full justify-start p-3 h-auto ${
                activeSection === 'settings'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Settings className="w-5 h-5 min-w-[20px]" />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
                Settings
              </span>
            </Button>
          </nav>
          
          {/* Profile Section */}
          <div className="mt-auto pt-8">
            <div className="flex items-center">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-8 h-8 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {getUserInitial()}
                </div>
              )}
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <p className="text-foreground font-medium text-sm truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-muted-foreground text-xs">Online</p>
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