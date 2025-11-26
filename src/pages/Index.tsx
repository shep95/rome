import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from "@/components/ui/auth-modal";
import { GlowingSection } from "@/components/GlowingSection";
import { TechnologyStack } from "@/components/TechnologyStack";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { GlassmorphismFooter } from "@/components/ui/glassmorphism-footer";
import { BlackHoleBackground } from "@/components/ui/blackhole-background";
import { useAuth } from '@/hooks/useAuth';

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
    <>
      {/* Fixed Black Hole Background */}
      <BlackHoleBackground />
      
      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Content overlay */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground))]/80">
              ROME
            </h1>
            
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-8 px-4">
              Advanced Secure Messaging App
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
      
      {/* Used by Officials Section */}
      <section className="relative py-12 bg-transparent">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground/90 mb-8">
            Used by Officials Around The World
          </h3>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <img 
              src="https://flagcdn.com/w320/us.png" 
              alt="United States Flag" 
              className="h-16 md:h-20 w-auto hover:scale-110 transition-transform shadow-lg rounded grayscale hover:grayscale-0"
            />
            <img 
              src="https://flagcdn.com/w320/in.png" 
              alt="India Flag" 
              className="h-16 md:h-20 w-auto hover:scale-110 transition-transform shadow-lg rounded grayscale hover:grayscale-0"
            />
            <img 
              src="https://flagcdn.com/w320/pe.png" 
              alt="Peru Flag" 
              className="h-16 md:h-20 w-auto hover:scale-110 transition-transform shadow-lg rounded grayscale hover:grayscale-0"
            />
            <img 
              src="https://flagcdn.com/w320/gb.png" 
              alt="United Kingdom Flag" 
              className="h-16 md:h-20 w-auto hover:scale-110 transition-transform shadow-lg rounded grayscale hover:grayscale-0"
            />
          </div>
        </div>
      </section>
      
      {/* Glowing Effects Section */}
      <div id="glowing-section" className="relative">
        <GlowingSection />
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="technology-section" />
        </div>
      </div>
      
      {/* Technology Stack Section */}
      <div id="technology-section" className="relative">
        <TechnologyStack />
      </div>
      
      {/* Footer Section */}
      <section id="footer-section" className="relative py-20 bg-transparent">
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