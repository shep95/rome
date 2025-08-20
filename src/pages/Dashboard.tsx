import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePersistence } from '@/hooks/useProfilePersistence';
import { useAppLock } from '@/hooks/useAppLock';
import { useScreenshotProtection } from '@/hooks/useScreenshotProtection';
import { Button } from '@/components/ui/button';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { LiveMainContent } from '@/components/LiveMainContent';
import { SecureFiles } from '@/components/SecureFiles';
import { AppLock } from '@/components/SecurityLock';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { isLocked, unlockApp } = useAppLock();
  useProfilePersistence(); // Auto-save profile data
  useScreenshotProtection(true); // Enable screenshot protection
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [messageRequestCount, setMessageRequestCount] = useState(0);

  // Redirect unauthenticated users to home
  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Load initial message request count
  useEffect(() => {
    if (user) {
      loadMessageRequestCount();
    }
  }, [user]);

  // Listen for message request events to reload count
  useEffect(() => {
    const handleMessageRequestEvent = () => {
      if (user) {
        loadMessageRequestCount();
      }
    };

    window.addEventListener('messageRequestSent', handleMessageRequestEvent);
    return () => window.removeEventListener('messageRequestSent', handleMessageRequestEvent);
  }, [user]);

  const loadMessageRequestCount = async () => {
    try {
      // Only count incoming pending requests for the notification badge
      const { data } = await supabase
        .from('message_requests')
        .select('id')
        .eq('to_user_id', user?.id)
        .eq('status', 'pending');
      
      setMessageRequestCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading message request count:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <>
      <AppLock isLocked={isLocked} onUnlock={unlockApp} />
      <div className="min-h-screen w-full bg-background flex">
      
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        messageRequestCount={messageRequestCount}
        onMessageRequestCountChange={setMessageRequestCount}
      />
      
      {/* Main Content */}
      <div className="flex-1 pt-16 md:pt-0 md:ml-60 lg:ml-72 xl:ml-80 min-h-screen w-full overflow-hidden">
        {activeSection === 'secure-files' ? (
          <div className="flex-1 flex items-center justify-center bg-background min-h-screen p-2 sm:p-4 md:p-6">
            <SecureFiles />
          </div>
        ) : (
          <LiveMainContent 
            activeSection={activeSection}
            messageRequestCount={messageRequestCount}
            onMessageRequestCountChange={setMessageRequestCount}
          />
        )}
      </div>
    </div>
    </>
  );
};

export default Dashboard;