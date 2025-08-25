import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GlowingSection } from "@/components/GlowingSection";
import { ScrollDownButton } from "@/components/ui/scroll-down-button";
import { ShaderAnimation } from "@/components/ui/shader-lines";
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
      <BackgroundPaths 
        title="ROME" 
        onSignUpClick={() => setIsAuthModalOpen(true)} 
      />
      
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
            {/* Windows */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-5.25v18L11.5 22V12.75l8.5-5.25zm-8.5.75v8.25L3 18.75V12l8.5-.75z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Windows</h3>
                <p className="text-sm text-muted-foreground mb-4">Windows 10/11</p>
                <div className="text-xs text-primary">Coming Soon</div>
              </div>
            </div>
            
            {/* Android */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.343l-.03-.018-1.482.885c-.29.173-.653.173-.943 0L12 14.341l-3.068 1.869c-.29.173-.653.173-.943 0l-1.482-.885-.03.018C4.772 14.411 3.5 12.366 3.5 10c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5c0 2.366-1.272 4.411-2.977 5.343zM7 9a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Android</h3>
                <p className="text-sm text-muted-foreground mb-4">Android 8.0+</p>
                <div className="text-xs text-primary">Coming Soon</div>
              </div>
            </div>
            
            {/* iPhone */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">iPhone</h3>
                <p className="text-sm text-muted-foreground mb-4">iOS 14.0+</p>
                <div className="text-xs text-primary">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="rounded-square-section" />
        </div>
      </section>
      
      {/* Rounded Square Section */}
      <section id="rounded-square-section" className="relative bg-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-3xl p-16 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 w-80 h-80 flex items-center justify-center overflow-hidden">
                <ShaderAnimation />
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                      <path d="M2 17L12 22L22 17"/>
                      <path d="M2 12L12 17L22 12"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                    ROME Core
                  </h3>
                  <p className="text-muted-foreground">
                    Secure messaging platform built for privacy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ScrollDownButton targetId="socials-section" />
        </div>
      </section>
      
      {/* Socials Section */}
      <section id="socials-section" className="relative bg-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent mb-6">
              SOCIALS
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join The Founder Community
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center max-w-4xl mx-auto">
            {/* Twitter */}
            <a 
              href="https://x.com/asher_united" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative hover-scale"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Twitter</h3>
                <p className="text-sm text-muted-foreground mb-4">Follow us @asher_united</p>
                <div className="text-xs text-primary">Follow Now</div>
              </div>
            </a>
            
            {/* YouTube */}
            <a 
              href="https://www.youtube.com/@asher_newton" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative hover-scale"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Asher YouTube</h3>
                <p className="text-sm text-muted-foreground mb-4">Security tutorials & updates</p>
                <div className="text-xs text-primary">Subscribe</div>
              </div>
            </a>
            
            {/* Discord */}
            <a 
              href="https://discord.gg/2JpT4XSbHQ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative hover-scale"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer min-w-[200px] text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Discord</h3>
                <p className="text-sm text-muted-foreground mb-4">Join our community</p>
                <div className="text-xs text-primary">Join Server</div>
              </div>
            </a>
          </div>
        </div>
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