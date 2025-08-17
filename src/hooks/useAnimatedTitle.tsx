import { useEffect, useRef } from 'react';

export const useAnimatedTitle = (title: string, speed: number = 150) => {
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const currentIndexRef = useRef<number>(0);

  useEffect(() => {
    const paddedTitle = title + ' • '; // Add separator for smooth loop
    const fullLength = paddedTitle.length;
    let lastUpdateTime = 0;

    const smoothAnimate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
        lastUpdateTime = currentTime;
      }

      // Update every 'speed' milliseconds for smooth consistent scrolling
      if (currentTime - lastUpdateTime >= speed) {
        const displayTitle = paddedTitle.slice(currentIndexRef.current) + 
                           paddedTitle.slice(0, currentIndexRef.current);
        
        // Smooth character-by-character scrolling
        document.title = displayTitle.slice(0, title.length);
        
        currentIndexRef.current = (currentIndexRef.current + 1) % fullLength;
        lastUpdateTime = currentTime;
      }

      // Continue animation regardless of tab visibility
      animationRef.current = requestAnimationFrame(smoothAnimate);
    };

    // Start the animation
    animationRef.current = requestAnimationFrame(smoothAnimate);

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Reset to original title
      document.title = title;
    };
  }, [title, speed]);
};