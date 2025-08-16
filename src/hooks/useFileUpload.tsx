import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload files"
      });
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Store in localStorage for immediate use
      localStorage.setItem('rome-profile-image', publicUrl);

      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadWallpaper = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload files"
      });
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/wallpaper_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(fileName);

      // Update profile with new wallpaper URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallpaper_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Store in localStorage for immediate use
      localStorage.setItem('rome-background-image', publicUrl);

      toast({
        title: "Success",
        description: "Wallpaper updated successfully"
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Wallpaper upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file: File, bucketName: string = 'secure-files', options?: { silent?: boolean }): Promise<string | null> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload files"
      });
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store encrypted metadata in secure_files table if using secure-files bucket
      if (bucketName === 'secure-files') {
        const { encryptionService } = await import('@/lib/encryption');
        const fileMetadata = {
          filename: file.name,
          file_path: fileName,
          content_type: file.type
        };
        const encryptedMetadata = await encryptionService.encryptMessage(JSON.stringify(fileMetadata), user.id);
        
        await supabase
          .from('secure_files')
          .insert({
            user_id: user.id,
            filename: 'encrypted', // Hide real filename
            file_path: 'encrypted', // Hide real path
            content_type: 'application/octet-stream', // Hide real content type
            file_size: file.size,
            encrypted_file_metadata: encryptedMetadata,
            secure_payload: JSON.stringify(Array.from(new TextEncoder().encode('placeholder'))) // Placeholder for compatibility
          });
      }

      // Prefer a signed URL so recipients can view without extra permissions
      const { data: signedData, error: signError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (signError) {
        console.warn('Signed URL generation failed, falling back to public URL', signError);
      }

      const fallbackPublic = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName).data.publicUrl;

      const url = signedData?.signedUrl || fallbackPublic;

      if (!options?.silent) {
        toast({
          title: "Success",
          description: "File uploaded successfully"
        });
      }

      return url;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadAvatar,
    uploadWallpaper,
    isUploading
  };
};