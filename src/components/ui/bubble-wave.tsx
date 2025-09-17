import React from 'react';

interface BubbleWaveProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BubbleWave: React.FC<BubbleWaveProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-1.5 w-1.5',
    lg: 'h-2 w-2'
  };

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <div 
        className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '0s', animationDuration: '1.4s' }}
      />
      <div 
        className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}
      />
      <div 
        className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}
      />
    </div>
  );
};