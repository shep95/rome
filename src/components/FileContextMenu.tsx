import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Download, 
  Trash2, 
  Share2, 
  Tag, 
  FolderInput,
  Eye,
  Copy,
  History
} from 'lucide-react';

interface FileContextMenuProps {
  children: React.ReactNode;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
  onAddTag: () => void;
  onMove: () => void;
  onViewDetails: () => void;
  onDuplicate: () => void;
  onViewVersions: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  children,
  onDownload,
  onDelete,
  onShare,
  onAddTag,
  onMove,
  onViewDetails,
  onDuplicate,
  onViewVersions
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 backdrop-blur-md bg-card/95 border-border/50">
        <ContextMenuItem onClick={onViewDetails} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={onDownload} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Download
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onShare} className="cursor-pointer">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
        <ContextMenuItem onClick={onMove} className="cursor-pointer">
          <FolderInput className="mr-2 h-4 w-4" />
          Move to Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddTag} className="cursor-pointer">
          <Tag className="mr-2 h-4 w-4" />
          Add Tag
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onViewVersions} className="cursor-pointer">
          <History className="mr-2 h-4 w-4" />
          Version History
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
