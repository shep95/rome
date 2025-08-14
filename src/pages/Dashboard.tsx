import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { MainContent } from '@/components/MainContent';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');

  // Redirect unauthenticated users to home
  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex relative">
      {/* Sign Out Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="gap-2 bg-black/20 backdrop-blur-xl border-white/10 text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Main Content */}
      <MainContent activeSection={activeSection} />
    </div>
  );
};

export default Dashboard;