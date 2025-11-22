/**
 * Utility for exporting conversation history with military-grade encryption
 */

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: 'text' | 'file' | 'image' | 'video';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  is_anonymous?: boolean;
  anonymous_id?: string;
}

interface ConversationDetails {
  name?: string;
  type: 'direct' | 'group';
  created_at?: string;
}

/**
 * Formats messages for export
 */
export const formatMessagesForExport = (
  messages: Message[],
  conversationDetails: ConversationDetails,
  currentUserId: string
): string => {
  const header = `ROME Secure Conversation Export
=====================================
Conversation: ${conversationDetails.name || 'Unknown'}
Type: ${conversationDetails.type}
Exported: ${new Date().toLocaleString()}
Total Messages: ${messages.length}
=====================================

`;

  const formattedMessages = messages.map((msg) => {
    const timestamp = new Date(msg.created_at).toLocaleString();
    const senderName = msg.is_anonymous
      ? msg.anonymous_id || 'Anonymous'
      : msg.sender?.display_name || msg.sender?.username || 'Unknown';
    const isMe = msg.sender_id === currentUserId;
    const prefix = isMe ? 'You' : senderName;
    
    let content = '';
    
    switch (msg.message_type) {
      case 'image':
        content = `[Image: ${msg.file_name || 'image'}]\n${msg.file_url || ''}`;
        break;
      case 'video':
        content = `[Video: ${msg.file_name || 'video'}]\n${msg.file_url || ''}`;
        break;
      case 'file':
        content = `[File: ${msg.file_name || 'file'} (${formatFileSize(msg.file_size || 0)})]\n${msg.file_url || ''}`;
        break;
      default:
        content = msg.content;
    }
    
    return `[${timestamp}] ${prefix}: ${content}`;
  }).join('\n\n');

  return header + formattedMessages;
};

/**
 * Formats file size in human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Exports messages as encrypted JSON
 */
export const formatMessagesAsEncryptedJSON = async (
  messages: Message[],
  conversationDetails: ConversationDetails,
  userId: string
): Promise<string> => {
  const { encryptionService } = await import('./encryption');
  
  const exportData = {
    conversation: conversationDetails,
    messages: messages,
    exported_at: new Date().toISOString(),
    exported_by: userId,
    version: '1.0'
  };
  
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Encrypt the entire export with user-specific password
  const encryptionPassword = `export_${userId}_${Date.now()}`;
  const encrypted = await encryptionService.encryptMessage(jsonData, encryptionPassword);
  
  return JSON.stringify({
    encrypted: true,
    data: encrypted,
    info: 'This is an encrypted ROME conversation export. To decrypt, you need the encryption key.',
    timestamp: new Date().toISOString()
  }, null, 2);
};

/**
 * Downloads conversation as a text file
 */
export const downloadConversation = (
  messages: Message[],
  conversationDetails: ConversationDetails,
  currentUserId: string,
  format: 'txt' | 'json' = 'txt'
) => {
  const conversationName = conversationDetails.name || 'conversation';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ROME_${conversationName}_${timestamp}.${format}`;
  
  let content: string;
  
  if (format === 'txt') {
    content = formatMessagesForExport(messages, conversationDetails, currentUserId);
  } else {
    content = JSON.stringify({
      conversation: conversationDetails,
      messages: messages,
      exported_at: new Date().toISOString(),
      exported_by: currentUserId,
      version: '1.0'
    }, null, 2);
  }
  
  const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads conversation as encrypted file
 */
export const downloadEncryptedConversation = async (
  messages: Message[],
  conversationDetails: ConversationDetails,
  currentUserId: string
) => {
  const conversationName = conversationDetails.name || 'conversation';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ROME_${conversationName}_${timestamp}.encrypted.json`;
  
  const content = await formatMessagesAsEncryptedJSON(messages, conversationDetails, currentUserId);
  
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
