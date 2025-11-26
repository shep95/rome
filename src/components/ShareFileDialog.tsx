import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Copy, Link2, Clock, Eye, Lock } from 'lucide-react';

interface ShareFileDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export const ShareFileDialog: React.FC<ShareFileDialogProps> = ({
  open,
  onClose,
  fileId,
  fileName
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(7); // days
  const [maxViews, setMaxViews] = useState<number>(0); // 0 = unlimited
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');

  const generateShareLink = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const { data, error } = await supabase
        .from('file_shares')
        .insert({
          file_id: fileId,
          shared_by: user.id,
          access_type: 'view',
          expires_at: expiresAt.toISOString(),
          max_views: maxViews > 0 ? maxViews : null,
          password_hash: requirePassword && password ? btoa(password) : null
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/share/${data.id}`;
      setShareUrl(url);
      toast.success('Share link generated successfully');
    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast.error(error.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Share "{fileName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <>
              {/* Expiry Time */}
              <div className="space-y-2">
                <Label htmlFor="expires" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expires After (days)
                </Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value) || 7)}
                  className="backdrop-blur-sm bg-card/50"
                />
              </div>

              {/* Max Views */}
              <div className="space-y-2">
                <Label htmlFor="maxViews" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Max Views (0 = unlimited)
                </Label>
                <Input
                  id="maxViews"
                  type="number"
                  min="0"
                  value={maxViews}
                  onChange={(e) => setMaxViews(parseInt(e.target.value) || 0)}
                  className="backdrop-blur-sm bg-card/50"
                />
              </div>

              {/* Password Protection */}
              <div className="flex items-center justify-between">
                <Label htmlFor="password-toggle" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Require Password
                </Label>
                <Switch
                  id="password-toggle"
                  checked={requirePassword}
                  onCheckedChange={setRequirePassword}
                />
              </div>

              {requirePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="backdrop-blur-sm bg-card/50"
                  />
                </div>
              )}

              <Button
                onClick={generateShareLink}
                disabled={loading || (requirePassword && !password)}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </>
          ) : (
            <>
              {/* Share URL Display */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="backdrop-blur-sm bg-card/50 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Share Info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{expiresIn} days</span>
                </p>
                {maxViews > 0 && (
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Views:</span>
                    <span className="font-medium">{maxViews}</span>
                  </p>
                )}
                {requirePassword && (
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Protected:</span>
                    <span className="font-medium text-primary">Yes</span>
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setShareUrl(null);
                  setExpiresIn(7);
                  setMaxViews(0);
                  setRequirePassword(false);
                  setPassword('');
                }}
                className="w-full"
              >
                Generate New Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
