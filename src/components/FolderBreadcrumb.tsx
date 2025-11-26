import React, { useEffect, useState } from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FolderItem {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

interface FolderBreadcrumbProps {
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
}

export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  currentFolderId,
  onNavigate
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);

  useEffect(() => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    const loadBreadcrumbs = async () => {
      const path: FolderItem[] = [];
      let folderId: string | null = currentFolderId;

      while (folderId) {
        const { data } = await supabase
          .from('file_folders')
          .select('id, name, parent_folder_id')
          .eq('id', folderId)
          .single();

        if (data) {
          path.unshift(data);
          folderId = data.parent_folder_id;
        } else {
          break;
        }
      }

      setBreadcrumbs(path);
    };

    loadBreadcrumbs();
  }, [currentFolderId]);

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-8 px-2 hover:bg-primary/10"
      >
        <Home className="w-4 h-4" />
      </Button>

      {breadcrumbs.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className="h-8 px-2 hover:bg-primary/10 shrink-0"
          >
            <Folder className="w-4 h-4 mr-1" />
            {folder.name}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
};
