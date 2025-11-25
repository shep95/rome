import { FileText, FileImage, FileVideo, FileAudio, FileCode, File, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileThumbnailProps {
  contentType: string;
  fileName?: string;
  thumbnailUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FileThumbnail = ({
  contentType,
  fileName = '',
  thumbnailUrl,
  size = 'md',
  className
}: FileThumbnailProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  // If we have a thumbnail, show it
  if (thumbnailUrl) {
    return (
      <div className={cn("rounded-lg overflow-hidden bg-muted", sizeClasses[size], className)}>
        <img
          src={thumbnailUrl}
          alt={fileName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Otherwise show icon based on file type
  const getIcon = () => {
    const type = contentType.toLowerCase();
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) {
      return <FileImage className={iconSizes[size]} />;
    }
    if (type.startsWith('video/')) {
      return <FileVideo className={iconSizes[size]} />;
    }
    if (type.startsWith('audio/')) {
      return <FileAudio className={iconSizes[size]} />;
    }
    if (type === 'application/pdf' || type.startsWith('text/')) {
      return <FileText className={iconSizes[size]} />;
    }
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext || '')) {
      return <FileCode className={iconSizes[size]} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive className={iconSizes[size]} />;
    }
    
    return <File className={iconSizes[size]} />;
  };

  return (
    <div className={cn(
      "rounded-lg flex items-center justify-center bg-primary/10 text-primary",
      sizeClasses[size],
      className
    )}>
      {getIcon()}
    </div>
  );
};
