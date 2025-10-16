import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GlowingSection } from "@/components/GlowingSection";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { GlassmorphismFooter } from "@/components/ui/glassmorphism-footer";
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
      <div className="pt-20">
        <BackgroundPaths 
          title="ROME" 
          onWatermarkClick={() => setIsAuthModalOpen(true)}
        />
      </div>
      
      {/* 3D Marquee Section */}
      <section id="marquee-section" className="relative bg-background py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video rounded-2xl sm:rounded-3xl border border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.2)] sm:shadow-[0_0_50px_hsl(var(--primary)/0.3)] overflow-hidden bg-gradient-to-br from-background/80 to-background backdrop-blur-sm">
            <ThreeDMarquee images={images} />
          </div>
        </div>
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="glowing-section" />
        </div>
      </section>
      
      {/* Glowing Effects Section */}
      <div id="glowing-section" className="relative">
        <GlowingSection />
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="download-section" />
        </div>
      </div>
      
      {/* Download Section */}
      <section id="download-section" className="relative bg-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent mb-6">
              Download ROME
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get secure messaging on all your devices. Available for Windows, Android, and iOS.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center max-w-4xl mx-auto">
            {/* Android */}
            <div 
              className="group relative cursor-pointer"
              onClick={() => window.open('http://install.page/rome879', '_blank')}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c2a084] to-[#c2a084] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-card border border-[#c2a084]/20 rounded-2xl p-8 hover:shadow-[0_0_30px_rgba(194,160,132,0.25)] transition-all duration-300 min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center p-2">
                  <img src={romeFavicon} alt="ROME" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Android</h3>
                <p className="text-sm text-muted-foreground mb-4">Android 8.0+</p>
                <div className="px-4 py-2 bg-[#c2a084]/10 text-[#c2a084] text-sm font-medium rounded-lg">Download Now</div>
              </div>
            </div>
            
            {/* iPhone */}
            <div 
              className="group relative cursor-pointer"
              onClick={() => window.open('http://install.page/rome879', '_blank')}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c2a084] to-[#c2a084] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-card border border-[#c2a084]/20 rounded-2xl p-8 hover:shadow-[0_0_30px_rgba(194,160,132,0.25)] transition-all duration-300 min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center p-2">
                  <img src={romeFavicon} alt="ROME" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-semibold mb-2">iPhone</h3>
                <p className="text-sm text-muted-foreground mb-4">iOS 14.0+</p>
                <div className="px-4 py-2 bg-[#c2a084]/10 text-[#c2a084] text-sm font-medium rounded-lg">Download Now</div>
              </div>
            </div>
            
            {/* Web */}
            <div 
              className="group relative cursor-pointer"
              onClick={() => window.open('http://install.page/rome879', '_blank')}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c2a084] to-[#c2a084] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-card border border-[#c2a084]/20 rounded-2xl p-8 hover:shadow-[0_0_30px_rgba(194,160,132,0.25)] transition-all duration-300 min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center p-2">
                  <img src={romeFavicon} alt="ROME" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Web</h3>
                <p className="text-sm text-muted-foreground mb-4">Any Browser</p>
                <div className="px-4 py-2 bg-[#c2a084]/10 text-[#c2a084] text-sm font-medium rounded-lg">Access Now</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
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