import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Upload, 
  User, 
  Shield, 
  Image as ImageIcon,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'security' | 'shortcuts'>('appearance');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [screenshotProtection, setScreenshotProtection] = useState(false);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Screenshot protection effect
  useEffect(() => {
    if (screenshotProtection) {
      const preventScreenshot = (e: KeyboardEvent) => {
        // Prevent common screenshot shortcuts
        if (
          (e.ctrlKey && e.shiftKey && e.key === 'S') || // Chrome DevTools
          (e.metaKey && e.shiftKey && e.key === '3') || // macOS screenshot
          (e.metaKey && e.shiftKey && e.key === '4') || // macOS screenshot
          (e.key === 'PrintScreen') || // Windows screenshot
          (e.ctrlKey && e.key === 'PrintScreen') // Windows screenshot
        ) {
          e.preventDefault();
          toast.error('Screenshots are disabled for security');
          return false;
        }
      };

      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        toast.error('Right-click is disabled for security');
      };

      const preventDevTools = (e: KeyboardEvent) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
          toast.error('Developer tools are disabled for security');
        }
      };

      const preventDragDrop = (e: DragEvent) => {
        e.preventDefault();
      };

      // Add screenshot protection styles
      const style = document.createElement('style');
      style.textContent = `
        body { 
          -webkit-user-select: none; 
          -moz-user-select: none; 
          -ms-user-select: none; 
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        * {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
      `;
      document.head.appendChild(style);

      document.addEventListener('keydown', preventScreenshot);
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('keydown', preventDevTools);
      document.addEventListener('dragstart', preventDragDrop);

      return () => {
        document.removeEventListener('keydown', preventScreenshot);
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('keydown', preventDevTools);
        document.removeEventListener('dragstart', preventDragDrop);
        document.head.removeChild(style);
      };
    }
  }, [screenshotProtection]);

  // Load saved settings
  useEffect(() => {
    const savedBackground = localStorage.getItem('rome-background-image');
    const savedProfile = localStorage.getItem('rome-profile-image');
    const savedScreenshotProtection = localStorage.getItem('rome-screenshot-protection');
    
    if (savedBackground) setBackgroundImage(savedBackground);
    if (savedProfile) setProfileImage(savedProfile);
    if (savedScreenshotProtection) setScreenshotProtection(JSON.parse(savedScreenshotProtection));
  }, []);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBackgroundImage(imageUrl);
        localStorage.setItem('rome-background-image', imageUrl);
        toast.success('Background image updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Support both images and GIFs
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setProfileImage(imageUrl);
          localStorage.setItem('rome-profile-image', imageUrl);
          toast.success('Profile image updated successfully');
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select a valid image or GIF file');
      }
    }
  };

  const handleScreenshotProtectionToggle = (enabled: boolean) => {
    setScreenshotProtection(enabled);
    localStorage.setItem('rome-screenshot-protection', JSON.stringify(enabled));
    if (enabled) {
      toast.success('Screenshot protection enabled');
    } else {
      toast.success('Screenshot protection disabled');
    }
  };

  const clearBackgroundImage = () => {
    setBackgroundImage(null);
    localStorage.removeItem('rome-background-image');
    toast.success('Background image removed');
  };

  const clearProfileImage = () => {
    setProfileImage(null);
    localStorage.removeItem('rome-profile-image');
    toast.success('Profile image removed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-background/80 backdrop-blur-xl border-border p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-card/50 border-r border-border p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Settings</h2>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === 'appearance'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span>Appearance</span>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === 'security'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </button>
              
              <button
                onClick={() => setActiveTab('shortcuts')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === 'shortcuts'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Shortcuts</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Appearance Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-foreground text-lg font-medium">Background Image</Label>
                    <p className="text-muted-foreground text-sm mb-4">
                      Set a custom background image for all your conversations and group chats
                    </p>
                    
                    {backgroundImage && (
                      <div className="mb-4 relative">
                        <img 
                          src={backgroundImage} 
                          alt="Background preview" 
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <Button
                          onClick={clearBackgroundImage}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => backgroundInputRef.current?.click()}
                      className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Background Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'profile' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-foreground text-lg font-medium">Profile Picture</Label>
                    <p className="text-muted-foreground text-sm mb-4">
                      Upload your profile picture (supports images and GIFs). Changes are saved automatically.
                    </p>
                    
                    {profileImage && (
                      <div className="mb-4 relative w-24 h-24">
                        <img 
                          src={profileImage} 
                          alt="Profile preview" 
                          className="w-24 h-24 object-cover rounded-lg border border-border"
                        />
                        <Button
                          onClick={clearProfileImage}
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileUpload}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => profileInputRef.current?.click()}
                      className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Profile Picture
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Label className="text-foreground text-lg font-medium">User Information</Label>
                    <p className="text-muted-foreground text-sm mb-4">
                      Your account details
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">Email</Label>
                        <p className="text-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                    <div className="flex-1">
                      <Label className="text-foreground text-lg font-medium">Screenshot Protection</Label>
                      <p className="text-muted-foreground text-sm mt-1">
                        Prevent users from taking screenshots of the dashboard and conversations. 
                        This will disable right-click, developer tools, and common screenshot shortcuts.
                      </p>
                    </div>
                    <Switch
                      checked={screenshotProtection}
                      onCheckedChange={handleScreenshotProtectionToggle}
                      className="ml-4"
                    />
                  </div>
                  
                  {screenshotProtection && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-primary">
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Screenshot Protection Active</span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-2">
                        The following features are now disabled:
                      </p>
                      <ul className="text-muted-foreground text-sm mt-1 list-disc list-inside">
                        <li>Right-click context menu</li>
                        <li>Developer tools (F12, Ctrl+Shift+I)</li>
                        <li>Screenshot shortcuts (Print Screen, Cmd+Shift+3/4)</li>
                        <li>Text selection and dragging</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'shortcuts' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Keyboard Shortcuts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                      <div>
                        <h4 className="text-foreground font-medium">Lock App</h4>
                        <p className="text-muted-foreground text-sm">Instantly lock the app and require 4-digit code to unlock</p>
                      </div>
                      <div className="bg-primary/10 px-3 py-1 rounded border border-primary/20">
                        <span className="text-primary font-mono text-sm">Shift + L</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};