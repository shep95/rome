/**
 * Military-grade encryption utilities for secure communications
 * Uses single AEAD (AES-GCM) with proper random IV per operation
 * Zero-knowledge architecture - no plaintext ever stored on servers
 */

class MilitaryEncryption {
  private static instance: MilitaryEncryption;
  private cryptoKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): MilitaryEncryption {
    if (!MilitaryEncryption.instance) {
      MilitaryEncryption.instance = new MilitaryEncryption();
    }
    return MilitaryEncryption.instance;
  }

  /**
   * Secure key derivation using PBKDF2 with 100,000 iterations
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
        iterations: 100000, // Secure iteration count
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates cryptographically secure random salt (32 bytes)
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * Generates a fresh random initialization vector for AES-GCM
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Secure AES-256-GCM encryption with fresh IV per operation
   */
  async encryptWithPassword(
    data: string,
    password: string
  ): Promise<{ encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    
    // Generate unique salt and IV for this operation
    const salt = this.generateSalt();
    const iv = this.generateIV(); // Fresh IV per operation
    
    // Derive key from password and salt
    const key = await this.deriveKeyFromPassword(password, salt);
    
    // Single AES-GCM encryption (AEAD provides integrity and confidentiality)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    return {
      encryptedData: new Uint8Array(encrypted),
      salt,
      iv
    };
  }

  /**
   * Secure AES-256-GCM decryption
   */
  async decryptWithPassword(
    encryptedData: Uint8Array,
    salt: Uint8Array,
    iv: Uint8Array,
    password: string
  ): Promise<string> {
    // Derive the same key from password and salt
    const key = await this.deriveKeyFromPassword(password, salt);
    
    try {
      // Single AES-GCM decryption
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed - invalid credentials or compromised data');
    }
  }

  /**
   * Converts encrypted data to secure base64 storage format
   */
  encryptedDataToBase64(encryptedData: Uint8Array, salt: Uint8Array, iv: Uint8Array): string {
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedData, salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Parses encrypted data from secure storage
   */
  base64ToEncryptedData(base64Data: string): { encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array } {
    const combined = new Uint8Array(
      atob(base64Data).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, 32); // 32 bytes for single salt
    const iv = combined.slice(32, 44); // 12 bytes for IV
    const encryptedData = combined.slice(44);
    
    return { encryptedData, salt, iv };
  }

  /**
   * Encrypts a message with military-grade security for storage
   */
  async encryptMessage(message: string, password: string): Promise<string> {
    const { encryptedData, salt, iv } = await this.encryptWithPassword(message, password);
    return this.encryptedDataToBase64(encryptedData, salt, iv);
  }

  /**
   * Decrypts a message from secure storage
   */
  async decryptMessage(encryptedBase64: string, password: string): Promise<string> {
    const { encryptedData, salt, iv } = this.base64ToEncryptedData(encryptedBase64);
    return this.decryptWithPassword(encryptedData, salt, iv, password);
  }

  /**
   * Generates cryptographically secure random password for conversation encryption
   */
  generateSecurePassword(): string {
    const array = new Uint8Array(64); // Increased to 64 bytes for military-grade strength
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * SHA-512 password hashing for verification
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data); // Military-grade hashing
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }
}

export const encryptionService = MilitaryEncryption.getInstance();