import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  FolderInput, 
  Download, 
  Tag, 
  X, 
  Share2 
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onBulkDownload: () => void;
  onBulkTag: () => void;
  onBulkShare: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  onBulkDownload,
  onBulkTag,
  onBulkShare
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right">
      <div className="backdrop-blur-xl bg-card/95 border border-border/50 rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
        <Badge variant="secondary" className="rounded-full px-3">
          {selectedCount} selected
        </Badge>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 px-3"
            onClick={onBulkDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 px-3"
            onClick={onBulkMove}
          >
            <FolderInput className="w-4 h-4 mr-2" />
            Move
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 px-3"
            onClick={onBulkTag}
          >
            <Tag className="w-4 h-4 mr-2" />
            Tag
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 px-3"
            onClick={onBulkShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          <div className="w-px h-6 bg-border/50" />

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onBulkDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <div className="w-px h-6 bg-border/50" />

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-9 w-9 p-0"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
