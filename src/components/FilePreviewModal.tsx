import { useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export const FilePreviewModal = ({
  open,
  onClose,
  fileUrl,
  fileName,
  fileType,
  fileSize
}: FilePreviewModalProps) => {
  const [zoom, setZoom] = useState(100);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');
  const isPDF = fileType === 'application/pdf';
  const isText = fileType.startsWith('text/') || 
                 fileType === 'application/json' ||
                 fileType === 'application/javascript';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{fileName}</h3>
            {fileSize && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(fileSize)}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(fileUrl, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 flex items-center justify-center min-h-full">
            {isImage && (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full h-auto object-contain"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            )}

            {isVideo && (
              <video
                src={fileUrl}
                controls
                className="max-w-full h-auto"
                style={{ maxHeight: 'calc(90vh - 100px)' }}
              >
                Your browser does not support video playback.
              </video>
            )}

            {isAudio && (
              <div className="w-full max-w-md">
                <audio
                  src={fileUrl}
                  controls
                  className="w-full"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {isPDF && (
              <iframe
                src={fileUrl}
                className="w-full h-full min-h-[70vh] border-0"
                title={fileName}
              />
            )}

            {isText && (
              <div className="w-full max-w-4xl">
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[70vh] border rounded-lg"
                  title={fileName}
                />
              </div>
            )}

            {!isImage && !isVideo && !isAudio && !isPDF && !isText && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
