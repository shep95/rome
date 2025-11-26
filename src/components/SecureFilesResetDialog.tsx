import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';

interface SecureFilesResetDialogProps {
  open: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const SecureFilesResetDialog: React.FC<SecureFilesResetDialogProps> = ({
  open,
  onClose,
  onResetComplete
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (confirmText.toLowerCase() !== 'delete all') {
      toast.error('Please type "DELETE ALL" to confirm');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_secure_files_and_pin', {
        new_pin: newPin
      });

      if (error) throw error;

      const result = data as any;
      toast.success('Secure files cleared and PIN updated!', {
        description: `Deleted ${result.deleted_files} files, ${result.deleted_tags} tags, ${result.deleted_folders} folders`
      });

      // Clear form
      setNewPin('');
      setConfirmPin('');
      setConfirmText('');
      
      onResetComplete();
      onClose();
    } catch (error: any) {
      console.error('Reset error:', error);
      toast.error(error.message || 'Failed to reset secure files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Reset Secure Files & PIN
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>This action cannot be undone!</strong>
              <br />
              All your secure files, tags, and folders will be permanently deleted.
            </AlertDescription>
          </Alert>

          {/* New PIN */}
          <div className="space-y-2">
            <Label htmlFor="new-pin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              New 4-Digit PIN
            </Label>
            <Input
              id="new-pin"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              className="text-center text-lg font-mono tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              Choose a PIN you haven't shared publicly
            </p>
          </div>

          {/* Confirm PIN */}
          <div className="space-y-2">
            <Label htmlFor="confirm-pin">Confirm New PIN</Label>
            <Input
              id="confirm-pin"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              className="text-center text-lg font-mono tracking-wider"
            />
          </div>

          {/* Confirmation Text */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Type "DELETE ALL" to confirm
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL"
              className="font-mono"
            />
          </div>

          {/* PIN Match Indicator */}
          {newPin && confirmPin && (
            <div className="flex items-center gap-2 text-sm">
              {newPin === confirmPin ? (
                <span className="text-green-500">✓ PINs match</span>
              ) : (
                <span className="text-destructive">✗ PINs don't match</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={
                loading ||
                newPin !== confirmPin ||
                newPin.length !== 4 ||
                confirmText.toLowerCase() !== 'delete all'
              }
              className="flex-1"
            >
              {loading ? 'Resetting...' : 'Reset Everything'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
