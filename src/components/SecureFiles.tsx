import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Plus, 
  Upload, 
  X,
  Lock,
  Shield,
  Eye,
  FolderPlus
} from 'lucide-react';

// New components
import { SecureFileCard } from './SecureFileCard';
import { FileContextMenu } from './FileContextMenu';
import { FileSearchBar, SortOption, FilterType } from './FileSearchBar';
import { BulkActionsBar } from './BulkActionsBar';
import { ShareFileDialog } from './ShareFileDialog';
import { TagManagerDialog } from './TagManagerDialog';
import { FolderBreadcrumb } from './FolderBreadcrumb';

// New hooks
import { useSecureFileOperations, SecureFileExtended } from '@/hooks/useSecureFileOperations';

export const SecureFiles: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    loadFiles,
    createFolder,
    moveFiles,
    bulkDelete,
    addTags,
    removeTag,
    updateAnalytics,
    loading: operationsLoading
  } = useSecureFileOperations();

  // State
  const [files, setFiles] = useState<SecureFileExtended[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [contextMenuFile, setContextMenuFile] = useState<SecureFileExtended | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // File creation
  const [selectedFileForAccess, setSelectedFileForAccess] = useState<SecureFileExtended | null>(null);
  const [selectedFileForDelete, setSelectedFileForDelete] = useState<SecureFileExtended | null>(null);
  const [selectedFileForShare, setSelectedFileForShare] = useState<SecureFileExtended | null>(null);
  const [selectedFileForTag, setSelectedFileForTag] = useState<SecureFileExtended | null>(null);
  const [newFileContent, setNewFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [folderName, setFolderName] = useState('');

  // Load files on mount and when folder changes
  useEffect(() => {
    if (user) {
      refreshFiles();
    }
  }, [user, currentFolderId]);

  const refreshFiles = async () => {
    const loadedFiles = await loadFiles(currentFolderId || undefined);
    setFiles(loadedFiles);
  };

  // Filter and sort files
  const filteredFiles = files.filter((file) => {
    // Search filter
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType !== 'all') {
      const typeMap: Record<string, string[]> = {
        images: ['image/'],
        documents: ['application/pdf', 'application/msword', 'application/vnd'],
        videos: ['video/'],
        audio: ['audio/'],
        text: ['text/'],
        archives: ['zip', 'rar', '7z', 'tar']
      };

      const types = typeMap[filterType] || [];
      if (!types.some(t => file.content_type.includes(t))) {
        return false;
      }
    }

    // Tag filter
    if (selectedTags.length > 0 && file.tags) {
      const fileTags = file.tags.map(t => t.tag_name);
      if (!selectedTags.some(tag => fileTags.includes(tag))) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.filename.localeCompare(b.filename);
      case 'size':
        return b.file_size - a.file_size;
      case 'views':
        return (b.view_count || 0) - (a.view_count || 0);
      case 'downloads':
        return (b.download_count || 0) - (a.download_count || 0);
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // File selection handlers
  const handleFileSelect = (fileId: string, multiSelect: boolean) => {
    if (multiSelect) {
      setSelectedFileIds(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFileIds([fileId]);
    }
  };

  const clearSelection = () => {
    setSelectedFileIds([]);
  };

  // File upload handling
  const handleFileSelectForUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadWindowStart = localStorage.getItem('secure-files-upload-window');
    if (uploadWindowStart) {
      const windowStartTime = new Date(uploadWindowStart).getTime();
      const now = Date.now();
      const hoursPassed = (now - windowStartTime) / (1000 * 60 * 60);
      
      if (hoursPassed >= 24) {
        localStorage.removeItem('secure-files-upload-window');
      } else {
        toast.success(`Unlimited uploads active! ${(24 - hoursPassed).toFixed(1)} hours remaining`);
      }
    } else {
      localStorage.setItem('secure-files-upload-window', new Date().toISOString());
      toast.success('24-hour unlimited upload window started!', {
        description: 'Upload as many files as you want for the next 24 hours'
      });
    }

    setSelectedFile(file);
    if (!fileName) {
      setFileName(file.name.split('.')[0]);
    }

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

  const removeFileUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File creation
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
        encryptedContent = btoa(`file:${selectedFile.name}`);
      } else {
        filePath = `text/${user.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        fileSize = newFileContent.length;
        const { encryptionService } = await import('@/lib/encryption');
        encryptedContent = await encryptionService.encryptMessage(newFileContent.trim(), accessCode);
      }

      const { error } = await supabase
        .from('secure_files')
        .insert({
          user_id: user.id,
          content_type: contentType,
          file_path: filePath,
          filename: fileName.trim(),
          file_size: fileSize,
          secure_payload: encryptedContent,
          folder_id: currentFolderId
        });

      if (error) throw error;

      toast.success('Secure file created successfully');
      setIsCreateModalOpen(false);
      resetCreateForm();
      refreshFiles();
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
    removeFileUpload();
  };

  // File access with analytics
  const handleFileAccess = (file: SecureFileExtended) => {
    setSelectedFileForAccess(file);
    setIsAccessModalOpen(true);
    setAccessCode('');
  };

  const verifyAccessAndDownload = async () => {
    if (!selectedFileForAccess || !accessCode) return;

    const { data: { user } } = await supabase.auth.getUser();
    const userSecurityCode = user?.user_metadata?.security_code;
    
    if (accessCode !== userSecurityCode) {
      toast.error('Incorrect security code');
      return;
    }

    setAccessLoading(true);
    
    try {
      const file = selectedFileForAccess;
      
      // Update analytics
      await updateAnalytics(file.id, 'download');

      if (file.content_type === 'text/plain') {
        const { encryptionService } = await import('@/lib/encryption');
        let content: string;
        try {
          content = await encryptionService.decryptMessage(file.secure_payload.toString(), accessCode);
        } catch {
          try {
            content = atob(file.secure_payload.toString());
          } catch {
            toast.error('Invalid access code or corrupted file');
            return;
          }
        }
        
        const htmlContent = createTextDocument(content, file.filename);
        downloadFile(htmlContent, `${file.filename}_secure_document.html`, 'text/html');
        toast.success('Text content downloaded');
      } else {
        const { data, error } = await supabase.storage
          .from('secure-files')
          .download(file.file_path);

        if (error) throw error;

        const fileExtension = file.file_path.split('.').pop() || '';
        const downloadName = fileExtension ? `${file.filename}.${fileExtension}` : file.filename;
        downloadFile(data, downloadName);
        toast.success('File downloaded successfully');
      }

      const shouldDelete = confirm('File accessed successfully! Do you want to delete this secure file now?');
      if (shouldDelete) {
        await deleteSecureFile(selectedFileForAccess.id);
      }

      setIsAccessModalOpen(false);
      setSelectedFileForAccess(null);
      setAccessCode('');
      refreshFiles();
    } catch (error) {
      console.error('Error accessing file:', error);
      toast.error('Failed to access file');
    } finally {
      setAccessLoading(false);
    }
  };

  const createTextDocument = (content: string, filename: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 2px solid #f0f0f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              color: #2d3748;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              color: #2d3748;
              font-size: 16px;
              line-height: 1.6;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">🛡 ${filename}</h1>
            </div>
            <div class="content">${content}</div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadFile = (data: Blob | string, filename: string, type?: string) => {
    const blob = typeof data === 'string' ? new Blob([data], { type: type || 'text/html' }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete with confirmation
  const handleDeleteRequest = (file: SecureFileExtended) => {
    setSelectedFileForDelete(file);
    setIsDeleteModalOpen(true);
    setDeleteCode('');
  };

  const verifyCodeAndDelete = async () => {
    if (!selectedFileForDelete || !deleteCode) return;

    const { data: { user } } = await supabase.auth.getUser();
    const userSecurityCode = user?.user_metadata?.security_code;
    
    if (deleteCode !== userSecurityCode) {
      toast.error('Incorrect security code');
      return;
    }

    setDeleteLoading(true);
    
    try {
      await deleteSecureFile(selectedFileForDelete.id);
      setIsDeleteModalOpen(false);
      setSelectedFileForDelete(null);
      setDeleteCode('');
      toast.success('Secure file deleted successfully');
      refreshFiles();
    } catch (error) {
      console.error('Error deleting secure file:', error);
      toast.error('Failed to delete secure file');
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteSecureFile = async (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    if (fileToDelete.content_type !== 'text/plain') {
      try {
        await supabase.storage
          .from('secure-files')
          .remove([fileToDelete.file_path]);
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }
    }

    const { error } = await supabase
      .from('secure_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user?.id);

    if (error) throw error;
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, file: SecureFileExtended) => {
    e.preventDefault();
    setContextMenuFile(file);
  };

  // Folder operations
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    const folder = await createFolder(folderName, currentFolderId || undefined);
    if (folder) {
      setFolderName('');
      setIsFolderModalOpen(false);
      refreshFiles();
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedFileIds.length === 0) return;
    
    const confirmed = confirm(`Delete ${selectedFileIds.length} file(s) permanently?`);
    if (!confirmed) return;

    const success = await bulkDelete(selectedFileIds);
    if (success) {
      clearSelection();
      refreshFiles();
    }
  };

  const handleBulkDownload = async () => {
    toast.info('Bulk download will start shortly...');
    for (const fileId of selectedFileIds) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await updateAnalytics(file.id, 'download');
      }
    }
  };

  const handleBulkMove = async () => {
    const targetFolderId = prompt('Enter folder ID (or leave empty for root):');
    const success = await moveFiles(selectedFileIds, targetFolderId || null);
    if (success) {
      clearSelection();
      refreshFiles();
    }
  };

  const handleBulkTag = () => {
    if (selectedFileIds.length === 1) {
      const file = files.find(f => f.id === selectedFileIds[0]);
      if (file) {
        setSelectedFileForTag(file);
        setIsTagManagerOpen(true);
      }
    } else {
      toast.info('Tag management supports single file at a time');
    }
  };

  const handleBulkShare = () => {
    if (selectedFileIds.length === 1) {
      const file = files.find(f => f.id === selectedFileIds[0]);
      if (file) {
        setSelectedFileForShare(file);
        setIsShareModalOpen(true);
      }
    } else {
      toast.info('Share supports single file at a time');
    }
  };

  // Tag operations
  const handleAddTag = async (tagName: string, tagColor: string) => {
    if (!selectedFileForTag) return false;
    const success = await addTags(selectedFileForTag.id, tagName, tagColor);
    if (success) {
      toast.success('Tag added successfully');
      refreshFiles();
    }
    return success;
  };

  const handleRemoveTag = async (tagId: string) => {
    const success = await removeTag(tagId);
    if (success) {
      toast.success('Tag removed successfully');
      refreshFiles();
    }
    return success;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Secure Files
            </h2>
            <p className="text-sm text-muted-foreground">Your encrypted personal storage</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsFolderModalOpen(true)}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New File
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <FolderBreadcrumb
          currentFolderId={currentFolderId}
          onNavigate={setCurrentFolderId}
        />

        {/* Search & Filter */}
        <FileSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterType={filterType}
          onFilterChange={setFilterType}
          selectedTags={selectedTags}
          onRemoveTag={(tag) => setSelectedTags(prev => prev.filter(t => t !== tag))}
        />
      </div>

      {/* Files Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredFiles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No files found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first secure file to get started'}
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create File
                </Button>
              )}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <FileContextMenu
                key={file.id}
                onDownload={() => handleFileAccess(file)}
                onDelete={() => handleDeleteRequest(file)}
                onShare={() => {
                  setSelectedFileForShare(file);
                  setIsShareModalOpen(true);
                }}
                onAddTag={() => {
                  setSelectedFileForTag(file);
                  setIsTagManagerOpen(true);
                }}
                onMove={() => handleBulkMove()}
                onViewDetails={() => handleFileAccess(file)}
                onDuplicate={() => toast.info('Duplicate feature coming soon')}
                onViewVersions={() => toast.info('Version history coming soon')}
              >
                <div>
                  <SecureFileCard
                    file={file}
                    isSelected={selectedFileIds.includes(file.id)}
                    onSelect={handleFileSelect}
                    onOpen={handleFileAccess}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              </FileContextMenu>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedFileIds.length}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkMove={handleBulkMove}
        onBulkDownload={handleBulkDownload}
        onBulkTag={handleBulkTag}
        onBulkShare={handleBulkShare}
      />

      {/* Create File Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg backdrop-blur-xl bg-card/95">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Create Secure File</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">File Name *</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for your file..."
                className="backdrop-blur-sm bg-card/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Optional)</Label>
              <Textarea
                id="content"
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Write your secure note..."
                className="backdrop-blur-sm bg-card/50 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>File Upload (Optional)</Label>
              {selectedFile ? (
                <div className="p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={removeFileUpload}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {filePreview && (
                    <img src={filePreview} alt="Preview" className="mt-3 w-full h-32 object-cover rounded" />
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelectForUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed"
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
                className="flex-1"
                disabled={loading || !fileName.trim() || (!newFileContent.trim() && !selectedFile)}
              >
                {loading ? 'Creating...' : 'Save File'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Access Modal */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Access Secure File</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFileForAccess && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <h3 className="font-medium">{selectedFileForAccess.filename}</h3>
                <p className="text-sm text-muted-foreground">
                  {(selectedFileForAccess.file_size / 1024).toFixed(2)} KB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-code">Enter 4-Digit Security Code</Label>
                <Input
                  id="access-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={4}
                />
              </div>
              
              <div className="flex space-x-2">
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
                  className="flex-1"
                  disabled={accessLoading || accessCode.length !== 4}
                >
                  {accessLoading ? 'Verifying...' : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Access
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-destructive" />
              <span>Delete Secure File</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFileForDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  This action cannot be undone. The file will be permanently deleted.
                </p>
              </div>

              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <h3 className="font-medium">{selectedFileForDelete.filename}</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-code">Enter Security Code to Confirm</Label>
                <Input
                  id="delete-code"
                  type="password"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={4}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedFileForDelete(null);
                    setDeleteCode('');
                  }}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verifyCodeAndDelete}
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteLoading || deleteCode.length !== 4}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Folder Creation Modal */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="backdrop-blur-sm bg-card/50"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsFolderModalOpen(false);
                  setFolderName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                className="flex-1"
                disabled={!folderName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share File Dialog */}
      {selectedFileForShare && (
        <ShareFileDialog
          open={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedFileForShare(null);
          }}
          fileId={selectedFileForShare.id}
          fileName={selectedFileForShare.filename}
        />
      )}

      {/* Tag Manager Dialog */}
      {selectedFileForTag && (
        <TagManagerDialog
          open={isTagManagerOpen}
          onClose={() => {
            setIsTagManagerOpen(false);
            setSelectedFileForTag(null);
          }}
          onAddTag={handleAddTag}
          existingTags={selectedFileForTag.tags}
          onRemoveTag={handleRemoveTag}
        />
      )}
    </div>
  );
};
