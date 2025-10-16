import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from "@/components/ui/auth-modal";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { useAuth } from '@/hooks/useAuth';
import landingBg from '@/assets/rome-landing-bg.png';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-screen background image */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${landingBg})`,
        }}
      />
      
      {/* Header */}
      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;