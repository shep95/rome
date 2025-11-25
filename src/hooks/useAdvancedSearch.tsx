import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { encryptionService } from '@/lib/encryption';

interface SearchFilters {
  query: string;
  senderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachment?: boolean;
  conversationId?: string;
}

interface SearchResult {
  id: string;
  conversation_id: string;
  sender_id: string;
  decrypted_content: string;
  created_at: string;
  file_name?: string;
  sender_username?: string;
  sender_display_name?: string;
  conversation_name?: string;
}

export const useAdvancedSearch = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const search = useCallback(async (filters: SearchFilters, limit = 50) => {
    if (!user || !filters.query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsSearching(true);

    try {
      // Get all conversations user is part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (participantError) throw participantError;

      const conversationIds = participantData.map(p => p.conversation_id);

      // Build query
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          data_payload,
          created_at,
          file_name,
          file_url,
          conversations!inner(name),
          profiles!sender_id(username, display_name)
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.senderId) {
        query = query.eq('sender_id', filters.senderId);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      if (filters.hasAttachment) {
        query = query.not('file_url', 'is', null);
      }

      if (filters.conversationId) {
        query = query.eq('conversation_id', filters.conversationId);
      }

      const { data: messages, error: messagesError } = await query;

      if (messagesError) throw messagesError;

      // Decrypt and filter messages client-side
      const searchQuery = filters.query.toLowerCase();
      const decryptedResults: SearchResult[] = [];

      for (const message of messages || []) {
        try {
          // Convert data_payload to base64 string for decryption
          let base64String: string;
          if (typeof message.data_payload === 'string') {
            base64String = message.data_payload;
          } else if (message.data_payload && typeof message.data_payload === 'object' && 'data' in message.data_payload) {
            const bufferData = new Uint8Array((message.data_payload as any).data);
            base64String = btoa(String.fromCharCode(...bufferData));
          } else {
            continue; // Skip if can't process
          }

          const decrypted = await encryptionService.decryptMessage(base64String, message.conversation_id);

          // Check if content or filename matches search query
          const contentMatch = decrypted.toLowerCase().includes(searchQuery);
          const filenameMatch = message.file_name?.toLowerCase().includes(searchQuery);

          if (contentMatch || filenameMatch) {
            const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
            const conversation = Array.isArray(message.conversations) ? message.conversations[0] : message.conversations;
            
            decryptedResults.push({
              id: message.id,
              conversation_id: message.conversation_id,
              sender_id: message.sender_id,
              decrypted_content: decrypted,
              created_at: message.created_at,
              file_name: message.file_name,
              sender_username: profile?.username,
              sender_display_name: profile?.display_name,
              conversation_name: conversation?.name
            });
          }
        } catch (error) {
          console.error('Error decrypting message:', error);
        }
      }

      setResults(decryptedResults);
      setTotalResults(decryptedResults.length);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setTotalResults(0);
  }, []);

  return {
    results,
    totalResults,
    isSearching,
    search,
    clearSearch
  };
};
