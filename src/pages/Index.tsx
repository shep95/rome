import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GlowingSection } from "@/components/GlowingSection";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import { TopNavigation } from "@/components/ui/top-navigation";
import { GlassmorphismFooter } from "@/components/ui/glassmorphism-footer";
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
      
      <TopNavigation onSignUpClick={() => setIsAuthModalOpen(true)} />
      <BackgroundPaths title="ROME" />
      
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#c2a084]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.343l-.03-.018-1.482.885c-.29.173-.653.173-.943 0L12 14.341l-3.068 1.869c-.29.173-.653.173-.943 0l-1.482-.885-.03.018C4.772 14.411 3.5 12.366 3.5 10c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5c0 2.366-1.272 4.411-2.977 5.343zM7 9a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z"/>
                  </svg>
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#c2a084]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#c2a084]/20 to-[#c2a084]/30 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#c2a084]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
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