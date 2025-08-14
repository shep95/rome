import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { LiveMainContent } from '@/components/LiveMainContent';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [messageRequestCount, setMessageRequestCount] = useState(0);

  // Redirect unauthenticated users to home
  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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
    <div className="min-h-screen w-full bg-background">
      {/* Sign Out Button - Top Right */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50">
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="gap-1 md:gap-2 bg-card/80 backdrop-blur-xl border-border text-foreground hover:bg-card text-xs md:text-sm px-2 md:px-3"
        >
          <LogOut className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
      
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        messageRequestCount={messageRequestCount}
      />
      
      {/* Main Content */}
      <div className="pt-20 md:pt-0 md:ml-72 min-h-screen">
        <LiveMainContent 
          activeSection={activeSection}
          messageRequestCount={messageRequestCount}
          onMessageRequestCountChange={setMessageRequestCount}
        />
      </div>
    </div>
  );
};

export default Dashboard;