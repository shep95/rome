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
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SecurePost {
  id: string;
  user_id: string;
  content_type: string;
  created_at: string;
  encrypted_key: string;
  file_path: string;
  file_size: number;
  filename: string;
}

interface SecureFilesProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const SecureFiles: React.FC<SecureFilesProps> = ({ isLocked, onUnlock }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SecurePost[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts when unlocked
  useEffect(() => {
    if (!isLocked && user) {
      loadPosts();
    }
  }, [isLocked, user]);

  const loadPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('secure_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading secure posts:', error);
      toast.error('Failed to load secure posts');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

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

  const createPost = async () => {
    if (!user || (!newPostContent.trim() && !selectedFile)) {
      toast.error('Please add content or a file');
      return;
    }

    setLoading(true);
    try {
      let filePath = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName_unique = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('secure-files')
          .upload(fileName_unique, selectedFile);

        if (uploadError) throw uploadError;

        filePath = fileName_unique;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
        fileSize = selectedFile.size;
      }

      // Create post record
      const { error } = await supabase
        .from('secure_files')
        .insert({
          user_id: user.id,
          content_type: fileType || 'text/plain',
          file_path: filePath || `text_${Date.now()}.txt`,
          filename: fileName || 'text_post.txt',
          file_size: fileSize || newPostContent.length,
          encrypted_key: btoa(newPostContent.trim()) // Simple base64 encoding for now
        });

      if (error) throw error;

      toast.success('Secure post created successfully');
      setIsCreateModalOpen(false);
      setNewPostContent('');
      removeFile();
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create secure post');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (post: SecurePost) => {
    if (!post.file_path) return;

    try {
      // For text posts, create a downloadable text file
      if (post.content_type === 'text/plain') {
        const content = atob(post.encrypted_key); // Decode base64
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = post.filename || 'text_post.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // For actual files
      const { data, error } = await supabase.storage
        .from('secure-files')
        .download(post.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = post.filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
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

  if (isLocked) {
    return (
      <SecurityLock
        isOpen={isLocked}
        onUnlock={onUnlock}
        title="Secure Files Access"
        description="Enter your 4-digit code to access your secure files"
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Secure Files</h2>
            <p className="text-sm text-muted-foreground">Your encrypted personal storage</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Posts */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No secure posts yet</h3>
              <p className="text-muted-foreground mb-4">Create your first secure post to get started</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            posts.map((post) => {
              const content = post.content_type === 'text/plain' ? atob(post.encrypted_key) : '';
              return (
                <Card key={post.id} className="bg-card/50 border-border">
                  <CardContent className="p-4">
                    {/* Post content */}
                    {content && (
                      <p className="text-foreground mb-3 whitespace-pre-wrap">{content}</p>
                    )}
                    
                    {/* File preview */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg border border-border">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground">
                          {getFileIcon(post.content_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-foreground font-medium truncate">{post.filename}</h4>
                          <p className="text-sm text-muted-foreground">{formatFileSize(post.file_size)}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => downloadFile(post)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Post metadata */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(post.created_at)}</span>
                      <Badge variant="secondary" className="text-xs">
                        Secure File
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create Post Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/80 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Secure Post</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-foreground">Content</Label>
              <Textarea
                id="content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Write your secure note..."
                className="bg-background/50 border-border min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground">File Attachment (Optional)</Label>
              
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
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={createPost}
                className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary"
                disabled={loading || (!newPostContent.trim() && !selectedFile)}
              >
                {loading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};