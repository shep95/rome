import React from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlassmorphismHeaderProps {
  onSignUpClick?: () => void;
}

export const GlassmorphismHeader: React.FC<GlassmorphismHeaderProps> = ({ onSignUpClick }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto">
        {/* Mobile: Single container */}
        <div className="md:hidden relative bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <span className="text-xl font-light tracking-wider text-white">ROME</span>
            <Button 
              onClick={onSignUpClick}
              variant="outline"
              className="text-sm border-white/20 text-white hover:bg-white/5 hover:border-white/30"
            >
              Sign up
            </Button>
          </div>
        </div>

        {/* Desktop: Two separate containers */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Logo section - separate container */}
          <div className="relative bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <div className="px-6 py-3">
              <span className="text-xl font-light tracking-wider text-white">ROME</span>
            </div>
          </div>

          {/* Right side navigation - separate container */}
          <div className="relative bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4 px-6 py-3">
              {/* Features dropdown button */}
              <button
                onClick={() => scrollToSection('glowing-section')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Features
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Download icon button */}
              <button
                onClick={() => scrollToSection('footer-section')}
                className="p-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Login button */}
              <Button 
                onClick={onSignUpClick}
                variant="ghost"
                className="text-sm text-white/90 hover:text-white hover:bg-white/5"
              >
                Login
              </Button>

              {/* Sign up button */}
              <Button 
                onClick={onSignUpClick}
                variant="outline"
                className="text-sm border-white/20 text-white hover:bg-white/5 hover:border-white/30"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};