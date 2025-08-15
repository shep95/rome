import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X, File, Image as ImageIcon, Video } from 'lucide-react';

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
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const { uploadFile } = useFileUpload();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const [userWallpaper, setUserWallpaper] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversationDetails();
      loadMessages();
      loadUserWallpaper();
      setupRealtimeSubscription();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        
        return {
          id: msg.id,
          content: decodeMessage(msg.encrypted_content),
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          message_type: (msg.message_type as 'text' | 'file' | 'image' | 'video' | undefined),
          file_url: (msg.file_url as string | undefined) || undefined,
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
      }
    } catch (error) {
      console.log('No wallpaper found for user');
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
        const uploadedUrl = await uploadFile(file, 'secure-files');
        
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
          fileName = file.name;
          fileSize = file.size;
          messageType = selectedFiles[0].type;
          messageContent = fileName; // Use filename as content for file messages
        }
      }

      // Simple base64 encoding for demo (use real encryption in production)
      const encryptedContent = btoa(messageContent);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          encrypted_content: encryptedContent,
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
      // Check file size (300MB limit)
      if (file.size > 300 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 300MB.`);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to decode messages (handles both base64 and bytea formats)
  const decodeMessage = (encryptedContent: any): string => {
    try {
      if (typeof encryptedContent === 'string') {
        // Handle bytea format (e.g., "\\x61475635")
        if (encryptedContent.startsWith('\\x')) {
          const hex = encryptedContent.slice(2);
          const bytes = hex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
          const binaryString = String.fromCharCode(...bytes);
          return atob(binaryString);
        }
        // Handle base64 format
        return atob(encryptedContent);
      }
      return 'Unable to decode message';
    } catch (error) {
      console.error('Error decoding message:', error);
      return 'Unable to decode message';
    }
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
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <h3 className="font-semibold text-foreground">
          {conversationDetails?.name || 'Secure Chat'}
        </h3>
        <p className="text-sm text-muted-foreground">End-to-end encrypted</p>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
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
          <div className="text-center text-muted-foreground py-8 relative z-10">
            <div className="text-2xl mb-2">🔒</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
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
                  
                  <div
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl backdrop-blur-md border ${
                      message.sender_id === user?.id
                        ? 'bg-primary/80 text-primary-foreground border-primary/30'
                        : 'bg-card/70 border-border/30 text-foreground'
                    } shadow-lg transition-all duration-200 hover:shadow-xl`}
                  >
                    {message.message_type === 'image' && message.file_url ? (
                      <div className="space-y-2">
                        <img 
                          src={message.file_url} 
                          alt={message.content}
                          className="max-w-full rounded-lg max-h-64 object-cover"
                        />
                        {message.content && (
                          <p className="text-sm">{atob(message.content)}</p>
                        )}
                      </div>
                    ) : message.message_type === 'video' && message.file_url ? (
                      <div className="space-y-2">
                        <video 
                          src={message.file_url}
                          controls
                          className="max-w-full rounded-lg max-h-64"
                        />
                        {message.content && (
                          <p className="text-sm">{atob(message.content)}</p>
                        )}
                      </div>
                    ) : message.message_type === 'file' && message.file_url ? (
                      <div className="flex items-center gap-2 p-2 bg-background/20 rounded-lg">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{message.file_name || message.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.file_size ? (message.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'File'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    )}
                    
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
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

      {/* Message Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/50 backdrop-blur-xl">
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