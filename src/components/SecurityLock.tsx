import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SecurityLockProps {
  isOpen: boolean;
  onUnlock: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export const SecurityLock = ({ 
  isOpen, 
  onUnlock, 
  onCancel,
  title = "Security Check",
  description = "Enter your 4-digit code to continue"
}: SecurityLockProps) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [isShaking, setIsShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; wallpaper_url?: string; display_name?: string; username?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '']);
      setAttempts(0);
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, wallpaper_url, display_name, username')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }

    // DON'T auto-verify - let user click unlock button
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
    
    // Allow Enter key to submit
    if (e.key === 'Enter' && code.every(digit => digit !== '')) {
      handleSubmit();
    }
  };

  const verifyCode = async (codeToVerify: string[]) => {
    const enteredCode = codeToVerify.join('');
    
    try {
      // Get the user's actual security code from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const userSecurityCode = user?.user_metadata?.security_code;
      
      console.log('Entered code:', enteredCode, 'User security code:', userSecurityCode);
      
      if (enteredCode === userSecurityCode) {
        console.log('Code verified successfully, calling onUnlock');
        onUnlock();
        setCode(['', '', '', '']); // Clear the code after successful unlock
        setAttempts(0);
      } else {
        console.log('Code verification failed');
        setAttempts(prev => prev + 1);
        setIsShaking(true);
        
        // Don't clear immediately to avoid the loop - give user feedback first
        setTimeout(() => {
          setCode(['', '', '', '']);
          setIsShaking(false);
          // Focus first input
          const firstInput = document.getElementById('digit-0');
          firstInput?.focus();
        }, 1000);
      }
    } catch (error) {
      console.error('Error verifying security code:', error);
      setAttempts(prev => prev + 1);
      setIsShaking(true);
      setTimeout(() => {
        setCode(['', '', '', '']);
        setIsShaking(false);
        const firstInput = document.getElementById('digit-0');
        firstInput?.focus();
      }, 1000);
    }
  };

  const handleSubmit = () => {
    if (code.every(digit => digit !== '')) {
      verifyCode(code);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel ? () => onCancel() : () => {}}>
      <DialogContent 
        className={cn(
          "sm:max-w-md relative overflow-hidden",
          isShaking && "animate-[shake_0.5s_ease-in-out]"
        )}
        style={{
          backgroundImage: userProfile?.wallpaper_url 
            ? `url(${userProfile.wallpaper_url})`
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Backdrop blur overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        
        {/* Content */}
        <div className="relative z-10">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage 
                    src={userProfile?.avatar_url} 
                    alt={userProfile?.display_name || userProfile?.username || "User"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-primary/10 p-1">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            {userProfile?.display_name && (
              <p className="text-sm text-muted-foreground">Welcome back, {userProfile.display_name}</p>
            )}
            <p className="text-muted-foreground mt-2">{description}</p>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={cn(
                    "w-12 h-12 text-center text-lg font-mono border-2 transition-all",
                    "focus:ring-2 focus:ring-primary focus:border-primary",
                    "bg-background/50 backdrop-blur-sm",
                    attempts > 0 && "border-destructive focus:border-destructive focus:ring-destructive"
                  )}
                  autoComplete="off"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {attempts > 0 && (
              <p className="text-center text-sm text-destructive">
                Incorrect code. {attempts >= 3 ? 'Please try again.' : `${3 - attempts} attempts remaining.`}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-primary/90 hover:bg-primary backdrop-blur-sm"
                disabled={!code.every(digit => digit !== '')}
              >
                Unlock
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 bg-background/50 backdrop-blur-sm border-border/50"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Global app lock component
interface AppLockProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const AppLock = ({ isLocked, onUnlock }: AppLockProps) => {
  return (
    <SecurityLock
      isOpen={isLocked}
      onUnlock={onUnlock}
      title="App Locked"
      description="Enter your 4-digit code to access the app"
    />
  );
};