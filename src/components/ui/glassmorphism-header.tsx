import React from 'react';
import { Home, Sparkles, Download, Info, LogIn } from 'lucide-react';
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

  const navItems = [
    { label: 'Home', icon: Home, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Features', icon: Sparkles, action: () => scrollToSection('marquee-section') },
    { label: 'Download', icon: Download, action: () => scrollToSection('download-section') },
    { label: 'About', icon: Info, action: () => scrollToSection('footer-section') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <nav className="max-w-6xl mx-auto">
        <div className="relative">
          {/* Film grain overlay */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, transparent 20%, rgba(255, 255, 255, 0.05) 21%, rgba(255, 255, 255, 0.05) 34%, transparent 35%, transparent),
                linear-gradient(0deg, rgba(255, 255, 255, 0.05), transparent 50%, rgba(255, 255, 255, 0.05)),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1), transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.05), transparent 50%),
                radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.08), transparent 50%),
                radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.06), transparent 50%)
              `,
              backgroundSize: '200px 200px, 100px 100px, 150px 150px, 180px 180px, 120px 120px, 90px 90px'
            }}
          />
          
          {/* Main header container */}
          <div className="relative bg-background/80 backdrop-blur-md border border-border/20 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/rome-favicon.png" 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg"
                />
              </div>

              {/* Navigation items */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-all duration-200 group"
                  >
                    <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Auth button */}
              <Button 
                onClick={onSignUpClick}
                variant="outline"
                className="flex items-center space-x-2 bg-primary/10 border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Enter The Kingdom</span>
              </Button>
            </div>
          </div>

        </div>
      </nav>
    </header>
  );
};