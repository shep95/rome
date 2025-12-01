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

export const nomadStorage = {
  // Check if user prefers cloud storage
  isCloudSyncEnabled(): boolean {
    return localStorage.getItem('nomad-cloud-sync-enabled') === 'true';
  },

  // Enable/disable cloud sync
  setCloudSyncEnabled(enabled: boolean): void {
    localStorage.setItem('nomad-cloud-sync-enabled', enabled ? 'true' : 'false');
  },

  // Get all conversations (from localStorage for now, cloud loading handled separately)
  getConversations(): NomadConversation[] {
    try {
      const stored = localStorage.getItem('nomad-conversations');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  },

  // Get current conversation ID
  getCurrentConversationId(): string | null {
    return localStorage.getItem('nomad-current-conversation-id');
  },

  // Set current conversation ID
  setCurrentConversationId(id: string): void {
    localStorage.setItem('nomad-current-conversation-id', id);
  },

  // Create new conversation
  createConversation(): string {
    const id = `nomad-${Date.now()}`;
    const conversations = this.getConversations();
    
    const newConversation: NomadConversation = {
      id,
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date().toISOString(),
    };

    conversations.push(newConversation);
    localStorage.setItem('nomad-conversations', JSON.stringify(conversations));
    this.setCurrentConversationId(id);
    
    return id;
  },

  // Update conversation
  updateConversation(id: string, updates: Partial<NomadConversation>): void {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === id);
    
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates };
      localStorage.setItem('nomad-conversations', JSON.stringify(conversations));
    }
  },

  // Delete conversation
  deleteConversation(id: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem('nomad-conversations', JSON.stringify(filtered));
    localStorage.removeItem(`nomad-conversation-${id}`);
  },

  // Get messages for a conversation
  getMessages(conversationId: string): Message[] {
    try {
      const stored = localStorage.getItem(`nomad-conversation-${conversationId}`);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  // Save messages for a conversation
  saveMessages(conversationId: string, messages: Message[]): void {
    localStorage.setItem(`nomad-conversation-${conversationId}`, JSON.stringify(messages));
    
    // Update conversation metadata
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const title = this.generateTitle(messages);
      
      this.updateConversation(conversationId, {
        lastMessage: lastMsg.content.slice(0, 50),
        timestamp: lastMsg.created_at,
        title,
      });
    }
  },

  // Generate conversation title from first user message
  generateTitle(messages: Message[]): string {
    const firstUserMsg = messages.find(m => m.sender_id !== 'nomad-ai');
    if (firstUserMsg) {
      // Take first 40 chars or up to first newline
      const content = firstUserMsg.content.split('\n')[0];
      return content.length > 40 ? content.slice(0, 40) + '...' : content;
    }
    return 'New Chat';
  },

  // Migrate old single conversation to new format
  migrateOldMessages(): void {
    const oldMessages = localStorage.getItem('nomad-messages');
    if (oldMessages) {
      try {
        const messages = JSON.parse(oldMessages);
        if (messages.length > 0) {
          const id = this.createConversation();
          this.saveMessages(id, messages);
          localStorage.removeItem('nomad-messages');
          console.log('Migrated old NOMAD messages to new format');
        }
      } catch (error) {
        console.error('Error migrating old messages:', error);
      }
    }
  },
};
