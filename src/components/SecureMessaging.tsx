import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X, File, Image as ImageIcon, Video, Trash2, MoreVertical, ArrowLeft, Reply } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TypingIndicator } from './TypingIndicator';
import { MediaModal } from './MediaModal';
import { ThanosSnapEffect } from '@/components/ui/thanos-snap-effect';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: 'text' | 'file' | 'image' | 'video';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  replied_to_message_id?: string;
  replied_to_message?: Message;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  read_receipts?: {
    user_id: string;
    read_at: string;
    profile?: {
      username: string;
      display_name: string;
      avatar_url: string;
    };
  }[];
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video' | 'file';
}

interface SecureMessagingProps {
  conversationId?: string;
  onBackToMessages?: () => void;
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({ conversationId, onBackToMessages }) => {
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const { user } = useAuth();
  const { uploadFile } = useFileUpload();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const [userWallpaper, setUserWallpaper] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vhSet, setVhSet] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    url: string;
    type: 'image' | 'video';
    fileName?: string;
    fileSize?: number;
  }>({
    isOpen: false,
    url: '',
    type: 'image'
  });

  useEffect(() => {
    if (conversationId && user) {
      // Immediately load wallpaper from cache to avoid flash
      const cachedWallpaper = localStorage.getItem('rome-background-image');
      if (cachedWallpaper) {
        setUserWallpaper(cachedWallpaper);
        // Preload image to ensure it's cached
        const img = new Image();
        img.src = cachedWallpaper;
      }

      // Hydrate from cache first to avoid flicker/reload on tab return
      const cacheKey = `convMsg:${conversationId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Message[];
          if (Array.isArray(parsed)) {
            setMessages(parsed);
            setHasLoadedMessages(true);
          }
        } catch {
          // ignore parse errors
        }
      } else {
        setHasLoadedMessages(false);
      }

      loadConversationDetails();
      loadUserWallpaper(); // Still refresh in background for updates
      const cleanup = setupRealtimeSubscription();
      (async () => {
        await loadMessages(); // refresh in background without clearing UI
        setHasLoadedMessages(true);
      })();
      return () => {
        if (cleanup) cleanup();
        // Clear typing status on unmount
        if (user && conversationId) {
          setTypingStatus(false);
        }
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Cache messages per conversation to persist between tab switches
  useEffect(() => {
    if (!conversationId) return;
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem(`convMsg:${conversationId}`, JSON.stringify(messages));
    } catch {}
  }, [messages, conversationId]);

  // Stable viewport height on mobile to avoid growth on focus/return
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${vh}px`);
      setVhSet(true);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    // Use visualViewport when available for more accurate height on mobile
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const onVvResize = () => setVh();
    vv?.addEventListener?.('resize', onVvResize);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      vv?.removeEventListener?.('resize', onVvResize as any);
    };
  }, []);

  const loadConversationDetails = async () => {
    if (!conversationId) return;
    
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversationDetails(conversation);
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId || !user?.id) return;
    
    try {
      // Get user's join date for this conversation to filter messages
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('joined_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .eq('left_at', null)
        .single();

      if (participantError) throw participantError;
      
      const userJoinedAt = participantData?.joined_at;
      
      // Use limit and pagination for faster loading
      // Only load messages created after user joined the conversation
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gte('created_at', userJoinedAt) // Only show messages from when user joined
        .order('created_at', { ascending: false })
        .limit(50); // Load only latest 50 messages initially

      if (error) throw error;
      
      // Reverse to get chronological order and decrypt messages
      const decryptedMessages = await Promise.all((messagesData || []).reverse().map(async (msg) => {
        // Get sender profile
        let senderProfile = null;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();
          senderProfile = profile;
        } catch (error) {
          console.log('Profile not found for sender:', msg.sender_id);
        }

        // Decrypt message content
        const decryptedContent = await decodeMessage(msg.data_payload, conversationId);
        
        // Handle file metadata - support both old (unencrypted) and new (encrypted) formats
        let fileMetadata = null;
        let signedUrl = null;
        let fileName = null;
        
        if (msg.encrypted_file_metadata) {
          // New encrypted format
          try {
            const decryptedFileMetadata = await decodeMessage(msg.encrypted_file_metadata, conversationId);
            fileMetadata = JSON.parse(decryptedFileMetadata);
            fileName = fileMetadata.file_name;
            
            // Generate signed URL for secure files
            if (fileMetadata.file_url && fileMetadata.file_url.includes('secure-files')) {
              signedUrl = await getSignedUrlForSecureFiles(fileMetadata.file_url);
            } else {
              signedUrl = fileMetadata.file_url;
            }
          } catch (error) {
            console.error('Error decrypting file metadata:', error);
          }
        } else if (msg.file_url || msg.file_name) {
          // Old unencrypted format - fallback for existing messages
          fileName = msg.file_name;
          if (msg.file_url && msg.file_url.includes('secure-files')) {
            signedUrl = await getSignedUrlForSecureFiles(msg.file_url);
          } else {
            signedUrl = msg.file_url;
          }
        }
        
        // Get read receipts for this message
        let readBy: any[] = [];
        try {
          const { data: reads } = await supabase
            .from('message_reads')
            .select(`
              user_id,
              read_at,
              profiles:user_id (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('message_id', msg.id);
          
          readBy = reads?.map(read => ({
            user_id: read.user_id,
            read_at: read.read_at,
            profile: read.profiles
          })) || [];
        } catch (error) {
          console.log('Error loading read receipts for message:', msg.id);
        }
        
        // Get replied-to message if exists
        let repliedToMessage: Message | undefined = undefined;
        if (msg.replied_to_message_id) {
          try {
            // For now, we'll need to fetch the replied message separately
            // since we don't have the joined data structure properly set up
            const { data: repliedMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('id', msg.replied_to_message_id)
              .single();
            
            if (!repliedMsg) return;
            const repliedContent = await decodeMessage(repliedMsg.data_payload, conversationId);
            
            // Handle replied message file metadata - support both old and new formats
            let repliedFileMetadata = null;
            let repliedSignedUrl = null;
            let repliedFileName = null;
            
            if (repliedMsg.encrypted_file_metadata) {
              // New encrypted format
              try {
                const decryptedRepliedFileMetadata = await decodeMessage(repliedMsg.encrypted_file_metadata, conversationId);
                repliedFileMetadata = JSON.parse(decryptedRepliedFileMetadata);
                repliedFileName = repliedFileMetadata.file_name;
                
                if (repliedFileMetadata.file_url && repliedFileMetadata.file_url.includes('secure-files')) {
                  repliedSignedUrl = await getSignedUrlForSecureFiles(repliedFileMetadata.file_url);
                } else {
                  repliedSignedUrl = repliedFileMetadata.file_url;
                }
              } catch (error) {
                console.error('Error decrypting replied message file metadata:', error);
              }
            } else if (repliedMsg.file_url || repliedMsg.file_name) {
              // Old unencrypted format - fallback for existing messages
              repliedFileName = repliedMsg.file_name;
              if (repliedMsg.file_url && repliedMsg.file_url.includes('secure-files')) {
                repliedSignedUrl = await getSignedUrlForSecureFiles(repliedMsg.file_url);
              } else {
                repliedSignedUrl = repliedMsg.file_url;
              }
            }
            
            repliedToMessage = {
              id: repliedMsg.id,
              content: repliedContent,
              sender_id: repliedMsg.sender_id,
              created_at: repliedMsg.created_at,
              message_type: (repliedMsg.message_type as 'text' | 'file' | 'image' | 'video' | undefined),
              file_url: repliedSignedUrl,
              file_name: repliedFileName,
              file_size: repliedMsg.file_size,
              sender: {
                username: 'Unknown',
                display_name: 'Unknown User',
                avatar_url: null
              },
              read_receipts: []
            };
          } catch (error) {
            console.log('Error loading replied-to message:', msg.replied_to_message_id);
          }
        }
        
        const message: Message = {
          id: msg.id,
          content: decryptedContent,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          message_type: (msg.message_type as 'text' | 'file' | 'image' | 'video') || 'text',
          file_url: signedUrl || null,
          file_name: fileName || null,
          file_size: msg.file_size || null,
          replied_to_message_id: msg.replied_to_message_id,
          sender: {
            username: senderProfile?.username || 'Unknown',
            display_name: senderProfile?.display_name || 'Unknown User',
            avatar_url: senderProfile?.avatar_url || null
          },
          read_receipts: [],
          replied_to_message: repliedToMessage
        };

        return message;
      }));
      
      setMessages(decryptedMessages);
      
      // Mark messages as read when viewing them
      if (user && conversationId) {
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;
    
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadUserWallpaper = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallpaper_url')
        .eq('id', user.id)
        .single();
      
      if (profile?.wallpaper_url) {
        setUserWallpaper(profile.wallpaper_url);
        // Cache for instant loading on future visits
        localStorage.setItem('rome-background-image', profile.wallpaper_url);
        // Preload image to ensure it's cached in browser
        const img = new Image();
        img.src = profile.wallpaper_url;
      }
    } catch (error) {
      console.log('No wallpaper found for user');
    }
  };

  // Generate a signed URL for private 'secure-files' bucket
  const getSignedUrlForSecureFiles = async (urlOrPath: string): Promise<string | null> => {
    try {
      let path = urlOrPath;
      if (urlOrPath.startsWith('http')) {
        const marker = '/secure-files/';
        const idx = urlOrPath.indexOf(marker);
        if (idx !== -1) {
          path = urlOrPath.substring(idx + marker.length);
        } else {
          return null;
        }
      }
      const { data, error } = await supabase
        .storage
        .from('secure-files')
        .createSignedUrl(path, 60 * 60);
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      return data?.signedUrl || null;
    } catch (e) {
      console.error('Signed URL generation failed:', e);
      return null;
    }
  };

  const refreshSignedUrlForMessage = async (messageId: string, currentUrl?: string) => {
    try {
      const signed = await getSignedUrlForSecureFiles(currentUrl || '');
      if (signed) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, file_url: signed } : m)));
      }
    } catch (e) {
      console.error('Failed to refresh signed URL for message', messageId, e);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;
    
    console.log('Setting up realtime subscription for conversation:', conversationId);
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received via realtime:', payload);
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads'
        },
        (payload) => {
          console.log('Message read receipt received via realtime:', payload);
          loadMessages(); // Reload to get updated read receipts
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !conversationId || !user) return;

    setIsUploading(true);
    try {
      let messageContent = newMessage;
      let messageType = 'text';
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      // Handle file upload if there are selected files
      if (selectedFiles.length > 0) {
        const file = selectedFiles[0].file; // Take first file for now
        const uploadedUrl = await uploadFile(file, 'secure-files', { silent: true });
        
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
          fileName = file.name;
          fileSize = file.size;
          messageType = 'file'; // Use 'file' for all file types as per database constraint
          // Keep the original message content if user typed something, otherwise use filename
          if (!newMessage.trim()) {
            messageContent = fileName;
          }
        }
      }

      // Military-grade encryption - messages are encrypted with conversation ID as password
      const { encryptionService } = await import('@/lib/encryption');
      const encryptedContent = await encryptionService.encryptMessage(messageContent, conversationId);
      
      // Encrypt file metadata if present
      let encryptedFileMetadata = null;
      if (fileUrl && fileName) {
        const fileMetadata = {
          file_url: fileUrl,
          file_name: fileName,
          content_type: selectedFiles[0]?.file.type || 'application/octet-stream'
        };
        encryptedFileMetadata = await encryptionService.encryptMessage(JSON.stringify(fileMetadata), conversationId);
      }
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          data_payload: encryptedContent,
          message_type: messageType,
          file_size: fileSize || null,
          encrypted_file_metadata: encryptedFileMetadata,
          replied_to_message_id: replyingTo?.id || null,
          sequence_number: Date.now()
        });

      if (error) throw error;
      
      // Clear form immediately for better UX
      setNewMessage('');
      setSelectedFiles([]);
      setReplyingTo(null);
      
      // Optimistic update - add message to UI immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID until real-time update
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        message_type: messageType as 'text' | 'file' | 'image' | 'video',
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        replied_to_message_id: replyingTo?.id || null,
        sender: {
          username: user.user_metadata?.username || 'You',
          display_name: user.user_metadata?.display_name || 'You',
          avatar_url: user.user_metadata?.avatar_url || null
        },
        read_receipts: [],
        replied_to_message: replyingTo || undefined
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle typing indicators
  const setTypingStatus = async (typing: boolean) => {
    if (!conversationId || !user) return;

    try {
      if (typing) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: true,
            updated_at: new Date().toISOString()
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Set typing status
    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus(false);
    }, 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FilePreview[] = [];
    
    Array.from(files).forEach(file => {
      // Check file size (800MB limit)
      if (file.size > 800 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 800MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      let type: 'image' | 'video' | 'file' = 'file';
      
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      }

      newFiles.push({ file, url, type });
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const deleteMessage = async (messageId: string, skipAnimation = false) => {
    try {
      // Get message details before deletion
      const messageToDelete = messages.find(msg => msg.id === messageId);
      
      // Delete from database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // If message had a file, delete it from storage too
      if (messageToDelete?.file_url) {
        try {
          // Extract file path from URL
          const urlParts = messageToDelete.file_url.split('/');
          const bucketName = urlParts[urlParts.length - 2];
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${bucketName}/${fileName}`;
          
          // Delete from storage
          await supabase.storage
            .from('secure-files')
            .remove([filePath]);

          // Delete from secure_files table if it exists
          await supabase
            .from('secure_files')
            .delete()
            .eq('file_path', filePath);
        } catch (fileError) {
          console.warn('Failed to delete associated file:', fileError);
        }
      }

      // Remove from local state
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      
      toast.success('Message deleted');
      setDeletingMessageId(null); // Reset the trigger state
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const decodeMessage = async (content: any, conversationId: string) => {
    try {
      let base64Payload = '';
      
      if (typeof content === 'string') {
        // Handle Postgres bytea returned as hex (e.g. "\\x...")
        base64Payload = content;
        if (content.startsWith('\\x')) {
          const hex = content.slice(2);
          const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) || []);
          // Bytes are ASCII of the base64 string we stored
          base64Payload = new TextDecoder().decode(bytes);
        }
      } else if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
        // Handle Buffer object from Supabase
        const bytes = new Uint8Array(content.data);
        base64Payload = new TextDecoder().decode(bytes);
      } else if (content && typeof content === 'object' && content.data) {
        // Handle other buffer-like objects
        const bytes = new Uint8Array(Object.values(content.data));
        base64Payload = new TextDecoder().decode(bytes);
      } else {
        return content || 'Empty message';
      }

      const { encryptionService } = await import('@/lib/encryption');
      try {
        // Try military-grade decryption first
        return await encryptionService.decryptMessage(base64Payload, conversationId);
      } catch (decryptError) {
        console.error('Decryption failed:', decryptError);
        // Fallback for legacy base64-only messages
        try {
          return atob(base64Payload);
        } catch {
          return 'Unable to decrypt message';
        }
      }
    } catch (error) {
      console.error('Message decoding error:', error);
      return 'Message decoding failed';
    }
  };

  const getFileExtFromUrl = (url?: string) => {
    if (!url) return '';
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1].toLowerCase() : '';
    } catch {
      const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      return match ? match[1].toLowerCase() : '';
    }
  };

  const makeDownloadUrl = (url: string, filename?: string) => {
    const sep = url.includes('?') ? '&' : '?';
    const dl = filename ? `download=${encodeURIComponent(filename)}` : 'download';
    return `${url}${sep}${dl}`;
  };

  const openMediaModal = (url: string, type: 'image' | 'video', fileName?: string, fileSize?: number) => {
    setMediaModal({
      isOpen: true,
      url,
      type,
      fileName,
      fileSize
    });
  };

  const closeMediaModal = () => {
    setMediaModal(prev => ({ ...prev, isOpen: false }));
  };

  if (!conversationId) {
    return (
      <div 
        className="flex-1 flex items-center justify-center bg-background relative"
        style={{
          backgroundImage: userWallpaper ? `url(${userWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: userWallpaper ? 'blur(1px)' : undefined
        }}
      >
        {userWallpaper && <div className="absolute inset-0 bg-black/20" style={{ filter: 'blur(0.5px)' }} />}
        <div className="text-center text-foreground relative z-10">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground text-sm md:text-base">Choose a conversation from the left to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden md:mt-0 mt-0 h-full md:h-auto md:min-h-0" style={{ height: 'calc(var(--app-vh) * 100)' }}>
      {/* Chat Header - floating on mobile with back button */}
      <div className="p-4 border-b border-border bg-card/50 md:relative fixed top-0 left-0 right-0 z-50 md:rounded-none rounded-b-3xl md:backdrop-blur-none backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          {onBackToMessages && (
            <Button
              onClick={onBackToMessages}
              variant="ghost"
              size="sm"
              className="md:hidden p-2 h-auto flex-shrink-0 hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {conversationDetails?.name || 'Secure Chat'}
            </h3>
            <p className="text-sm text-muted-foreground">End-to-end encrypted</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 relative custom-scrollbar md:mt-0 mt-16 sm:mt-18 md:mb-0 mb-20 sm:mb-24 safe-bottom"
        style={{
          backgroundImage: userWallpaper ? `url(${userWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: userWallpaper ? 'blur(0.5px)' : undefined
        }}
      >
        {userWallpaper && <div className="absolute inset-0 bg-black/10 pointer-events-none" style={{ filter: 'blur(1px)' }} />}
        {messages.length === 0 ? (
          hasLoadedMessages ? (
            <div className="text-center text-muted-foreground py-8 relative z-10">
              <div className="text-2xl mb-2">🔒</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="relative z-10 space-y-4">
              <div className="h-5 w-24 bg-card/30 rounded animate-pulse" />
              <div className="h-20 w-3/4 bg-card/20 rounded-2xl animate-pulse" />
              <div className="h-8 w-1/2 bg-card/20 rounded-2xl animate-pulse ml-auto" />
              <div className="h-14 w-2/3 bg-card/20 rounded-2xl animate-pulse" />
            </div>
          )
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`flex items-end gap-2 sm:gap-3 relative z-10 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for others */}
                        {message.sender_id !== user?.id && (
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg border border-border/50 flex-shrink-0">
                            <AvatarImage src={message.sender?.avatar_url || undefined} className="rounded-lg" />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">
                              {message.sender?.display_name?.[0] || 
                               message.sender?.username?.[0] || 
                               'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                
                <div className="flex flex-col max-w-[70%] sm:max-w-xs lg:max-w-md">
                  {/* Username for others */}
                      {message.sender_id !== user?.id && (
                        <p className="text-xs text-muted-foreground mb-1 px-1">
                          {message.sender?.display_name || 
                           message.sender?.username || 
                           'Unknown User'}
                        </p>
                      )}
                  
                  <div className="relative group">
                    <div
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl backdrop-blur-xl border-2 text-white ${
                        message.sender_id === user?.id
                          ? 'bg-primary/20 border-primary/20'
                          : 'bg-card/10 border-border/20'
                      } transition-all duration-300 hover:backdrop-blur-2xl group-hover:border-primary/40`}
                      style={{
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      }}
                    >
                      {/* Reply Preview */}
                      {message.replied_to_message && (
                        <div className="mb-2 border-l-2 border-white/30 pl-2">
                          <div className="text-xs text-white/60 mb-1">
                            Replying to {message.replied_to_message.sender?.display_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-white/80 bg-white/10 rounded-lg px-2 py-1 max-h-20 overflow-hidden">
                            {message.replied_to_message.file_url ? (
                              message.replied_to_message.message_type === 'file' && 
                              /(jpg|jpeg|png|gif|webp)$/i.test(message.replied_to_message.file_url) ? 
                                '📷 Photo' : 
                                message.replied_to_message.message_type === 'file' && 
                                /(mp4|webm|ogg|avi|mov)$/i.test(message.replied_to_message.file_url) ? 
                                  '🎥 Video' : 
                                  '📁 File'
                            ) : (
                              <span className="line-clamp-2">{message.replied_to_message.content}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {message.file_url ? (
                        <div className="space-y-2">
                          {(() => {
                            const extFromName = message.file_name?.split('.').pop()?.toLowerCase();
                            const ext = extFromName || getFileExtFromUrl(message.file_url || '');
                            const isImage = !!ext && /(jpg|jpeg|png|gif|webp|svg)$/i.test(ext);
                            const isVideo = !!ext && /(mp4|webm|ogg|avi|mov)$/i.test(ext);
                            const downloadHref = makeDownloadUrl(message.file_url!, message.file_name || undefined);

                            if (isImage) {
                              return (
                                <div className="space-y-2">
                                   <img 
                                     src={message.file_url!} 
                                     alt={message.file_name || 'Image'}
                                     className="max-w-full w-full rounded-lg max-h-64 object-cover cursor-pointer block"
                                     style={{ maxWidth: '100%', height: 'auto' }}
                                     onClick={() => openMediaModal(message.file_url!, 'image', message.file_name, message.file_size)}
                                     onError={() => { refreshSignedUrlForMessage(message.id, message.file_url); }}
                                   />
                                  <div className="flex gap-3 text-xs">
                                    <a href={downloadHref} target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white">
                                      Download
                                    </a>
                                  </div>
                                </div>
                              );
                            } else if (isVideo) {
                              return (
                                 <div className="space-y-2">
                                   <div 
                                     className="relative cursor-pointer"
                                     onClick={() => openMediaModal(message.file_url!, 'video', message.file_name, message.file_size)}
                                   >
                                     <video 
                                       src={message.file_url!}
                                       className="max-w-full w-full rounded-lg max-h-64 block pointer-events-none"
                                       style={{ maxWidth: '100%', height: 'auto' }}
                                       onError={() => { refreshSignedUrlForMessage(message.id, message.file_url); }}
                                     />
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                       <div className="bg-white/90 rounded-full p-2">
                                         <Video className="h-6 w-6 text-black" />
                                       </div>
                                     </div>
                                   </div>
                                  <div className="flex gap-3 text-xs">
                                    <a href={downloadHref} target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white">
                                      Download
                                    </a>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-2 p-2 bg-background/20 rounded-lg">
                                  <File className="h-8 w-8 text-white/80" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">File</p>
                                    <p className="text-xs text-white/70">
                                      {message.file_size ? (message.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'Attachment'}
                                    </p>
                                  </div>
                                  <a 
                                    href={downloadHref} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs underline text-white/80 hover:text-white"
                                  >
                                    Download
                                  </a>
                                </div>
                              );
                            }
                          })()}
                          {/* Show caption if not equal to filename */}
                          {message.content && message.content.trim() && message.content !== message.file_name && (
                            <pre className="text-sm leading-relaxed break-words whitespace-pre-wrap font-sans">{message.content}</pre>
                          )}
                        </div>
                      ) : (
                        <pre className="text-sm leading-relaxed break-words whitespace-pre-wrap font-sans">{message.content}</pre>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        
                        {/* Read receipts for sent messages */}
                        {message.sender_id === user?.id && message.read_receipts && message.read_receipts.length > 0 && (
                          <div className="flex -space-x-1">
                            {message.read_receipts.slice(0, 3).map((read, index) => (
                              <Avatar key={read.user_id} className="h-4 w-4 rounded-full border border-background/50">
                                <AvatarImage src={read.profile?.avatar_url} className="rounded-full" />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-full">
                                  {read.profile?.display_name?.[0] || read.profile?.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {message.read_receipts.length > 3 && (
                              <div className="h-4 w-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center border border-background/50">
                                +{message.read_receipts.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete message dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0 rounded-full backdrop-blur-sm border border-border/30 hover:bg-background/40 ${
                            message.sender_id === user?.id ? 'right-1' : 'left-1'
                          }`}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="backdrop-blur-xl bg-card/80 border-border/30">
                        <DropdownMenuItem
                          onClick={() => setReplyingTo(message)}
                          className="hover:bg-primary/10"
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        {/* Only show delete option for messages sent by current user */}
                        {message.sender_id === user?.id && (
                          <ThanosSnapEffect
                            onAnimationComplete={() => deleteMessage(message.id, true)}
                            trigger={deletingMessageId === message.id}
                          >
                            <DropdownMenuItem
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onSelect={(e) => {
                                e.preventDefault();
                                setDeletingMessageId(message.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Message
                            </DropdownMenuItem>
                          </ThanosSnapEffect>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Avatar for current user */}
                {message.sender_id === user?.id && (
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg border border-border/50 flex-shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || undefined} className="rounded-lg" />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">
                      {message.sender?.display_name?.[0] || 
                       message.sender?.username?.[0] || 
                       'Y'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        {user?.id && (
          <TypingIndicator conversationId={conversationId} currentUserId={user.id} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - floating on mobile */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/50 backdrop-blur-xl md:relative md:bottom-auto md:left-auto md:right-auto fixed bottom-0 left-0 right-0 z-50 md:rounded-none rounded-t-3xl md:w-auto w-full min-h-16">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  Replying to {replyingTo.sender?.display_name || 'Unknown'}
                </div>
                <div className="text-sm text-foreground bg-muted/50 rounded-lg px-2 py-1 max-h-16 overflow-hidden border-l-2 border-primary pl-3">
                  {replyingTo.file_url ? (
                    replyingTo.message_type === 'file' && 
                    /(jpg|jpeg|png|gif|webp)$/i.test(replyingTo.file_url) ? 
                      '📷 Photo' : 
                      replyingTo.message_type === 'file' && 
                      /(mp4|webm|ogg|avi|mov)$/i.test(replyingTo.file_url) ? 
                        '🎥 Video' : 
                        '📁 File'
                  ) : (
                    <span className="line-clamp-2">{replyingTo.content}</span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setReplyingTo(null)}
                size="sm"
                variant="ghost"
                className="p-1 h-auto ml-2 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* File Previews */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {selectedFiles.map((filePreview, index) => (
              <div
                key={index}
                className="relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-2 max-w-24 sm:max-w-32"
              >
                <Button
                  onClick={() => removeFile(index)}
                  size="sm"
                  variant="ghost"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </Button>
                
                {filePreview.type === 'image' ? (
                  <img
                    src={filePreview.url}
                    alt="Preview"
                    className="w-full h-16 sm:h-20 object-cover rounded-lg"
                  />
                ) : filePreview.type === 'video' ? (
                  <div className="w-full h-16 sm:h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-16 sm:h-20 bg-muted rounded-lg flex items-center justify-center">
                    <File className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                
                <p className="text-xs text-center mt-1 truncate">
                  {filePreview.file.name}
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,*/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="ghost"
            className="p-2 h-auto flex-shrink-0 hover:bg-primary/10"
            disabled={isUploading}
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          <div className="flex-1 bg-background/50 backdrop-blur-sm border border-border rounded-xl p-2">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a secure message..."
              className="w-full bg-transparent resize-none text-foreground placeholder-muted-foreground focus:outline-none text-sm leading-relaxed min-h-[20px] max-h-32"
              rows={1}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.3) transparent'
              }}
            />
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}
            size="sm"
            className="p-2 h-auto flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <MediaModal
        isOpen={mediaModal.isOpen}
        onClose={closeMediaModal}
        mediaUrl={mediaModal.url}
        mediaType={mediaModal.type}
        fileName={mediaModal.fileName}
        fileSize={mediaModal.fileSize}
      />
    </div>
  );
};