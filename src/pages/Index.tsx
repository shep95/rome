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
        {/* Top Pattern - Scattered Images */}
        <div className="absolute top-0 left-0 w-full h-40 opacity-30 overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <img
              key={`top-${i}`}
              src={baseImages[i % baseImages.length]}
              alt=""
              className="absolute w-16 h-12 rounded object-cover shadow-lg"
              style={{
                left: `${(i * 12) + 5}%`,
                top: `${Math.sin(i) * 20 + 10}px`,
                transform: `rotate(${i * 15}deg)`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
        
        {/* Right Pattern - Scattered Images */}
        <div className="absolute top-20 right-0 w-40 h-full opacity-30 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <img
              key={`right-${i}`}
              src={baseImages[i % baseImages.length]}
              alt=""
              className="absolute w-16 h-12 rounded object-cover shadow-lg"
              style={{
                right: `${Math.cos(i) * 30 + 10}px`,
                top: `${(i * 15) + 10}%`,
                transform: `rotate(${i * -20}deg)`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
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