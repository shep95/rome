import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  Archive,
  Eye,
  Download,
  Shield,
  Clock
} from 'lucide-react';
import { SecureFileExtended } from '@/hooks/useSecureFileOperations';
import { format } from 'date-fns';

interface SecureFileCardProps {
  file: SecureFileExtended;
  isSelected: boolean;
  onSelect: (fileId: string, multiSelect: boolean) => void;
  onOpen: (file: SecureFileExtended) => void;
  onContextMenu: (e: React.MouseEvent, file: SecureFileExtended) => void;
}

export const SecureFileCard: React.FC<SecureFileCardProps> = ({
  file,
  isSelected,
  onSelect,
  onOpen,
  onContextMenu
}) => {
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (contentType.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (contentType.startsWith('audio/')) return <Music className="w-8 h-8" />;
    if (contentType.includes('zip') || contentType.includes('rar')) return <Archive className="w-8 h-8" />;
    if (contentType === 'text/plain') return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Card
      className={`group relative p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${
        isSelected 
          ? 'ring-2 ring-primary shadow-lg scale-105' 
          : 'hover:ring-1 hover:ring-border'
      } backdrop-blur-sm bg-gradient-to-br from-card/80 to-card/50`}
      onClick={(e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          onSelect(file.id, true);
        } else {
          onOpen(file);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-scale-in">
          <Shield className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* File Icon */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
          {getFileIcon(file.content_type)}
        </div>

        {/* File Name */}
        <div className="w-full text-center">
          <h3 className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
            {file.filename}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(file.file_size)}
          </p>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center w-full">
            {file.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2 py-0"
                style={{ backgroundColor: `${tag.tag_color}20`, color: tag.tag_color }}
              >
                {tag.tag_name}
              </Badge>
            ))}
            {file.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{file.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Analytics Footer */}
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Views">
              <Eye className="w-3 h-3" />
              <span>{file.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1" title="Downloads">
              <Download className="w-3 h-3" />
              <span>{file.download_count || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-1" title={`Created: ${format(new Date(file.created_at), 'PPp')}`}>
            <Clock className="w-3 h-3" />
            <span>{format(new Date(file.created_at), 'MMM d')}</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
    </Card>
  );
};
