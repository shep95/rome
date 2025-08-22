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
   * Secure key derivation using PBKDF2 with 250,000 iterations (enhanced from 100k)
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
        iterations: 250000, // Enhanced iteration count for military-grade security
        hash: 'SHA-512' // Upgraded from SHA-256 to SHA-512
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
   * Secure AES-256-GCM encryption with fresh IV per operation and HMAC authentication
   */
  async encryptWithPassword(
    data: string,
    password: string
  ): Promise<{ encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array; hmac: Uint8Array }> {
    const encoder = new TextEncoder();
    
    // Generate unique salt and IV for this operation
    const salt = this.generateSalt();
    const iv = this.generateIV(); // Fresh IV per operation
    
    // Derive encryption key from password and salt
    const encryptionKey = await this.deriveKeyFromPassword(password, salt);
    
    // Derive separate HMAC key for authentication
    const hmacKey = await this.deriveHMACKey(password, salt);
    
    // AES-GCM encryption (AEAD provides integrity and confidentiality)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      encoder.encode(data)
    );

    const encryptedData = new Uint8Array(encrypted);
    
    // Additional HMAC for extra authentication layer
    const hmacData = new Uint8Array(salt.length + iv.length + encryptedData.length);
    hmacData.set(salt, 0);
    hmacData.set(iv, salt.length);
    hmacData.set(encryptedData, salt.length + iv.length);
    
    const hmacSignature = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      hmacData
    );

    return {
      encryptedData,
      salt,
      iv,
      hmac: new Uint8Array(hmacSignature)
    };
  }

  /**
   * Secure AES-256-GCM decryption with HMAC verification
   */
  async decryptWithPassword(
    encryptedData: Uint8Array,
    salt: Uint8Array,
    iv: Uint8Array,
    hmac: Uint8Array,
    password: string
  ): Promise<string> {
    // Derive the same keys from password and salt
    const encryptionKey = await this.deriveKeyFromPassword(password, salt);
    const hmacKey = await this.deriveHMACKey(password, salt);
    
    try {
      // Verify HMAC first to detect tampering
      const hmacData = new Uint8Array(salt.length + iv.length + encryptedData.length);
      hmacData.set(salt, 0);
      hmacData.set(iv, salt.length);
      hmacData.set(encryptedData, salt.length + iv.length);
      
      const isValid = await crypto.subtle.verify(
        'HMAC',
        hmacKey,
        hmac,
        hmacData
      );

      if (!isValid) {
        throw new Error('HMAC verification failed - data may have been tampered with');
      }

      // Decrypt after successful authentication
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      if (error instanceof Error && error.message.includes('HMAC')) {
        throw error;
      }
      throw new Error('Decryption failed - invalid credentials or compromised data');
    }
  }

  /**
   * Derive HMAC key for message authentication
   */
  private async deriveHMACKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password + ':hmac'), // Domain separation
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-512'
      },
      passwordKey,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign', 'verify']
    );
  }

  /**
   * Converts encrypted data to secure base64 storage format with HMAC
   */
  encryptedDataToBase64(encryptedData: Uint8Array, salt: Uint8Array, iv: Uint8Array, hmac: Uint8Array): string {
    const combined = new Uint8Array(salt.length + iv.length + hmac.length + encryptedData.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(hmac, salt.length + iv.length);
    combined.set(encryptedData, salt.length + iv.length + hmac.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Parses encrypted data from secure storage with HMAC
   */
  base64ToEncryptedData(base64Data: string): { encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array; hmac: Uint8Array } {
    const combined = new Uint8Array(
      atob(base64Data).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, 32); // 32 bytes for salt
    const iv = combined.slice(32, 44); // 12 bytes for IV
    const hmac = combined.slice(44, 108); // 64 bytes for SHA-512 HMAC
    const encryptedData = combined.slice(108);
    
    return { encryptedData, salt, iv, hmac };
  }

  /**
   * Encrypts a message with military-grade security for storage
   */
  async encryptMessage(message: string, password: string): Promise<string> {
    const { encryptedData, salt, iv, hmac } = await this.encryptWithPassword(message, password);
    return this.encryptedDataToBase64(encryptedData, salt, iv, hmac);
  }

  /**
   * Decrypts a message from secure storage
   */
  async decryptMessage(encryptedBase64: string, password: string): Promise<string> {
    const { encryptedData, salt, iv, hmac } = this.base64ToEncryptedData(encryptedBase64);
    return this.decryptWithPassword(encryptedData, salt, iv, hmac, password);
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
   * Enhanced password hashing with salt for verification
   */
  async hashPassword(password: string, providedSalt?: Uint8Array): Promise<{ hash: string; salt: Uint8Array }> {
    const encoder = new TextEncoder();
    const salt = providedSalt || this.generateSalt();
    
    // Use PBKDF2 for password hashing instead of simple SHA-512
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-512'
      },
      passwordKey,
      512 // 64 bytes
    );

    const hashArray = new Uint8Array(hashBits);
    return {
      hash: btoa(String.fromCharCode(...hashArray)),
      salt
    };
  }

  /**
   * Verify password against stored hash
   */
  async verifyPassword(password: string, storedHash: string, salt: Uint8Array): Promise<boolean> {
    const { hash } = await this.hashPassword(password, salt);
    return hash === storedHash;
  }

  /**
   * Generate secure session token for temporary authentication
   */
  async generateSessionToken(): Promise<string> {
    const tokenBytes = crypto.getRandomValues(new Uint8Array(64));
    const timestamp = Date.now();
    const timestampBytes = new Uint8Array(8);
    new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(timestamp), false);
    
    const combined = new Uint8Array(tokenBytes.length + timestampBytes.length);
    combined.set(tokenBytes, 0);
    combined.set(timestampBytes, tokenBytes.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Secure memory cleanup (attempt to overwrite sensitive data)
   */
  secureCleanup(...arrays: Uint8Array[]) {
    arrays.forEach(arr => {
      if (arr) {
        crypto.getRandomValues(arr); // Overwrite with random data
        arr.fill(0); // Then zero out
      }
    });
  }
}

export const encryptionService = MilitaryEncryption.getInstance();