import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ScheduledMessage {
  id: string;
  conversation_id: string;
  content: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  message_type?: string;
}

export const useScheduledMessages = (conversationId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('scheduled_messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      toast.error('Failed to load scheduled messages');
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const scheduleMessage = useCallback(async (
    conversationId: string,
    content: string,
    scheduledFor: Date,
    options?: {
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      messageType?: string;
      isSelfDestruct?: boolean;
      repliedToMessageId?: string;
    }
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          file_url: options?.fileUrl,
          file_name: options?.fileName,
          file_size: options?.fileSize,
          message_type: options?.messageType || 'text',
          is_self_destruct: options?.isSelfDestruct || false,
          replied_to_message_id: options?.repliedToMessageId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Message scheduled successfully');
      await loadMessages();
      
      return data;
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('Failed to schedule message');
      return null;
    }
  }, [user, loadMessages]);

  const cancelScheduledMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Scheduled message cancelled');
      await loadMessages();
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      toast.error('Failed to cancel message');
    }
  }, [loadMessages]);

  const updateScheduledMessage = useCallback(async (
    messageId: string,
    updates: {
      content?: string;
      scheduled_for?: Date;
    }
  ) => {
    try {
      const updateData: any = {};
      if (updates.content) updateData.content = updates.content;
      if (updates.scheduled_for) updateData.scheduled_for = updates.scheduled_for.toISOString();

      const { error } = await supabase
        .from('scheduled_messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Scheduled message updated');
      await loadMessages();
    } catch (error) {
      console.error('Error updating scheduled message:', error);
      toast.error('Failed to update message');
    }
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    scheduleMessage,
    cancelScheduledMessage,
    updateScheduledMessage,
    refreshMessages: loadMessages
  };
};
