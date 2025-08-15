import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GroupChatCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export const GroupChatCreation = ({ isOpen, onClose, onGroupCreated }: GroupChatCreationProps) => {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [settings, setSettings] = useState({
    allowScreenshots: true,
    allowMessaging: true,
    autoDeleteEnabled: false,
    autoDeleteInterval: '1day'
  });
  const { toast } = useToast();

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGroupAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createGroupChat = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        console.error('No user found');
        throw new Error('Not authenticated');
      }
      
      console.log('Creating group chat for user:', user.id);

      // Create conversation via RPC to bypass RLS safely
      const interval = settings.autoDeleteEnabled ? (
        settings.autoDeleteInterval === '1day' ? '1 day' :
        settings.autoDeleteInterval === '1week' ? '7 days' :
        settings.autoDeleteInterval === '2weeks' ? '14 days' :
        settings.autoDeleteInterval === '1month' ? '30 days' : null
      ) : null;

      const { data: convId, error: rpcError } = await supabase.rpc('create_group_conversation', {
        _name: groupName,
        _settings: {
          allowScreenshots: settings.allowScreenshots,
          allowMessaging: settings.allowMessaging,
          autoDeleteEnabled: settings.autoDeleteEnabled
        },
        _auto_delete_after: interval
      });

      if (rpcError) throw rpcError;

      toast({
        title: "Group chat created!",
        description: `${groupName} has been successfully created.`,
      });

      // Reset form
      setStep(1);
      setGroupName('');
      setGroupAvatar(null);
      setAvatarPreview('');
      setSettings({
        allowScreenshots: true,
        allowMessaging: true,
        autoDeleteEnabled: false,
        autoDeleteInterval: '1day'
      });

      onGroupCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating group chat:', error);
      toast({
        title: "Error",
        description: `Failed to create group chat: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      // Don't close the dialog or reset form on error
    }
  };

  const nextStep = () => {
    if (step === 1 && !groupName.trim()) return;
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Chat - Step {step} of 3</DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={nextStep} disabled={!groupName.trim()}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <Label>Group Photo</Label>
              <div className="mt-2 flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback>
                    <Users className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button onClick={nextStep} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Group Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="screenshots">Allow Screenshots</Label>
                <Switch
                  id="screenshots"
                  checked={settings.allowScreenshots}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, allowScreenshots: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="messaging">Allow Messaging</Label>
                <Switch
                  id="messaging"
                  checked={settings.allowMessaging}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, allowMessaging: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autodelete">Auto-delete Messages</Label>
                <Switch
                  id="autodelete"
                  checked={settings.autoDeleteEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoDeleteEnabled: checked }))
                  }
                />
              </div>
              
              {settings.autoDeleteEnabled && (
                <div>
                  <Label>Delete messages after:</Label>
                  <Select
                    value={settings.autoDeleteInterval}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, autoDeleteInterval: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">1 Day</SelectItem>
                      <SelectItem value="1week">1 Week</SelectItem>
                      <SelectItem value="2weeks">2 Weeks</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button onClick={createGroupChat} className="flex-1">
                Create Group
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};