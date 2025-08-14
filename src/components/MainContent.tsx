import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Shield, 
  Plus, 
  Lock, 
  Upload, 
  File,
  Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface MainContentProps {
  activeSection: string;
}

export const MainContent: React.FC<MainContentProps> = ({ activeSection }) => {
  const [secureFileAccess, setSecureFileAccess] = useState(false);
  const [secureCode, setSecureCode] = useState('');
  const [isSecureFileModalOpen, setIsSecureFileModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'conversations' | 'groups' | 'secure-files'>('conversations');

  // Mock data
  const conversations = [
    { id: 1, name: 'Alice Johnson', lastMessage: 'Hey, how are you?', time: '2m ago', unread: 2 },
    { id: 2, name: 'Bob Smith', lastMessage: 'Can we meet tomorrow?', time: '1h ago', unread: 0 },
    { id: 3, name: 'Carol Wilson', lastMessage: 'Thanks for the help!', time: '3h ago', unread: 1 },
  ];

  const groupChats = [
    { id: 1, name: 'Team Alpha', lastMessage: 'Meeting at 3 PM', time: '30m ago', unread: 5, members: 8 },
    { id: 2, name: 'Project Delta', lastMessage: 'Updated the docs', time: '2h ago', unread: 0, members: 12 },
  ];

  const secureFiles = [
    { id: 1, name: 'Contract_2024.pdf', size: '2.4 MB', uploadedAt: '2 days ago', type: 'pdf' },
    { id: 2, name: 'Financial_Report.xlsx', size: '1.8 MB', uploadedAt: '1 week ago', type: 'xlsx' },
    { id: 3, name: 'Secret_Notes.txt', size: '12 KB', uploadedAt: '3 days ago', type: 'txt' },
  ];

  const handleSecureFileAccess = () => {
    // In a real implementation, this would verify against the user's stored 4-digit code
    if (secureCode === '1234') { // Mock verification
      setSecureFileAccess(true);
      setIsSecureFileModalOpen(false);
      setSecureCode('');
    } else {
      alert('Invalid security code. Please try again.');
    }
  };

  const openSecureFiles = () => {
    if (!secureFileAccess) {
      setIsSecureFileModalOpen(true);
    }
    setSelectedTab('secure-files');
  };

  if (activeSection !== 'messages') {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            {activeSection === 'calls' ? 'Secure Calls' : 'Settings'}
          </h2>
          <p className="text-white/70">
            {activeSection === 'calls' 
              ? 'End-to-end encrypted voice and video calls coming soon'
              : 'Configure your security settings and preferences'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-background">
      {/* Left Panel - Message Categories */}
      <div className="w-80 bg-card/80 backdrop-blur-xl border-r border-border flex flex-col">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-border">
          <div className="flex space-x-1 bg-muted/20 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('conversations')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'conversations'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chats</span>
            </button>
            <button
              onClick={() => setSelectedTab('groups')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'groups'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Groups</span>
            </button>
            <button
              onClick={openSecureFiles}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'secure-files'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Secure Files</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-4">
          {selectedTab === 'conversations' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Conversations</h3>
                <Button size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {conversations.map((conv) => (
                <Card key={conv.id} className="bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-medium">
                        {conv.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-foreground font-medium truncate">{conv.name}</h4>
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs">{conv.unread}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedTab === 'groups' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Group Chats</h3>
                <Button size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {groupChats.map((group) => (
                <Card key={group.id} className="bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-foreground font-medium truncate">{group.name}</h4>
                          <span className="text-xs text-muted-foreground">{group.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">{group.lastMessage}</p>
                          <span className="text-xs text-muted-foreground">{group.members} members</span>
                        </div>
                      </div>
                      {group.unread > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs">{group.unread}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedTab === 'secure-files' && secureFileAccess && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Secure Files</h3>
                <Button size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {secureFiles.map((file) => (
                <Card key={file.id} className="bg-card/50 border-border hover:bg-card/80 cursor-pointer transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-medium truncate">{file.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{file.size}</span>
                          <span className="text-xs text-muted-foreground">{file.uploadedAt}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedTab === 'secure-files' && !secureFileAccess && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-foreground font-semibold mb-2">Secure Files Locked</h3>
                <p className="text-muted-foreground text-sm mb-4">Enter your 4-digit security code to access encrypted files</p>
                <Button 
                  onClick={() => setIsSecureFileModalOpen(true)}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                >
                  Unlock Files
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-foreground">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground">Choose a conversation to start secure messaging</p>
        </div>
      </div>

      {/* Secure File Access Modal */}
      <Dialog open={isSecureFileModalOpen} onOpenChange={setIsSecureFileModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Secure File Access</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secure-code" className="text-foreground">
                Enter your 4-digit security code
              </Label>
              <Input
                id="secure-code"
                type="password"
                value={secureCode}
                onChange={(e) => setSecureCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50 text-center text-lg tracking-widest"
                placeholder="••••"
                maxLength={4}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setIsSecureFileModalOpen(false)}
                variant="outline" 
                className="flex-1 bg-transparent border-border text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSecureFileAccess}
                className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary"
                disabled={secureCode.length !== 4}
              >
                Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};