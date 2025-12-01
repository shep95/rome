import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface NomadPinDialogProps {
  isOpen: boolean;
  onVerified: (pin: string) => void;
  onCancel: () => void;
}

export const NomadPinDialog: React.FC<NomadPinDialogProps> = ({
  isOpen,
  onVerified,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must contain only numbers');
      return;
    }

    setIsVerifying(true);

    try {
      // Get user's stored security code from auth metadata
      const storedPin = localStorage.getItem('nomad_security_code');
      
      if (!storedPin) {
        // First time - set the PIN
        localStorage.setItem('nomad_security_code', pin);
        toast.success('Security PIN set successfully');
        onVerified(pin);
      } else if (storedPin === pin) {
        // PIN matches
        onVerified(pin);
      } else {
        // PIN doesn't match
        toast.error('Incorrect PIN');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      toast.error('Failed to verify PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Shield className="w-16 h-16 text-primary" />
              <Lock className="w-6 h-6 text-primary-foreground absolute bottom-0 right-0 bg-primary rounded-full p-1" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Encrypted NOMAD Storage
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your 4-digit security PIN to encrypt and sync your NOMAD conversations across devices.
            <span className="block mt-2 text-xs text-muted-foreground">
              Your conversations are encrypted with military-grade AES-256-GCM before being stored.
              Only you can decrypt them with your PIN.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              className="flex-1"
              disabled={pin.length !== 4 || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            💡 If this is your first time, your PIN will be set. Keep it safe!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
