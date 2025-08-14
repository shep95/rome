import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AboutUsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto bg-background/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl">
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/6ff9b03d-a2fd-4cd2-b509-fb12b4bca3f2.png" 
              alt="ROME" 
              className="w-16 h-16 object-cover rounded-xl"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About ROME
          </h2>

          {/* Main Message */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl" />
            <div className="relative bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                ROME Was Founded On
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
                May 28th 2025
              </p>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};