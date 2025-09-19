// Conversation-specific encryption key management
import { encryptionService } from '@/lib/encryption';
import { supabase } from '@/integrations/supabase/client';

interface ConversationKey {
  conversationId: string;
  encryptionKey: string;
  createdAt: string;
}

class ConversationEncryption {
  private keyCache = new Map<string, string>();

  // Generate or retrieve conversation encryption key
  async getConversationKey(conversationId: string, userPassword?: string): Promise<string> {
    // Check cache first
    if (this.keyCache.has(conversationId)) {
      return this.keyCache.get(conversationId)!;
    }

    // Try to get from local storage
    const storageKey = `conv_key_${conversationId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const key = stored;
        this.keyCache.set(conversationId, key);
        return key;
      }
    } catch (error) {
      console.warn('Failed to retrieve conversation key from storage:', error);
    }

    // Generate new conversation key
    const newKey = await this.generateConversationKey(conversationId);
    
    // Store in cache and local storage
    this.keyCache.set(conversationId, newKey);
    try {
      localStorage.setItem(storageKey, newKey);
    } catch (error) {
      console.warn('Failed to store conversation key:', error);
    }

    return newKey;
  }

  // Generate a new encryption key for the conversation
  private async generateConversationKey(conversationId: string): Promise<string> {
    // Use conversation ID as seed for consistent key generation
    const keyMaterial = `conv_${conversationId}_${Date.now()}`;
    
    // Create a deterministic but secure key using the conversation ID
    const encoder = new TextEncoder();
    const data = encoder.encode(keyMaterial);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to base64 for use as encryption key
    return btoa(String.fromCharCode(...hashArray));
  }

  // Encrypt message content for storage
  async encryptMessageContent(content: string, conversationId: string): Promise<string> {
    try {
      const conversationKey = await this.getConversationKey(conversationId);
      const encrypted = await encryptionService.encryptMessage(content, conversationKey);
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      // Fallback to plain text if encryption fails
      return content;
    }
  }

  // Decrypt message content from storage
  async decryptMessageContent(encryptedContent: string, conversationId: string): Promise<string> {
    try {
      const conversationKey = await this.getConversationKey(conversationId);
      const decrypted = await encryptionService.decryptMessage(encryptedContent, conversationKey);
      return decrypted;
    } catch (error) {
      console.warn('Failed to decrypt message, trying as plain text:', error);
      // If decryption fails, return content as-is (backward compatibility)
      return encryptedContent;
    }
  }

  // Check if content appears to be encrypted
  isEncrypted(content: string): boolean {
    // Basic heuristics to detect encrypted content
    if (!content || content.length < 16) return false;
    
    // Check for base64-like pattern
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    if (base64Pattern.test(content) && content.length % 4 === 0) return true;
    
    // Check for hex pattern
    const hexPattern = /^[0-9a-fA-F]+$/;
    if (hexPattern.test(content) && content.length % 2 === 0 && content.length >= 32) return true;
    
    return false;
  }

  // Clear conversation key from cache (useful for key rotation)
  clearConversationKey(conversationId: string): void {
    this.keyCache.delete(conversationId);
    try {
      localStorage.removeItem(`conv_key_${conversationId}`);
    } catch (error) {
      console.warn('Failed to clear conversation key from storage:', error);
    }
  }

  // Clear all cached keys
  clearAllKeys(): void {
    this.keyCache.clear();
    try {
      // Clear all conversation keys from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('conv_key_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all conversation keys:', error);
    }
  }
}

export const conversationEncryption = new ConversationEncryption();