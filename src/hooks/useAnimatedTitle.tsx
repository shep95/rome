import { useEffect } from 'react';

// Smooth, resilient tab-title scroller that avoids hook order issues
export const useAnimatedTitle = (title: string, speed: number = 120) => {
  useEffect(() => {
    const separator = ' • ';
    const padded = title + separator; // smooth loop
    const fullLen = padded.length;
    const viewLen = title.length; // visible slice length

    let index = 0;
    let intervalId: number | undefined;

    const tick = () => {
      const display = padded.slice(index) + padded.slice(0, index);
      document.title = display.slice(0, viewLen);
      index = (index + 1) % fullLen;
    };

    // Start interval (setInterval continues even on background tabs, though throttled)
    intervalId = window.setInterval(tick, speed);

    // Initial render
    tick();

    // Cleanup
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.title = title;
    };
  }, [title, speed]);
};