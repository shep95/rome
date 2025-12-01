import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { encryptionService } from '@/lib/encryption';
import { toast } from 'sonner';

interface NomadConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: 'text' | 'file' | 'image' | 'video';
  sender?: any;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export const useNomadCloudStorage = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  /**
   * Save conversation to Supabase with encryption
   */
  const saveConversation = useCallback(async (
    conversationId: string,
    messages: Message[],
    title: string,
    lastMessage: string,
    securityCode: string
  ): Promise<boolean> => {
    try {
      setIsSyncing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      // Encrypt messages and title with user's security code
      const messagesJson = JSON.stringify(messages);
      const encryptedMessages = await encryptionService.encryptMessage(messagesJson, securityCode);
      const encryptedTitle = await encryptionService.encryptMessage(title, securityCode);
      const encryptedPreview = await encryptionService.encryptMessage(lastMessage.slice(0, 100), securityCode);

      // Generate salt for this conversation (stored for reference, actual encryption uses its own salt)
      const salt = encryptionService.generateSalt();
      const saltBase64 = btoa(String.fromCharCode(...salt));

      // Upsert to Supabase
      const { error } = await supabase
        .from('nomad_conversations')
        .upsert({
          user_id: user.id,
          conversation_id: conversationId,
          title_encrypted: encryptedTitle,
          messages_encrypted: encryptedMessages,
          last_message_preview: encryptedPreview,
          encryption_salt: saltBase64,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,conversation_id'
        });

      if (error) {
        console.error('Error saving conversation to cloud:', error);
        return false;
      }

      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Error encrypting/saving conversation:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Load all conversations from Supabase with decryption
   */
  const loadConversations = useCallback(async (
    securityCode: string
  ): Promise<{ conversations: NomadConversation[]; messagesMap: Map<string, Message[]> } | null> => {
    try {
      setIsSyncing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      // Fetch encrypted conversations
      const { data, error } = await supabase
        .from('nomad_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations from cloud:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return { conversations: [], messagesMap: new Map() };
      }

      const conversations: NomadConversation[] = [];
      const messagesMap = new Map<string, Message[]>();

      // Decrypt each conversation
      for (const conv of data) {
        try {
          const title = await encryptionService.decryptMessage(conv.title_encrypted, securityCode);
          const lastMessage = await encryptionService.decryptMessage(conv.last_message_preview || '', securityCode);
          const messagesJson = await encryptionService.decryptMessage(conv.messages_encrypted, securityCode);
          const messages = JSON.parse(messagesJson) as Message[];

          conversations.push({
            id: conv.conversation_id,
            title,
            lastMessage,
            timestamp: conv.updated_at || conv.created_at,
          });

          messagesMap.set(conv.conversation_id, messages);
        } catch (decryptError) {
          console.error(`Failed to decrypt conversation ${conv.conversation_id}:`, decryptError);
          // Skip corrupted conversations
        }
      }

      setLastSyncTime(new Date());
      return { conversations, messagesMap };
    } catch (error) {
      console.error('Error loading/decrypting conversations:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Delete conversation from Supabase
   */
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('nomad_conversations')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error deleting conversation from cloud:', error);
        return false;
      }

      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Migrate localStorage conversations to Supabase
   */
  const syncFromLocal = useCallback(async (securityCode: string): Promise<{
    success: boolean;
    migratedCount: number;
  }> => {
    try {
      setIsSyncing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, migratedCount: 0 };
      }

      // Get conversations from localStorage
      const stored = localStorage.getItem('nomad-conversations');
      if (!stored) {
        return { success: true, migratedCount: 0 };
      }

      const localConversations = JSON.parse(stored) as NomadConversation[];
      let migratedCount = 0;

      for (const conv of localConversations) {
        // Get messages for this conversation
        const messagesStored = localStorage.getItem(`nomad-conversation-${conv.id}`);
        if (!messagesStored) continue;

        const messages = JSON.parse(messagesStored) as Message[];

        // Save to cloud
        const success = await saveConversation(
          conv.id,
          messages,
          conv.title,
          conv.lastMessage,
          securityCode
        );

        if (success) {
          migratedCount++;
        }
      }

      toast.success(`Migrated ${migratedCount} conversation(s) to cloud`);
      return { success: true, migratedCount };
    } catch (error) {
      console.error('Error migrating conversations:', error);
      toast.error('Failed to migrate conversations');
      return { success: false, migratedCount: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [saveConversation]);

  return {
    saveConversation,
    loadConversations,
    deleteConversation,
    syncFromLocal,
    isSyncing,
    lastSyncTime,
  };
};
