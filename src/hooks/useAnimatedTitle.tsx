import { useEffect } from 'react';

export const useAnimatedTitle = (title: string, speed: number = 300) => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let currentIndex = 0;
    const titleLength = title.length;
    const paddedTitle = title + ' • '; // Add separator for smooth loop
    const fullLength = paddedTitle.length;

    const animateTitle = () => {
      const displayTitle = paddedTitle.slice(currentIndex) + paddedTitle.slice(0, currentIndex);
      document.title = displayTitle.slice(0, titleLength);
      currentIndex = (currentIndex + 1) % fullLength;
    };

    // Start animation
    intervalId = setInterval(animateTitle, speed);

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Reset to original title
      document.title = title;
    };
  }, [title, speed]);
};