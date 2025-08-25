import React from 'react';
import { Button } from '@/components/ui/button';

interface TopNavigationProps {
  onSignUpClick?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onSignUpClick }) => {
  return (
    <nav className="fixed top-0 right-0 z-50 p-4">
      <Button 
        onClick={onSignUpClick}
        variant="outline"
        className="h-12 px-6 bg-background/90 backdrop-blur-sm rounded-md shadow-lg border border-border/20 hover:bg-background/95 text-foreground hover:text-foreground text-sm font-medium"
      >
        Login | Sign Up
      </Button>
    </nav>
  );
};