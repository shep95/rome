import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useProfilePersistence = () => {
  const { user } = useAuth();

  // Auto-save profile data to database whenever localStorage changes
  useEffect(() => {
    if (!user) return;

    const saveProfileData = async () => {
      try {
        const profileImage = localStorage.getItem('rome-profile-image');
        const backgroundImage = localStorage.getItem('rome-background-image');
        const username = localStorage.getItem('rome-username');
        const displayName = localStorage.getItem('rome-display-name');
        const tailscaleIPv4 = localStorage.getItem('rome-tailscale-ipv4');
        const tailscaleIPv6 = localStorage.getItem('rome-tailscale-ipv6');
        const tailscaleMagicDNS = localStorage.getItem('rome-tailscale-magicdns');

        // Only update if we have some data to save
        if (profileImage || backgroundImage || username || displayName || tailscaleIPv4 || tailscaleIPv6 || tailscaleMagicDNS) {
          const updateData: any = {};
          
          if (profileImage) updateData.avatar_url = profileImage;
          if (backgroundImage) updateData.wallpaper_url = backgroundImage;
          if (username) updateData.username = username;
          if (displayName) updateData.display_name = displayName;
          if (tailscaleIPv4) updateData.tailscale_ipv4 = tailscaleIPv4;
          if (tailscaleIPv6) updateData.tailscale_ipv6 = tailscaleIPv6;
          if (tailscaleMagicDNS) updateData.tailscale_magicdns = tailscaleMagicDNS;

          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email!,
              ...updateData
            }, {
              onConflict: 'id'
            });

          // Create backup in sessionStorage
          const backupData = {
            profileImage,
            backgroundImage,
            username,
            displayName,
            tailscaleIPv4,
            tailscaleIPv6,
            tailscaleMagicDNS,
            userEmail: user.email
          };
          
          sessionStorage.setItem(`rome-backup-${user.email}`, JSON.stringify(backupData));
        }
      } catch (error) {
        console.error('Error auto-saving profile:', error);
      }
    };

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('rome-')) {
        saveProfileData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Save initial data
    saveProfileData();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  return null;
};