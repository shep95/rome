import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName,
  fileSize
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || 'media-file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black/95 border-0">
        <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex flex-row items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <DialogTitle className="text-white text-sm truncate flex-1 mr-4">
            {fileName || 'Media File'}
            {fileSize && (
              <span className="text-white/70 text-xs ml-2">
                ({formatFileSize(fileSize)})
              </span>
            )}
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex items-center justify-center min-h-[50vh] max-h-[95vh] w-full overflow-auto">
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
              autoPlay={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};