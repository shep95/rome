import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Upload, 
  User, 
  Shield, 
  Image as ImageIcon,
  X,
  Check,
  Eye,
  EyeOff,
  Lock,
  Key,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ScreenshotProtection from '@/plugins/ScreenshotProtection';
import { supabase } from '@/integrations/supabase/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'security' | 'shortcuts' | 'valuation'>('appearance');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [screenshotProtection, setScreenshotProtection] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [profileData, setProfileData] = useState<{username?: string, login_username?: string, display_name?: string} | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // PIN change states  
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: ['', '', '', ''],
    newPin: ['', '', '', ''],
    confirmPin: ['', '', '', '']
  });
  const [isChangingPin, setIsChangingPin] = useState(false);

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

  // Load saved settings and profile data
  useEffect(() => {
    const savedBackground = localStorage.getItem('rome-background-image');
    const savedProfile = localStorage.getItem('rome-profile-image');
    const savedScreenshotProtection = localStorage.getItem('rome-screenshot-protection');
    
    if (savedBackground) setBackgroundImage(savedBackground);
    if (savedProfile) setProfileImage(savedProfile);
    if (savedScreenshotProtection) setScreenshotProtection(JSON.parse(savedScreenshotProtection));

    // Load profile data from Supabase
    const loadProfileData = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, login_username, display_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfileData(profile);
        }
      }
    };

    loadProfileData();
  }, [user?.id]);

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
      // Attempt to enable native protection on mobile
      void ScreenshotProtection.enableProtection();
    } else {
      toast.success('Screenshot protection disabled');
      void ScreenshotProtection.disableProtection();
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

  // Password change handlers
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      // Verify current password by attempting to re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: passwordForm.currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        toast.error('Failed to update password');
      } else {
        toast.success('Password updated successfully');
        setShowPasswordForm(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error('An error occurred while updating password');
    }
    
    setIsChangingPassword(false);
  };

  // PIN change handlers
  const handlePinDigitChange = (formField: 'currentPin' | 'newPin' | 'confirmPin', index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    setPinForm(prev => ({
      ...prev,
      [formField]: prev[formField].map((digit, i) => i === index ? value : digit)
    }));

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`${formField}-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinChange = async () => {
    const currentPinValue = pinForm.currentPin.join('');
    const newPinValue = pinForm.newPin.join('');
    const confirmPinValue = pinForm.confirmPin.join('');

    if (!currentPinValue || currentPinValue.length !== 4) {
      toast.error('Please enter your current 4-digit PIN');
      return;
    }

    if (!newPinValue || newPinValue.length !== 4) {
      toast.error('Please enter a new 4-digit PIN');
      return;
    }

    if (newPinValue !== confirmPinValue) {
      toast.error('New PINs do not match');
      return;
    }

    if (newPinValue === currentPinValue) {
      toast.error('New PIN must be different from current PIN');
      return;
    }

    setIsChangingPin(true);

    try {
      // Verify current PIN
      const userSecurityCode = user?.user_metadata?.security_code;
      
      if (currentPinValue !== userSecurityCode) {
        toast.error('Current PIN is incorrect');
        setIsChangingPin(false);
        return;
      }

      // Update PIN in user metadata - this completely replaces the old PIN
      const { error } = await supabase.auth.updateUser({
        data: { 
          security_code: newPinValue
        }
      });

      if (error) {
        toast.error('Failed to update PIN');
      } else {
        // Force refresh user data to ensure old PIN is invalidated
        await supabase.auth.refreshSession();
        toast.success('PIN updated successfully - old code has been deleted and is no longer valid');
        setShowPinForm(false);
        setPinForm({
          currentPin: ['', '', '', ''],
          newPin: ['', '', '', ''],
          confirmPin: ['', '', '', '']
        });
      }
    } catch (error) {
      toast.error('An error occurred while updating PIN');
    }

    setIsChangingPin(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[800px] bg-background/80 backdrop-blur-xl border-border p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Mobile/Tablet Tab Navigation */}
          <div className="lg:hidden bg-card/50 border-b border-border p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Sovereign Control</h2>
            </div>
            
            <nav className="flex space-x-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'appearance'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'security'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </button>
              
              <button
                onClick={() => setActiveTab('shortcuts')}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'shortcuts'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              
              
              <button
                onClick={() => setActiveTab('valuation')}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'valuation'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Valuation</span>
              </button>
            </nav>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-card/50 border-r border-border p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Sovereign Control</h2>
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
              
              
              <button
                onClick={() => setActiveTab('valuation')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === 'valuation'
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Valuation</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-4 md:p-6">
            {activeTab === 'appearance' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Appearance Sovereign Control</span>
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
                    <span>Profile Sovereign Control</span>
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
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Email</Label>
                        <p className="text-foreground">{user?.email}</p>
                      </div>
                      
                      {/* Username Section */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-muted-foreground text-sm">Display Username (Public)</Label>
                          <p className="text-foreground font-mono">{profileData?.username || 'Loading...'}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-muted-foreground text-sm">Login Username (Private)</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowUsername(!showUsername)}
                              className="h-8 px-3"
                            >
                              {showUsername ? (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Show
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="relative">
                            <p className={`text-foreground font-mono transition-all duration-200 ${
                              showUsername ? '' : 'filter blur-md select-none'
                            }`}>
                              {profileData?.login_username || 'Loading...'}
                            </p>
                            {!showUsername && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  Click "Show" to reveal
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            This is the username you use to sign in. Keep it private for security.
                          </p>
                        </div>
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
                    <span>Security Sovereign Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-muted/20 rounded-lg border border-border gap-4">
                    <div className="flex-1 min-w-0">
                      <Label className="text-foreground text-base sm:text-lg font-medium">Screenshot & Recording Protection</Label>
                      <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">
                        Protect your conversations from screenshots and recordings. When enabled, this will prevent ALL participants 
                        in your conversations and group chats from taking screenshots, using right-click menus, developer tools, 
                        and screenshot shortcuts. This ensures your privacy is maintained across all your communications.
                      </p>
                    </div>
                    <Switch
                      checked={screenshotProtection}
                      onCheckedChange={handleScreenshotProtectionToggle}
                      className="flex-shrink-0"
                    />
                  </div>
                   
                   {screenshotProtection && (
                     <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4">
                       <div className="flex items-center space-x-2 text-primary">
                         <Check className="w-4 h-4 flex-shrink-0" />
                         <span className="font-medium text-sm sm:text-base">Screenshot & Recording Protection Active</span>
                       </div>
                       <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                         The following features are now disabled:
                       </p>
                       <ul className="text-muted-foreground text-xs sm:text-sm mt-1 list-disc list-inside space-y-1">
                         <li>Right-click context menu</li>
                         <li>Developer tools (F12, Ctrl+Shift+I)</li>
                         <li>Screenshot shortcuts (Print Screen, Cmd+Shift+3/4)</li>
                         <li>Screen recording detection (with warnings)</li>
                         <li>Text selection and dragging</li>
                       </ul>
                       <p className="text-muted-foreground text-xs mt-2 italic">
                         Note: Screen sharing for video calls and social media is allowed but will show warnings.
                       </p>
                     </div>
                   )}

                   {/* Password Change Section */}
                   <div className="pt-4 border-t border-border">
                     <div className="flex items-center justify-between mb-4">
                       <div>
                         <Label className="text-foreground text-lg font-medium">Password</Label>
                         <p className="text-muted-foreground text-sm">Change your account password</p>
                       </div>
                       <Button
                         onClick={() => setShowPasswordForm(!showPasswordForm)}
                         variant="outline"
                         size="sm"
                       >
                         <Key className="w-4 h-4 mr-2" />
                         Change Password
                       </Button>
                     </div>

                     {showPasswordForm && (
                       <div className="bg-muted/20 rounded-lg p-4 space-y-4">
                         <div className="space-y-2">
                           <Label>Current Password</Label>
                           <div className="relative">
                             <Input
                               type={showPasswords.current ? "text" : "password"}
                               value={passwordForm.currentPassword}
                               onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                               placeholder="Enter current password"
                               autoComplete="current-password"
                             />
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                               onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                             >
                               {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>New Password</Label>
                           <div className="relative">
                             <Input
                               type={showPasswords.new ? "text" : "password"}
                               value={passwordForm.newPassword}
                               onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                               placeholder="Enter new password (min 6 characters)"
                               autoComplete="new-password"
                             />
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                               onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                             >
                               {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>Confirm New Password</Label>
                           <div className="relative">
                             <Input
                               type={showPasswords.confirm ? "text" : "password"}
                               value={passwordForm.confirmPassword}
                               onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                               placeholder="Confirm new password"
                               autoComplete="new-password"
                             />
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                               onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                             >
                               {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                           </div>
                         </div>

                         <div className="flex gap-2">
                           <Button
                             onClick={handlePasswordChange}
                             disabled={isChangingPassword}
                             className="flex-1"
                           >
                             {isChangingPassword ? 'Updating...' : 'Update Password'}
                           </Button>
                           <Button
                             variant="outline"
                             onClick={() => {
                               setShowPasswordForm(false);
                               setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                             }}
                             className="flex-1"
                           >
                             Cancel
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>

                   {/* PIN Change Section */}
                   <div className="pt-4 border-t border-border">
                     <div className="flex items-center justify-between mb-4">
                       <div>
                         <Label className="text-foreground text-lg font-medium">4-Digit PIN</Label>
                         <p className="text-muted-foreground text-sm">Change your security PIN used for app access</p>
                       </div>
                       <Button
                         onClick={() => setShowPinForm(!showPinForm)}
                         variant="outline"
                         size="sm"
                       >
                         <Lock className="w-4 h-4 mr-2" />
                         Change PIN
                       </Button>
                     </div>

                     {showPinForm && (
                       <div className="bg-muted/20 rounded-lg p-4 space-y-4">
                         <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                           <div className="flex items-start gap-2">
                             <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                             <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                               <strong>Security Warning:</strong> Do not save this PIN to any password manager or browser. Government agencies can request access to these stored codes from software companies.
                             </p>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>Current PIN</Label>
                           <div className="flex gap-2">
                             {pinForm.currentPin.map((digit, index) => (
                               <Input
                                 key={index}
                                 id={`currentPin-${index}`}
                                 type="password"
                                 inputMode="numeric"
                                 maxLength={1}
                                 value={digit}
                                 onChange={(e) => handlePinDigitChange('currentPin', index, e.target.value)}
                                 className="w-12 h-12 text-center text-lg font-semibold font-mono"
                                 autoComplete="off"
                               />
                             ))}
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>New PIN</Label>
                           <div className="flex gap-2">
                             {pinForm.newPin.map((digit, index) => (
                               <Input
                                 key={index}
                                 id={`newPin-${index}`}
                                 type="password"
                                 inputMode="numeric"
                                 maxLength={1}
                                 value={digit}
                                 onChange={(e) => handlePinDigitChange('newPin', index, e.target.value)}
                                 className="w-12 h-12 text-center text-lg font-semibold font-mono"
                                 autoComplete="off"
                               />
                             ))}
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>Confirm New PIN</Label>
                           <div className="flex gap-2">
                             {pinForm.confirmPin.map((digit, index) => (
                               <Input
                                 key={index}
                                 id={`confirmPin-${index}`}
                                 type="password"
                                 inputMode="numeric"
                                 maxLength={1}
                                 value={digit}
                                 onChange={(e) => handlePinDigitChange('confirmPin', index, e.target.value)}
                                 className="w-12 h-12 text-center text-lg font-semibold font-mono"
                                 autoComplete="off"
                               />
                             ))}
                           </div>
                         </div>

                         <div className="flex gap-2">
                           <Button
                             onClick={handlePinChange}
                             disabled={isChangingPin}
                             className="flex-1"
                           >
                             {isChangingPin ? 'Updating...' : 'Update PIN'}
                           </Button>
                           <Button
                             variant="outline"
                             onClick={() => {
                               setShowPinForm(false);
                               setPinForm({
                                 currentPin: ['', '', '', ''],
                                 newPin: ['', '', '', ''],
                                 confirmPin: ['', '', '', '']
                               });
                             }}
                             className="flex-1"
                           >
                             Cancel
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
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

            
            {activeTab === 'valuation' && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Company Valuation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Valuation */}
                  <div>
                    <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">Current Valuation</h3>
                        <p className="text-4xl font-bold text-primary mb-4">$1,000,000</p>
                        <p className="text-muted-foreground">ROME Corporate Valuation</p>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-foreground font-medium">Launch Date:</span>
                          <span className="text-primary font-bold">May 28th, 2025</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equity Ownership */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Private Equity Owners of ROME</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">Zorak Corp</span>
                        <span className="text-primary font-bold">20%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">Asher Newton</span>
                        <span className="text-primary font-bold">20%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">R8T</span>
                        <span className="text-primary font-bold">20%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">Private Investor</span>
                        <span className="text-primary font-bold">5%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">Private Investor #2</span>
                        <span className="text-primary font-bold">5%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <span className="text-foreground font-medium">Trump P.</span>
                        <span className="text-primary font-bold">5%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-foreground font-medium">Investment Grid Leftover</span>
                        <span className="text-primary font-bold">25%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-muted-foreground text-sm">
                      <strong>Note:</strong> These valuations and ownership percentages are current as of the last assessment. 
                      The company valuation may change based on market conditions and business performance leading up to the launch date.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};