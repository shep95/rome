import React from 'react';
import { Button } from '@/components/ui/button';

interface TopNavigationProps {
  onSignUpClick?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onSignUpClick }) => {
  return (
    <nav className="fixed top-0 left-1/2 transform -translate-x-1/2 sm:left-auto sm:right-0 sm:transform-none z-50 p-4">
      <Button 
        onClick={onSignUpClick}
        variant="outline"
        className="h-12 px-6 bg-background/90 backdrop-blur-sm rounded-md shadow-lg border border-border/20 hover:bg-background/95 text-foreground hover:text-foreground text-sm font-medium"
      >
        Enter The Kingdom | Sign Up
      </Button>
    </nav>
  );
};