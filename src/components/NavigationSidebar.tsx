import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Phone, 
  Settings, 
  Inbox, 
  Info, 
  Heart,
  Camera,
  Upload,
  ImageIcon,
  Shield
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { CallHistory } from './CallHistory';
import { AboutUs } from './AboutUs';
import { InboxModal } from './InboxModal';

interface NavigationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  messageRequestCount?: number;
  onMessageRequestCountChange?: (count: number) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  activeSection, 
  onSectionChange,
  messageRequestCount = 0,
  onMessageRequestCountChange
}) => {
  const { user } = useAuth();
  const { uploadAvatar, uploadWallpaper, isUploading } = useFileUpload();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load profile data from localStorage and update when user changes
  useEffect(() => {
    const loadProfileData = () => {
      const savedProfile = localStorage.getItem('rome-profile-image');
      if (savedProfile) setProfileImage(savedProfile);
    };
    
    loadProfileData();
    
    // Listen for storage changes to update profile in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rome-profile-image') {
        setProfileImage(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]); // Re-run when user changes

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = await uploadAvatar(file);
      if (url) {
        setProfileImage(url);
      }
    }
  };

  const handleWallpaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadWallpaper(file);
      // The wallpaper will be applied automatically through localStorage
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleCallsClick = () => {
    setIsCallHistoryOpen(true);
  };

  const handleAboutUsClick = () => {
    setIsAboutUsOpen(true);
  };

  const handleDonationsClick = () => {
    window.open('https://donate.stripe.com/fZu14p2SI677bve3Ttfw403', '_blank');
  };

  const handleInboxClick = () => {
    setIsInboxOpen(true);
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      {/* Mobile Navigation - Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/lovable-uploads/6ff9b03d-a2fd-4cd2-b509-fb12b4bca3f2.png" 
              alt="ROME" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg"
            />
            <h1 className="text-foreground font-bold text-base sm:text-lg">ROME</h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              onClick={() => onSectionChange('messages')}
              variant={activeSection === 'messages' ? 'default' : 'ghost'}
              size="sm"
              className={`${activeSection === 'messages' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} p-2`}
            >
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleCallsClick}
              variant="ghost"
              size="sm"
              className="text-muted-foreground p-2"
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleInboxClick}
              variant="ghost"
              size="sm"
              className="text-muted-foreground p-2 relative"
            >
              <Inbox className="w-3 h-3 sm:w-4 sm:h-4" />
              {messageRequestCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {messageRequestCount}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => onSectionChange('secure-files')}
              variant={activeSection === 'secure-files' ? 'default' : 'ghost'}
              size="sm"
              className={`${activeSection === 'secure-files' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} p-2`}
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleAboutUsClick}
              variant="ghost"
              size="sm"
              className="text-muted-foreground p-2"
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleDonationsClick}
              variant="ghost"
              size="sm"
              className="text-muted-foreground p-2"
            >
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleSettingsClick}
              variant="ghost"
              size="sm"
              className="text-muted-foreground p-2"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="cursor-pointer"
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-medium text-xs">
                  {getUserInitial()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Sidebar */}
      <div className="hidden md:block fixed left-2 lg:left-4 top-2 lg:top-4 bottom-2 lg:bottom-4 z-30">
        <div className="w-56 lg:w-64 bg-background/80 backdrop-blur-xl border border-border rounded-2xl p-4 lg:p-6 h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center mb-6 lg:mb-8">
            <img 
              src="/lovable-uploads/6ff9b03d-a2fd-4cd2-b509-fb12b4bca3f2.png" 
              alt="ROME" 
              className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-lg"
            />
            <div className="ml-3">
              <h1 className="text-foreground font-bold text-lg lg:text-xl">ROME</h1>
            </div>
          </div>
          
          {/* Navigation Items */}
          <nav className="space-y-2 lg:space-y-3">
            <Button
              onClick={() => onSectionChange('messages')}
              variant="ghost"
              className={`w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 ${
                activeSection === 'messages'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Messages</span>
            </Button>
            
            <Button
              onClick={handleCallsClick}
              variant="ghost"
              className="w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 text-foreground hover:text-primary hover:bg-primary/10"
            >
              <Phone className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Calls</span>
            </Button>
            
            <Button
              onClick={handleInboxClick}
              variant="ghost"
              className={`w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 relative text-foreground hover:text-primary hover:bg-primary/10`}
            >
              <Inbox className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Inbox</span>
              {messageRequestCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-1 lg:top-2 right-1 lg:right-2 h-4 w-4 lg:h-5 lg:w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                >
                  {messageRequestCount}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={() => onSectionChange('secure-files')}
              variant="ghost"
              className={`w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 ${
                activeSection === 'secure-files'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Secure Files</span>
            </Button>
            
            <Button
              onClick={handleAboutUsClick}
              variant="ghost"
              className="w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 text-foreground hover:text-primary hover:bg-primary/10"
            >
              <Info className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">About Us</span>
            </Button>
            
            <Button
              onClick={handleDonationsClick}
              variant="ghost"
              className="w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 text-foreground hover:text-primary hover:bg-primary/10"
            >
              <Heart className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Donations</span>
            </Button>
            
            <Button
              onClick={handleSettingsClick}
              variant="ghost"
              className={`w-full h-10 lg:h-12 justify-start px-3 lg:px-4 transition-all duration-300 ${
                activeSection === 'settings'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Settings className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </nav>
          
          {/* Profile Section */}
          <div className="mt-auto pt-6 lg:pt-8">
            <div 
              className="flex items-center cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-xl border border-border"
                />
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {getUserInitial()}
                </div>
              )}
              <div className="ml-3">
                <p className="text-foreground font-medium text-sm truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-muted-foreground text-xs">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20 rounded-xl border border-border">
                <AvatarImage src={profileImage || ''} className="rounded-xl object-cover" />
                <AvatarFallback className="text-2xl rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <p className="font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              
              <div className="space-y-3">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">App Wallpaper</h3>
                <input
                  ref={wallpaperInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => wallpaperInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Change Wallpaper'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        requestCount={messageRequestCount}
        onRequestCountChange={onMessageRequestCountChange || (() => {})}
      />

      <CallHistory
        isOpen={isCallHistoryOpen}
        onClose={() => setIsCallHistoryOpen(false)}
      />
      
      <AboutUs
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
      />
    </>
  );
};