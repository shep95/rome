import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityLockProps {
  isOpen: boolean;
  onUnlock: () => void;
  title?: string;
  description?: string;
}

export const SecurityLock = ({ 
  isOpen, 
  onUnlock, 
  title = "Security Check",
  description = "Enter your 4-digit code to continue"
}: SecurityLockProps) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '']);
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

    // Auto-verify when all digits are filled
    if (newCode.every(digit => digit !== '') && index === 3) {
      setTimeout(() => verifyCode(newCode), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyCode = (codeToVerify: string[]) => {
    const enteredCode = codeToVerify.join('');
    // Try multiple sources for the security code
    const storedCode = localStorage.getItem('securityCode');
    const userMetaCode = localStorage.getItem('userSecurityCode');
    const correctCode = storedCode || userMetaCode || '1234';

    console.log('Entered code:', enteredCode, 'Expected code:', correctCode);

    if (enteredCode === correctCode) {
      onUnlock();
      setCode(['', '', '', '']); // Clear the code after successful unlock
    } else {
      setIsShaking(true);
      setCode(['', '', '', '']);
      setTimeout(() => setIsShaking(false), 500);
      
      // Focus first input
      const firstInput = document.getElementById('digit-0');
      firstInput?.focus();
    }
  };

  const handleSubmit = () => {
    if (code.every(digit => digit !== '')) {
      verifyCode(code);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
          </p>
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
          
          <Button
            onClick={handleSubmit}
            disabled={!code.every(digit => digit !== '')}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            Unlock
          </Button>
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