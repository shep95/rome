import { useState, useEffect, useCallback } from 'react';

export const useAppLock = () => {
  const [isLocked, setIsLocked] = useState(false);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  // Keyboard shortcut: Shift + L
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        lockApp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lockApp]);

  return {
    isLocked,
    lockApp,
    unlockApp
  };
};