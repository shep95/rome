/**
 * Client-side encryption utilities for zero-knowledge architecture
 * All encryption/decryption happens on the client - server never sees plaintext
 */

class EncryptionService {
  private static instance: EncryptionService;
  private cryptoKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Derives an encryption key from a password using PBKDF2
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a cryptographically secure random salt
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generates a random initialization vector for AES-GCM
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Encrypts data using AES-GCM with a user-provided password
   */
  async encryptWithPassword(
    data: string, 
    password: string
  ): Promise<{ encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const salt = this.generateSalt();
    const iv = this.generateIV();
    
    const key = await this.deriveKeyFromPassword(password, salt);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );

    return {
      encryptedData: new Uint8Array(encryptedData),
      salt,
      iv
    };
  }

  /**
   * Decrypts data using AES-GCM with a user-provided password
   */
  async decryptWithPassword(
    encryptedData: Uint8Array,
    salt: Uint8Array,
    iv: Uint8Array,
    password: string
  ): Promise<string> {
    const key = await this.deriveKeyFromPassword(password, salt);
    
    try {
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }

  /**
   * Converts encrypted data to base64 for database storage
   */
  encryptedDataToBase64(encryptedData: Uint8Array, salt: Uint8Array, iv: Uint8Array): string {
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedData, salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Parses base64 encrypted data from database
   */
  base64ToEncryptedData(base64Data: string): { encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array } {
    const combined = new Uint8Array(
      atob(base64Data).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);
    
    return { encryptedData, salt, iv };
  }

  /**
   * Encrypts a message for storage (used by messaging system)
   */
  async encryptMessage(message: string, password: string): Promise<string> {
    const { encryptedData, salt, iv } = await this.encryptWithPassword(message, password);
    return this.encryptedDataToBase64(encryptedData, salt, iv);
  }

  /**
   * Decrypts a message from storage (used by messaging system)
   */
  async decryptMessage(encryptedBase64: string, password: string): Promise<string> {
    const { encryptedData, salt, iv } = this.base64ToEncryptedData(encryptedBase64);
    return this.decryptWithPassword(encryptedData, salt, iv, password);
  }

  /**
   * Generates a secure random password for conversation-based encryption
   */
  generateSecurePassword(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Hashes a password for verification without storing the actual password
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }
}

export const encryptionService = EncryptionService.getInstance();