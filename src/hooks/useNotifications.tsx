import { supabase } from '@/integrations/supabase/client';

interface NotifyParams {
  recipientId: string;
  senderName: string;
  eventType: 'message' | 'call' | 'message_request';
  conversationName?: string;
  isGroup?: boolean;
}

export const useNotifications = () => {
  const sendNotification = async (params: NotifyParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('notify', {
        body: params,
      });

      if (error) {
        console.error('Error sending notification:', error);
        return;
      }

      console.log('Notification sent successfully:', data);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return { sendNotification };
};
