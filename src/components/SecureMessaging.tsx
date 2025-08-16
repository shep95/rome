import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X, File, Image as ImageIcon, Video, Trash2, MoreVertical, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: 'text' | 'file' | 'image' | 'video';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
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
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
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
    if (!conversationId) return;
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // In a real app, you'd decrypt messages here
      const decryptedMessages = await Promise.all((messagesData || []).map(async (msg) => {
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
        
        // Prepare signed URL for secure-files if needed
        let fileUrl: string | undefined = (msg.file_url as string | undefined) || undefined;
        if (fileUrl && fileUrl.includes('/secure-files/')) {
          const signed = await getSignedUrlForSecureFiles(fileUrl);
          if (signed) fileUrl = signed;
        }

        return {
          id: msg.id,
          content: await decodeMessage(msg.data_payload, conversationId), // Updated column name
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          message_type: (msg.message_type as 'text' | 'file' | 'image' | 'video' | undefined),
          file_url: fileUrl,
          file_name: (msg.file_name as string | undefined) || undefined,
          file_size: (msg.file_size as number | undefined) || undefined,
          sender_profile: senderProfile
        };
      }));
      
      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
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

      // Use proper encryption - messages are encrypted with conversation ID as password
      const { encryptionService } = await import('@/lib/encryption');
      const encryptedContent = await encryptionService.encryptMessage(messageContent, conversationId);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          data_payload: encryptedContent, // Updated column name
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          sequence_number: Date.now()
        });

      if (error) throw error;
      
      setNewMessage('');
      setSelectedFiles([]);
      
      // Force reload messages after a short delay to ensure the new message appears
      setTimeout(() => {
        loadMessages();
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
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

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      // Reload messages to reflect the deletion
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const decodeMessage = async (content: any, conversationId: string) => {
    try {
      if (typeof content === 'string') {
        const { encryptionService } = await import('@/lib/encryption');
        try {
          return await encryptionService.decryptMessage(content, conversationId);
        } catch (decryptError) {
          // Fallback for old base64 encoded messages
          return atob(content);
        }
      }
      return content;
    } catch (error) {
      return content;
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
        className="flex-1 overflow-y-auto p-4 space-y-4 relative custom-scrollbar md:mt-0 mt-20 md:mb-0 mb-24"
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
                className={`flex items-end gap-2 sm:gap-3 relative z-10 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for others */}
                {message.sender_id !== user?.id && (
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg border border-border/50 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatar_url} className="rounded-lg" />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">
                      {message.sender_profile?.display_name?.[0] || 
                       message.sender_profile?.username?.[0] || 
                       'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex flex-col max-w-[70%] sm:max-w-xs lg:max-w-md">
                  {/* Username for others */}
                  {message.sender_id !== user?.id && (
                    <p className="text-xs text-muted-foreground mb-1 px-1">
                      {message.sender_profile?.display_name || 
                       message.sender_profile?.username || 
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
                                    onClick={() => window.open(message.file_url!, '_blank')}
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
                                  <video 
                                    src={message.file_url!}
                                    controls
                                    className="max-w-full w-full rounded-lg max-h-64 block"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                    onError={() => { refreshSignedUrlForMessage(message.id, message.file_url); }}
                                  />
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
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      )}
                      
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
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
                          onClick={() => deleteMessage(message.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Avatar for current user */}
                {message.sender_id === user?.id && (
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg border border-border/50 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatar_url} className="rounded-lg" />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">
                      {message.sender_profile?.display_name?.[0] || 
                       message.sender_profile?.username?.[0] || 
                       'Y'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - floating on mobile */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/50 backdrop-blur-xl md:relative md:bottom-auto md:left-auto md:right-auto fixed bottom-0 left-0 right-0 z-50 md:rounded-none rounded-t-3xl md:w-auto w-full min-h-16">
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
              onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
};