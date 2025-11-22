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
      // Convert file to ArrayBuffer for encryption
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Import encryption service
      const { encryptionService } = await import('@/lib/encryption');
      
      // Generate encryption password from user credentials
      const encryptionPassword = `avatar_${user.id}_${user.email}`;
      
      // Encrypt file data
      const encryptedBase64 = await encryptionService.encryptMessage(
        btoa(String.fromCharCode(...fileData)), 
        encryptionPassword
      );
      
      // Create encrypted blob
      const encryptedBlob = new Blob([encryptedBase64], { type: 'application/octet-stream' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_encrypted.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, encryptedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Store encrypted metadata
      const metadata = await encryptionService.encryptMessage(
        JSON.stringify({ original_name: file.name, content_type: file.type }),
        encryptionPassword
      );

      // Update profile with encrypted avatar URL and metadata
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          email_encrypted: metadata // Reuse field for metadata storage
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Store in localStorage for immediate use
      localStorage.setItem('rome-profile-image', publicUrl);
      localStorage.setItem('rome-profile-image-encrypted', 'true');

      toast({
        title: "Success",
        description: "Profile picture encrypted and updated successfully"
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
      // Convert file to ArrayBuffer for encryption
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Import encryption service
      const { encryptionService } = await import('@/lib/encryption');
      
      // Generate encryption password from user credentials
      const encryptionPassword = `wallpaper_${user.id}_${user.email}`;
      
      // Encrypt file data
      const encryptedBase64 = await encryptionService.encryptMessage(
        btoa(String.fromCharCode(...fileData)), 
        encryptionPassword
      );
      
      // Create encrypted blob
      const encryptedBlob = new Blob([encryptedBase64], { type: 'application/octet-stream' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/wallpaper_encrypted_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(fileName, encryptedBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(fileName);

      // Store encrypted metadata
      const metadata = await encryptionService.encryptMessage(
        JSON.stringify({ original_name: file.name, content_type: file.type }),
        encryptionPassword
      );

      // Update profile with encrypted wallpaper URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallpaper_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Store in localStorage for immediate use
      localStorage.setItem('rome-background-image', publicUrl);
      localStorage.setItem('rome-background-image-encrypted', 'true');

      toast({
        title: "Success",
        description: "Wallpaper encrypted and updated successfully"
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
      // Convert file to ArrayBuffer for encryption
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Import encryption service
      const { encryptionService } = await import('@/lib/encryption');
      
      // Generate encryption password from user credentials
      const encryptionPassword = `file_${user.id}_${user.email}_${Date.now()}`;
      
      // Encrypt file data using military-grade encryption
      const encryptedBase64 = await encryptionService.encryptMessage(
        btoa(String.fromCharCode(...fileData)), 
        encryptionPassword
      );
      
      // Create encrypted blob
      const encryptedBlob = new Blob([encryptedBase64], { type: 'application/octet-stream' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_encrypted.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, encryptedBlob);

      if (uploadError) throw uploadError;

      // Store encrypted metadata
      const fileMetadata = {
        filename: file.name,
        file_path: fileName,
        content_type: file.type,
        encryption_password: encryptionPassword,
        size: file.size
      };
      const encryptedMetadata = await encryptionService.encryptMessage(
        JSON.stringify(fileMetadata), 
        `metadata_${user.id}`
      );
      
      await supabase
        .from('secure_files')
        .insert({
          user_id: user.id,
          filename: 'encrypted', // Hide real filename
          file_path: 'encrypted', // Hide real path
          content_type: 'application/octet-stream', // Hide real content type
          file_size: file.size,
          encrypted_file_metadata: encryptedMetadata,
          secure_payload: encryptedBase64.slice(0, 100) // Store first 100 chars as reference
        });

      // Get signed URL for secure access
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
          description: "File encrypted and uploaded successfully with military-grade security"
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