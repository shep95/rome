import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import holeShipBg from '@/assets/hole-ship-bg.jpeg';

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

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '']);
      setAttempts(0);
    }
  }, [isOpen]);

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

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
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
      <DialogPortal>
        <DialogOverlay 
          className="fixed inset-0 z-50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{
            backgroundImage: `url(${holeShipBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <DialogContent 
          className={cn(
            "sm:max-w-md",
            isShaking && "animate-[shake_0.5s_ease-in-out]"
          )}
        >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {description}
            {attempts > 0 && (
              <span className="block text-destructive mt-1">
                Incorrect code. Try again. (Attempt {attempts}/3)
              </span>
            )}
          </p>
          
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>Security Warning:</strong> Do not save this 4-digit code to any password manager or browser. Government agencies can request access to these stored codes from software companies.
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`digit-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold font-mono"
                autoFocus={index === 0}
                autoComplete="off"
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!code.every(digit => digit !== '')}
              className="flex-1"
            >
              <Lock className="mr-2 h-4 w-4" />
              Unlock
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        </DialogContent>
      </DialogPortal>
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