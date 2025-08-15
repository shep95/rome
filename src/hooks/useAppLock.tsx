import { useState, useEffect, useCallback } from 'react';

export const useAppLock = () => {
  const [isLocked, setIsLocked] = useState(false);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + L (more specific to avoid accidental triggers)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Ctrl (Windows/Linux) or Cmd (Mac) + Shift + L are pressed together
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
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