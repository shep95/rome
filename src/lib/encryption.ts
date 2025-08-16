/**
 * Military-grade encryption utilities for secure communications
 * Triple-layer AES-256 encryption with advanced key derivation
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
   * Military-grade key derivation using PBKDF2 with 500,000 iterations
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
        iterations: 500000, // Military-grade iteration count
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates cryptographically secure random salt (32 bytes for maximum security)
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32)); // Military-grade salt size
  }

  /**
   * Generates a random initialization vector for AES-GCM
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Triple-layer AES-256-GCM encryption for maximum security
   */
  async encryptWithPassword(
    data: string,
    password: string
  ): Promise<{ encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    
    // Layer 1: Add random padding to obscure data patterns
    const paddedData = data + Array(Math.floor(Math.random() * 100) + 50).fill(0).map(() => 
      String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('');
    
    // Layer 2: Triple encryption with different keys
    const salt1 = this.generateSalt();
    const salt2 = this.generateSalt();
    const salt3 = this.generateSalt();
    const iv = this.generateIV();
    
    
    // Generate three different encryption keys
    const key1 = await this.deriveKeyFromPassword(password + '_layer1', salt1);
    const key2 = await this.deriveKeyFromPassword(password + '_layer2', salt2);
    const key3 = await this.deriveKeyFromPassword(password + '_layer3', salt3);
    
    // Triple encryption
    let encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, encoder.encode(paddedData));
    encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, new Uint8Array(encrypted));
    encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key3, new Uint8Array(encrypted));

    // Combine all salts for storage
    const combinedSalt = new Uint8Array(salt1.length + salt2.length + salt3.length);
    combinedSalt.set(salt1, 0);
    combinedSalt.set(salt2, salt1.length);
    combinedSalt.set(salt3, salt1.length + salt2.length);

    return {
      encryptedData: new Uint8Array(encrypted),
      salt: combinedSalt,
      iv
    };
  }

  /**
   * Military-grade triple-layer decryption
   */
  async decryptWithPassword(
    encryptedData: Uint8Array,
    salt: Uint8Array,
    iv: Uint8Array,
    password: string
  ): Promise<string> {
    // Extract the three salts
    const salt1 = salt.slice(0, 32);
    const salt2 = salt.slice(32, 64);
    const salt3 = salt.slice(64, 96);
    
    // Generate the same three keys
    const key1 = await this.deriveKeyFromPassword(password + '_layer1', salt1);
    const key2 = await this.deriveKeyFromPassword(password + '_layer2', salt2);
    const key3 = await this.deriveKeyFromPassword(password + '_layer3', salt3);
    
    try {
      // Reverse triple decryption
      let decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key3, encryptedData);
      decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, new Uint8Array(decrypted));
      decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key1, new Uint8Array(decrypted));

      const decoder = new TextDecoder();
      const paddedData = decoder.decode(decrypted);
      
      // Remove padding by finding the original data (before random characters)
      const originalData = paddedData.replace(/[a-z]+$/, '');
      return originalData;
    } catch (error) {
      throw new Error('Decryption failed - invalid credentials or compromised data');
    }
  }

  /**
   * Converts military-grade encrypted data to secure base64 storage format
   */
  encryptedDataToBase64(encryptedData: Uint8Array, salt: Uint8Array, iv: Uint8Array): string {
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedData, salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Parses military-grade encrypted data from secure storage
   */
  base64ToEncryptedData(base64Data: string): { encryptedData: Uint8Array; salt: Uint8Array; iv: Uint8Array } {
    const combined = new Uint8Array(
      atob(base64Data).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, 96); // Now 96 bytes for three salts
    const iv = combined.slice(96, 108);
    const encryptedData = combined.slice(108);
    
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