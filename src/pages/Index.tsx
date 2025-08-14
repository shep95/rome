import { useState } from 'react';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuthModal } from "@/components/ui/auth-modal";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <BackgroundPaths 
        title="ROME" 
        onSignUpClick={() => setIsAuthModalOpen(true)} 
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default Index;