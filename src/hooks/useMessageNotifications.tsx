import { useEffect, useRef } from 'react';

interface NotificationOptions {
  senderName: string;
  conversationName?: string;
  isGroup: boolean;
}

export const useMessageNotifications = () => {
  const permissionGranted = useRef(false);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        permissionGranted.current = permission === 'granted';
      });
    } else if (Notification.permission === 'granted') {
      permissionGranted.current = true;
    }
  }, []);

  const showNotification = ({ senderName, conversationName, isGroup }: NotificationOptions) => {
    // Check if notifications are supported and permitted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Don't show notification if the window is focused
    if (document.hasFocus()) {
      return;
    }

    // Create notification title and body
    const title = isGroup && conversationName 
      ? conversationName 
      : 'New Message';
    
    const body = isGroup && conversationName
      ? `${senderName} sent a message`
      : `${senderName} sent you a message`;

    // Show the notification
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon-rounded-24px.png',
        badge: '/favicon-rounded-24px.png',
        tag: 'message-notification', // Prevents duplicate notifications
        requireInteraction: false,
      });

      // Auto-close after 4 seconds
      setTimeout(() => notification.close(), 4000);

      // Focus the window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  return { showNotification };
};
