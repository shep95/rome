import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Draft {
  id: string;
  content: string;
  attachments: any;
  replied_to_message_id?: string | null;
  updated_at: string;
}

export const useMessageDrafts = (conversationId: string) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load existing draft
  useEffect(() => {
    if (!user || !conversationId) return;

    const loadDraft = async () => {
      try {
        const { data, error } = await supabase
          .from('message_drafts')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setDraft({
            ...data,
            attachments: Array.isArray(data.attachments) ? data.attachments : []
          });
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [conversationId, user]);

  // Auto-save draft with debouncing
  const saveDraft = useCallback(async (
    content: string, 
    attachments: any[] = [],
    repliedToMessageId?: string
  ) => {
    if (!user || !conversationId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!content.trim() && attachments.length === 0) {
          // Delete draft if empty
          if (draft?.id) {
            await supabase
              .from('message_drafts')
              .delete()
              .eq('id', draft.id);
            setDraft(null);
          }
          return;
        }

        const draftData = {
          conversation_id: conversationId,
          user_id: user.id,
          content,
          attachments,
          replied_to_message_id: repliedToMessageId || null
        };

        if (draft?.id) {
          // Update existing draft
          const { data, error } = await supabase
            .from('message_drafts')
            .update(draftData)
            .eq('id', draft.id)
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setDraft({
              ...data,
              attachments: Array.isArray(data.attachments) ? data.attachments : []
            });
          }
        } else {
          // Create new draft
          const { data, error } = await supabase
            .from('message_drafts')
            .insert(draftData)
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setDraft({
              ...data,
              attachments: Array.isArray(data.attachments) ? data.attachments : []
            });
          }
        }
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }, 1000);
  }, [conversationId, user, draft]);

  // Clear draft after sending message
  const clearDraft = useCallback(async () => {
    if (!draft?.id) return;

    try {
      const { error } = await supabase
        .from('message_drafts')
        .delete()
        .eq('id', draft.id);

      if (error) throw error;
      setDraft(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [draft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    isLoading,
    saveDraft,
    clearDraft
  };
};
