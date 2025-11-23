import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePersistence } from '@/hooks/useProfilePersistence';
import { useAppLock } from '@/hooks/useAppLock';
import { useScreenshotProtection } from '@/hooks/useScreenshotProtection';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { LiveMainContent } from '@/components/LiveMainContent';
import { AppLock } from '@/components/SecurityLock';
import { ReconnectModal } from "@/components/ReconnectModal";
import { supabase } from '@/integrations/supabase/client';

// Lazy load heavy components
const SecureFiles = lazy(() => import('@/components/SecureFiles').then(m => ({ default: m.SecureFiles })));
const Features = lazy(() => import('@/pages/Features'));

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { isLocked, unlockApp } = useAppLock();
  useProfilePersistence(); // Auto-save profile data
  useScreenshotProtection(true); // Enable screenshot protection
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [messageRequestCount, setMessageRequestCount] = useState(0);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

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
      
      // Setup realtime subscription for message request changes
      const channel = supabase
        .channel('message-request-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_requests',
            filter: `to_user_id=eq.${user.id}`
          },
          () => {
            loadMessageRequestCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
        .select('id', { count: 'exact', head: true })
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
        onShowReconnect={() => setShowReconnectModal(true)}
      />
      
      {/* Main Content */}
      <div className="flex-1 pt-16 lg:pt-0 lg:ml-60 xl:ml-72 2xl:ml-80 min-h-screen w-full overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-foreground">Loading...</div>
          </div>
        }>
          {activeSection === 'secure-files' ? (
            <div className="flex-1 flex items-center justify-center bg-background min-h-screen p-2 sm:p-4 md:p-6">
              <SecureFiles />
            </div>
          ) : activeSection === 'features' ? (
            <div className="flex-1 bg-background min-h-screen">
              <Features />
            </div>
          ) : (
            <LiveMainContent 
              activeSection={activeSection}
              messageRequestCount={messageRequestCount}
              onMessageRequestCountChange={setMessageRequestCount}
            />
          )}
        </Suspense>
      </div>
    </div>
    
    {/* Reconnect Modal */}
    <ReconnectModal 
      isOpen={showReconnectModal} 
      onClose={() => setShowReconnectModal(false)} 
    />
    </>
  );
};

export default Dashboard;