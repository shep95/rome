import React, { useState } from 'react';
import { Github, MessageCircle } from 'lucide-react';

interface NavItemProps {
  icon?: React.ElementType;
  text?: string;
  isActive?: boolean;
  onClick?: () => void;
  indicatorPosition: number;
  position: number;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  text,
  isActive = false, 
  onClick,
  indicatorPosition,
  position
}) => {
  const distance = Math.abs(indicatorPosition - position);
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6);
  
  // Adjust width based on content type
  const itemWidth = text ? 'auto' : 'w-12';
  const itemPadding = text ? 'px-3' : '';

  return (
    <button
      className={`relative flex items-center justify-center h-12 mx-2 transition-all duration-400 ${itemWidth} ${itemPadding}`}
      onClick={onClick}
    >
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-b from-primary/60 to-transparent blur-lg rounded-full transition-opacity duration-400"
        style={{
          opacity: spotlightOpacity,
          transitionDelay: isActive ? '0.1s' : '0s',
        }}
      />
      {text ? (
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          {text}
        </span>
      ) : Icon ? (
        <Icon
          className={`w-6 h-6 transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground/80'
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
      ) : null}
    </button>
  );
};

interface SpotlightButtonProps {
  onSignUpClick?: () => void;
}

export const SpotlightButton: React.FC<SpotlightButtonProps> = ({ onSignUpClick }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const navItems = [
    { icon: Github, label: 'GitHub', action: () => window.open('https://github.com/shep95/rome', '_blank') },
    { icon: MessageCircle, label: 'Discord', action: () => window.open('https://discord.gg/2JpT4XSbHQ', '_blank') },
  ];

  return (
    <nav className="relative flex items-center px-2 py-3 bg-background/90 backdrop-blur-sm rounded-md shadow-lg border border-border/20 w-fit">
      <div
        className="absolute top-0 h-[2px] bg-primary transition-all duration-400 ease-in-out"
        style={{
          left: `${activeIndex * 64 + 16}px`,
          width: '48px',
          transform: 'translateY(-1px)',
          opacity: activeIndex >= 0 ? 1 : 0,
        }}
      />
      {navItems.map((item, index) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          isActive={activeIndex === index}
          onClick={() => {
            setActiveIndex(index);
            item.action?.();
          }}
          indicatorPosition={activeIndex}
          position={index}
        />
      ))}
    </nav>
  );
};