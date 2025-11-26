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
  fileType?: string;
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

      // Build query - fetch messages and related data separately
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          data_payload,
          created_at,
          file_name,
          file_url
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

      if (filters.fileType) {
        query = query.not('file_url', 'is', null);
        if (filters.fileType === 'image') {
          query = query.or('file_name.ilike.%.jpg,file_name.ilike.%.jpeg,file_name.ilike.%.png,file_name.ilike.%.gif,file_name.ilike.%.webp');
        } else if (filters.fileType === 'video') {
          query = query.or('file_name.ilike.%.mp4,file_name.ilike.%.webm,file_name.ilike.%.mov');
        }
      }

      if (filters.conversationId) {
        query = query.eq('conversation_id', filters.conversationId);
      }

      const { data: messages, error: messagesError } = await query;

      if (messagesError) throw messagesError;

      // Fetch conversation names
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, name')
        .in('id', conversationIds);

      // Fetch sender profiles
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', senderIds);

      // Create lookup maps
      const conversationMap = new Map(conversations?.map(c => [c.id, c.name]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Decrypt and filter messages client-side
      const searchQuery = filters.query.toLowerCase();
      const decryptedResults: SearchResult[] = [];

      for (const message of messages || []) {
        try {
          const payload = message.data_payload as string | { data: number[] } | null;
          if (!payload) continue;

          let decrypted: string = '';

          // Handle Buffer format
          if (typeof payload === 'object' && 'data' in payload) {
            const bufferData = new Uint8Array(payload.data);
            const base64String = btoa(String.fromCharCode(...bufferData));
            
            try {
              decrypted = await encryptionService.decryptMessage(base64String, message.conversation_id);
            } catch {
              // Not encrypted - decode as plain UTF-8 text
              decrypted = new TextDecoder().decode(bufferData);
            }
          } else if (typeof payload === 'string') {
            // Handle string format
            try {
              decrypted = await encryptionService.decryptMessage(payload, message.conversation_id);
            } catch {
              // Plain text or hex string
              if (payload.startsWith('\\x')) {
                decrypted = payload.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => 
                  String.fromCharCode(parseInt(hex, 16))
                );
              } else {
                decrypted = payload;
              }
            }
          } else {
            continue;
          }

          // Check if content or filename matches search query
          const contentMatch = decrypted.toLowerCase().includes(searchQuery);
          const filenameMatch = message.file_name?.toLowerCase().includes(searchQuery);

          if (contentMatch || filenameMatch) {
            const profile = profileMap.get(message.sender_id);
            const conversationName = conversationMap.get(message.conversation_id);
            
            decryptedResults.push({
              id: message.id,
              conversation_id: message.conversation_id,
              sender_id: message.sender_id,
              decrypted_content: decrypted,
              created_at: message.created_at,
              file_name: message.file_name,
              sender_username: profile?.username,
              sender_display_name: profile?.display_name,
              conversation_name: conversationName
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
