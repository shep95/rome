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

  const images = [
    "/lovable-uploads/b38fa270-f406-490d-b842-56eed7c7e3e8.png",
    "/lovable-uploads/90438f60-fc96-4cee-b9ad-04f77fd740a0.png",
    "/lovable-uploads/0a445d99-d5c0-4f1d-9c79-5b2d8b4073df.png",
    "/lovable-uploads/b38fa270-f406-490d-b842-56eed7c7e3e8.png",
    "/lovable-uploads/90438f60-fc96-4cee-b9ad-04f77fd740a0.png",
    "/lovable-uploads/0a445d99-d5c0-4f1d-9c79-5b2d8b4073df.png",
    "/lovable-uploads/b38fa270-f406-490d-b842-56eed7c7e3e8.png",
    "/lovable-uploads/90438f60-fc96-4cee-b9ad-04f77fd740a0.png",
    "/lovable-uploads/0a445d99-d5c0-4f1d-9c79-5b2d8b4073df.png",
    "/lovable-uploads/b38fa270-f406-490d-b842-56eed7c7e3e8.png",
    "/lovable-uploads/90438f60-fc96-4cee-b9ad-04f77fd740a0.png",
    "/lovable-uploads/0a445d99-d5c0-4f1d-9c79-5b2d8b4073df.png",
  ];

  return (
    <>
      <BackgroundPaths 
        title="ROME" 
        onSignUpClick={() => setIsAuthModalOpen(true)} 
      />
      
      {/* 3D Marquee Section */}
      <section className="relative min-h-screen bg-background flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto rounded-3xl bg-primary/5 p-8 ring-1 ring-border/10">
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