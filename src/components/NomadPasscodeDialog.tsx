import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import nomadLogo from '@/assets/nomad-logo.png';

interface NomadPasscodeDialogProps {
  isOpen: boolean;
  onVerified: () => void;
}

export const NomadPasscodeDialog = ({ isOpen, onVerified }: NomadPasscodeDialogProps) => {
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (passcode.length !== 5) {
      toast.error('Passcode must be 5 digits');
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('nomad-chat', {
        body: { 
          action: 'verify_passcode',
          passcode 
        }
      });

      if (error) {
        console.error('Verification error:', error);
        toast.error('Failed to verify passcode');
        setIsVerifying(false);
        return;
      }

      if (data?.verified) {
        toast.success('NOMAD access granted');
        onVerified();
      } else {
        toast.error('Invalid passcode');
        setPasscode('');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify passcode');
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
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/95 border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src={nomadLogo} alt="NOMAD" className="h-16 w-16 rounded-lg" />
          </div>
          <DialogTitle className="text-center text-xl">NOMAD Access Required</DialogTitle>
          <DialogDescription className="text-center">
            Enter the 5-digit passcode to access NOMAD
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyPress={handleKeyPress}
              className="pl-10 text-center tracking-widest text-lg"
              maxLength={5}
              autoFocus
            />
          </div>
          
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || passcode.length !== 5}
            className="w-full"
          >
            {isVerifying ? 'Verifying...' : 'Verify Access'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            This passcode is required to use NOMAD's advanced security features
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};