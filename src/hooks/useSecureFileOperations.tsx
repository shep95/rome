import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SecureFileExtended {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  content_type: string;
  file_size: number;
  created_at: string;
  secure_payload: string;
  folder_id?: string;
  view_count?: number;
  download_count?: number;
  last_accessed?: string;
  tags?: Array<{ id: string; tag_name: string; tag_color: string }>;
}

export const useSecureFileOperations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const loadFiles = async (folderId?: string) => {
    if (!user) return [];
    
    try {
      let query = supabase
        .from('secure_files')
        .select(`
          *,
          tags:file_tags(id, tag_name, tag_color)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading secure files:', error);
      toast.error('Failed to load secure files');
      return [];
    }
  };

  const createFolder = async (name: string, parentId?: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('file_folders')
        .insert({
          user_id: user.id,
          name,
          parent_folder_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Folder created successfully');
      return data;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(error.message || 'Failed to create folder');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const moveFiles = async (fileIds: string[], folderId: string | null) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('secure_files')
        .update({ folder_id: folderId })
        .in('id', fileIds)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(`Moved ${fileIds.length} file(s) successfully`);
      return true;
    } catch (error: any) {
      console.error('Error moving files:', error);
      toast.error(error.message || 'Failed to move files');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (fileIds: string[]) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Get file paths for storage deletion
      const { data: files } = await supabase
        .from('secure_files')
        .select('file_path, content_type')
        .in('id', fileIds)
        .eq('user_id', user.id);

      if (files) {
        // Delete from storage (skip text files)
        const filesToDelete = files
          .filter(f => f.content_type !== 'text/plain')
          .map(f => f.file_path);
        
        if (filesToDelete.length > 0) {
          await supabase.storage.from('secure-files').remove(filesToDelete);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('secure_files')
        .delete()
        .in('id', fileIds)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(`Deleted ${fileIds.length} file(s) successfully`);
      return true;
    } catch (error: any) {
      console.error('Error deleting files:', error);
      toast.error(error.message || 'Failed to delete files');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addTags = async (fileId: string, tagName: string, tagColor: string = '#3b82f6') => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('file_tags')
        .insert({
          file_id: fileId,
          user_id: user.id,
          tag_name: tagName,
          tag_color: tagColor
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast.error(error.message || 'Failed to add tag');
      return false;
    }
  };

  const removeTag = async (tagId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('file_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error removing tag:', error);
      toast.error(error.message || 'Failed to remove tag');
      return false;
    }
  };

  const updateAnalytics = async (fileId: string, type: 'view' | 'download') => {
    if (!user) return;
    
    try {
      // Get current count
      const { data: currentFile } = await supabase
        .from('secure_files')
        .select('view_count, download_count')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single();

      if (currentFile) {
        const field = type === 'view' ? 'view_count' : 'download_count';
        const currentCount = currentFile[field] || 0;
        
        // Update with incremented count
        await supabase
          .from('secure_files')
          .update({ 
            [field]: currentCount + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('id', fileId)
          .eq('user_id', user.id);
      }

      // Log access
      await supabase
        .from('file_access_logs')
        .insert({
          file_id: fileId,
          user_id: user.id,
          access_type: type
        });
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  };

  return {
    loadFiles,
    createFolder,
    moveFiles,
    bulkDelete,
    addTags,
    removeTag,
    updateAnalytics,
    loading
  };
};
