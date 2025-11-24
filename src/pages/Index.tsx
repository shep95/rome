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
      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />
      
      {/* Black Hole Background Section - Replaces wave animation */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-hidden">
        <BlackHoleBackground />
        
        {/* Content overlay */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center mt-32 sm:mt-36 md:mt-40 lg:mt-48">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground))]/80">
              ROME
            </h1>
            
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-8 px-4">
              Advance Secured Messaging App
            </div>
          </div>
        </div>
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <ScrollDownButton targetId="glowing-section" />
        </div>
        
        {/* Watermark */}
        <div 
          className="fixed bottom-4 right-4 z-30 cursor-pointer group"
          onClick={() => setIsAuthModalOpen(true)}
        >
          <img 
            src="/lovable-uploads/c0adbdf1-7e12-4f03-bc2c-96a8a62eb425.png" 
            alt="ROME Logo" 
            className="w-16 h-16 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 transition-transform" 
          />
        </div>
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