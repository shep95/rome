import { useEffect } from 'react';

// Smooth, resilient tab-title scroller that avoids hook order issues
export const useAnimatedTitle = (title: string, speed: number = 60) => {
  useEffect(() => {
    const separator = ' • ';
    const fullText = title + separator;
    const duplicatedText = fullText + fullText; // Create seamless loop
    
    let position = 0;
    let animationId: number;
    
    const animate = () => {
      // Smooth pixel-by-pixel movement instead of character jumps
      const currentText = duplicatedText.substring(
        Math.floor(position), 
        Math.floor(position) + title.length
      );
      
      document.title = currentText;
      
      // Increment by smaller steps for smoother movement
      position += 0.5;
      
      // Reset when we've moved one full cycle
      if (position >= fullText.length) {
        position = 0;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Use requestAnimationFrame for smooth 60fps animation
    const startAnimation = () => {
      animationId = requestAnimationFrame(animate);
    };
    
    // Add slight delay for smoother start
    const timeoutId = setTimeout(startAnimation, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      document.title = title;
    };
  }, [title, speed]);
};