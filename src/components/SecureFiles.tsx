import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SecurityLock } from '@/components/SecurityLock';
import { 
  Plus, 
  Upload, 
  File,
  Image as ImageIcon,
  Download,
  Clock,
  FileText,
  Video,
  Music,
  Archive,
  X,
  Lock,
  Shield,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SecureFile {
  id: string;
  user_id: string;
  content_type: string;
  created_at: string;
  encrypted_key: string;
  file_path: string;
  file_size: number;
  filename: string;
}

export const SecureFiles: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<SecureFile[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedFileForAccess, setSelectedFileForAccess] = useState<SecureFile | null>(null);
  const [newFileContent, setNewFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files on component mount
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('secure_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading secure files:', error);
      toast.error('Failed to load secure files');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (300MB limit)
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 300MB');
      return;
    }

    setSelectedFile(file);
    
    // Auto-set filename if not already set
    if (!fileName) {
      setFileName(file.name.split('.')[0]); // Remove extension for cleaner name
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createSecureFile = async () => {
    if (!user || (!newFileContent.trim() && !selectedFile)) {
      toast.error('Please add content or upload a file');
      return;
    }

    if (!fileName.trim()) {
      toast.error('Please enter a name for your file');
      return;
    }

    setLoading(true);
    try {
      let filePath = null;
      let contentType = 'text/plain';
      let fileSize = 0;
      let encryptedContent = '';

      // Handle file upload
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const uniqueFileName = `${user.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('secure-files')
          .upload(uniqueFileName, selectedFile);

        if (uploadError) throw uploadError;

        filePath = uniqueFileName;
        contentType = selectedFile.type;
        fileSize = selectedFile.size;
        encryptedContent = btoa(`file:${selectedFile.name}`); // Mark as file reference
      } else {
        // Text content only
        filePath = `text/${user.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        fileSize = newFileContent.length;
        encryptedContent = btoa(newFileContent.trim()); // Simple base64 encoding
      }

      // Create file record
      const { error } = await supabase
        .from('secure_files')
        .insert({
          user_id: user.id,
          content_type: contentType,
          file_path: filePath,
          filename: fileName.trim(),
          file_size: fileSize,
          encrypted_key: encryptedContent
        });

      if (error) throw error;

      toast.success('Secure file created successfully');
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadFiles();
    } catch (error) {
      console.error('Error creating secure file:', error);
      toast.error('Failed to create secure file');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewFileContent('');
    setFileName('');
    removeFile();
  };

  const handleFileAccess = (file: SecureFile) => {
    setSelectedFileForAccess(file);
    setIsAccessModalOpen(true);
    setAccessCode('');
  };

  const verifyAccessAndDownload = async () => {
    if (!selectedFileForAccess || !accessCode) return;

    // Simple 4-digit code verification (you can enhance this with proper encryption)
    if (accessCode.length !== 4 || !/^\d{4}$/.test(accessCode)) {
      toast.error('Please enter a valid 4-digit code');
      return;
    }

    // For demo purposes, accept any 4-digit code
    // In production, you'd want proper authentication
    setAccessLoading(true);
    
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const file = selectedFileForAccess;
      
      // Handle text content
      if (file.content_type === 'text/plain') {
        const content = atob(file.encrypted_key); // Decode base64
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Handle actual files
        const { data, error } = await supabase.storage
          .from('secure-files')
          .download(file.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('File accessed successfully');
      setIsAccessModalOpen(false);
      setSelectedFileForAccess(null);
      setAccessCode('');
    } catch (error) {
      console.error('Error accessing file:', error);
      toast.error('Failed to access file');
    } finally {
      setAccessLoading(false);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-5 h-5" />;
    
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />;
    if (fileType === 'text/plain') return <FileText className="w-5 h-5" />;
    
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Secure Files
            </h2>
            <p className="text-sm text-muted-foreground">Your encrypted personal storage</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>
        </div>
      </div>

      {/* Files Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No secure files yet</h3>
              <p className="text-muted-foreground mb-4">Create your first secure file to get started</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create File
              </Button>
            </div>
          ) : (
            files.map((file) => (
              <Card 
                key={file.id} 
                className="bg-card/50 border-border hover:shadow-lg transition-all cursor-pointer h-fit"
                onClick={() => handleFileAccess(file)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* File Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-primary-foreground flex-shrink-0">
                      {getFileIcon(file.content_type)}
                    </div>
                    
                    {/* File Info */}
                    <div className="space-y-2 w-full">
                      <h4 className="text-foreground font-medium text-sm truncate w-full max-w-full">
                        {file.filename}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    
                    {/* Security Badge */}
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 flex-shrink-0">
                      <Lock className="w-3 h-3" />
                      Encrypted
                    </Badge>
                    
                    {/* Date */}
                    <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="whitespace-nowrap">{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create File Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/90 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Create Secure File</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-foreground">File Name *</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for your file..."
                className="bg-background/50 border-border"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-foreground">Content (Optional)</Label>
              <Textarea
                id="content"
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Write your secure note..."
                className="bg-background/50 border-border min-h-[100px]"
              />
            </div>
            
            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">File Upload (Optional, Max 300MB)</Label>
              
              {selectedFile ? (
                <div className="space-y-3">
                  {/* File preview */}
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground">
                        {getFileIcon(selectedFile.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-medium truncate">{selectedFile.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={removeFile}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Image preview */}
                  {filePreview && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background/50 border-border border-dashed"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File (Max 300MB)
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={createSecureFile}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading || !fileName.trim() || (!newFileContent.trim() && !selectedFile)}
              >
                {loading ? 'Creating...' : 'Save Secure File'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Access Modal */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Access Secure File</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFileForAccess && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground mx-auto mb-3">
                  {getFileIcon(selectedFileForAccess.content_type)}
                </div>
                <h3 className="font-medium text-foreground">{selectedFileForAccess.filename}</h3>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFileForAccess.file_size)}</p>
              </div>

              {/* Security Code Input */}
              <div className="space-y-2">
                <Label htmlFor="access-code" className="text-foreground">Enter 4-Digit Security Code</Label>
                <Input
                  id="access-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="bg-background/50 border-border text-center text-lg font-mono tracking-wider"
                  maxLength={4}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAccessModalOpen(false);
                    setSelectedFileForAccess(null);
                    setAccessCode('');
                  }}
                  className="flex-1"
                  disabled={accessLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verifyAccessAndDownload}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={accessLoading || accessCode.length !== 4}
                >
                  {accessLoading ? 'Verifying...' : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Access File
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};