import { useEffect } from 'react';

export const useUnreadTitle = (unreadCount: number) => {
  useEffect(() => {
    const baseTitle = 'Rome Messaging';
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup on unmount
    return () => {
      document.title = baseTitle;
    };
  }, [unreadCount]);
};
