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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden border-0 sm:max-w-[90vw] sm:max-h-[90vh] bg-transparent">
        {/* Ambient glow background layer */}
        <div className="absolute inset-0 -z-10">
          {/* Blurred background image/video for ambient glow */}
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt=""
              className="w-full h-full object-cover opacity-30 blur-3xl scale-110"
            />
          ) : (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover opacity-30 blur-3xl scale-110"
              autoPlay={false}
              muted
            />
          )}
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          {/* Edge glow gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-transparent to-accent/20" />
        </div>

        <DialogHeader className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex flex-row items-center justify-between bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-2 sm:p-3 shadow-2xl">
          <DialogTitle className="text-white text-xs sm:text-sm md:text-base truncate flex-1 mr-2 sm:mr-4">
            {fileName || 'Media File'}
            {fileSize && (
              <span className="text-white/70 text-xs ml-1 sm:ml-2 block sm:inline">
                ({formatFileSize(fileSize)})
              </span>
            )}
          </DialogTitle>
          <div className="flex gap-1 sm:gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-6 w-6 sm:h-8 sm:w-8 p-0 transition-all duration-200 hover:scale-105"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-6 w-6 sm:h-8 sm:w-8 p-0 transition-all duration-200 hover:scale-105"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative flex items-center justify-center min-h-[40vh] sm:min-h-[50vh] max-h-[95vh] w-full overflow-auto p-2 sm:p-4">
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-full object-contain animate-scale-in shadow-2xl rounded-lg border border-white/10"
              style={{ maxHeight: '85vh', maxWidth: '90vw' }}
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              loop
              className="max-w-full max-h-full animate-scale-in shadow-2xl rounded-lg border border-white/10"
              style={{ maxHeight: '85vh', maxWidth: '90vw' }}
              autoPlay={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};