import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
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
      <section className="relative bg-background py-20 overflow-hidden">
        {/* Top Pattern */}
        <div className="absolute top-0 left-0 w-full h-32 opacity-20">
          <div className="grid grid-cols-12 gap-2 h-full px-4">
            {Array.from({ length: 48 }, (_, i) => (
              <div 
                key={i} 
                className="w-full h-4 bg-gradient-to-r from-primary/10 to-transparent rounded-sm"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 7.5}deg)` 
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Right Pattern */}
        <div className="absolute top-20 right-0 w-32 h-full opacity-20">
          <div className="grid grid-rows-8 gap-2 h-full py-4">
            {Array.from({ length: 32 }, (_, i) => (
              <div 
                key={i} 
                className="h-full w-4 bg-gradient-to-b from-primary/10 to-transparent rounded-sm"
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                  transform: `rotate(${i * 11.25}deg)` 
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="aspect-video rounded-3xl border border-primary/20 shadow-[0_0_50px_hsl(var(--primary)/0.3)] overflow-hidden bg-gradient-to-br from-background/80 to-background backdrop-blur-sm">
            <ThreeDMarquee images={images} />
          </div>
        </div>
      </section>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Index;