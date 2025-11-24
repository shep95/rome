import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GlowingSection } from "@/components/GlowingSection";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { GlassmorphismFooter } from "@/components/ui/glassmorphism-footer";
import { BlackHoleBackground } from "@/components/ui/blackhole-background";
import { useAuth } from '@/hooks/useAuth';
import romeFavicon from '@/assets/rome-favicon.png';

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

  const baseImages = [
    "/lovable-uploads/b38fa270-f406-490d-b842-56eed7c7e3e8.png",
    "/lovable-uploads/90438f60-fc96-4cee-b9ad-04f77fd740a0.png",
    "/lovable-uploads/0a445d99-d5c0-4f1d-9c79-5b2d8b4073df.png",
  ];
  // Create more images to fill the 6-column grid
  const images = Array.from({ length: 150 }, (_, i) => baseImages[i % baseImages.length]);

  return (
    <>
      {/* Black Hole Background Animation */}
      <BlackHoleBackground />
      
      {/* Half bubble gradient on right side */}
      <div className="fixed top-1/4 right-0 w-[500px] h-[600px] pointer-events-none z-0">
        <div 
          className="absolute top-0 right-0 w-full h-full rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle at 100% 50%, #c2a084 0%, #c2a084 50%, transparent 85%)`,
            transform: 'translateX(50%)'
          }}
        />
        <div 
          className="absolute top-12 right-0 w-96 h-96 rounded-full opacity-10 blur-2xl"
          style={{
            background: `radial-gradient(circle at 100% 50%, #c2a084 0%, #c2a084 60%, transparent 90%)`,
            transform: 'translateX(40%)'
          }}
        />
      </div>
      
      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />
      <div className="pt-20 relative z-10">
        <BackgroundPaths 
          title="ROME" 
          onWatermarkClick={() => setIsAuthModalOpen(true)}
        />
      </div>
      
      {/* Glowing Effects Section */}
      <div id="glowing-section" className="relative">
        <GlowingSection />
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="download-section" />
        </div>
      </div>
      
      {/* Footer Section */}
      <section id="footer-section" className="relative bg-background py-20">
        <GlassmorphismFooter />
      </section>
      
      <div id="auth-section">
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </>
  );
};

export default Index;