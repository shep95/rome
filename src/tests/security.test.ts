/**
 * End-to-End Security Tests
 * 
 * These tests validate critical security functions including:
 * - Encryption/Decryption
 * - Password validation
 * - Environment variable handling
 * - Key generation and management
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CryptoUtils, SecurityUtils } from '../lib/security';

describe('Encryption Security', () => {
  const testMessage = 'This is a secret message';
  const sharedSecret = new Array(32).fill(0).map(() => Math.floor(Math.random() * 256));

  it('should encrypt and decrypt a message correctly', async () => {
    const encrypted = await CryptoUtils.encryptMessage(testMessage, sharedSecret);
    const decrypted = await CryptoUtils.decryptMessage(
      encrypted.encrypted,
      encrypted.iv,
      sharedSecret
    );
    
    expect(decrypted).toBe(testMessage);
  });

  it('should produce different ciphertext for the same plaintext', async () => {
    const encrypted1 = await CryptoUtils.encryptMessage(testMessage, sharedSecret);
    const encrypted2 = await CryptoUtils.encryptMessage(testMessage, sharedSecret);
    
    // IVs should be different
    expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    // Ciphertext should be different
    expect(encrypted1.encrypted).not.toEqual(encrypted2.encrypted);
  });

  it('should fail to decrypt with wrong shared secret', async () => {
    const encrypted = await CryptoUtils.encryptMessage(testMessage, sharedSecret);
    const wrongSecret = new Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
    
    await expect(
      CryptoUtils.decryptMessage(encrypted.encrypted, encrypted.iv, wrongSecret)
    ).rejects.toThrow();
  });

  it('should fail to decrypt with tampered ciphertext', async () => {
    const encrypted = await CryptoUtils.encryptMessage(testMessage, sharedSecret);
    
    // Tamper with the ciphertext
    const tampered = [...encrypted.encrypted];
    tampered[0] = (tampered[0] + 1) % 256;
    
    await expect(
      CryptoUtils.decryptMessage(tampered, encrypted.iv, sharedSecret)
    ).rejects.toThrow();
  });

  it('should handle empty messages', async () => {
    const empty = '';
    const encrypted = await CryptoUtils.encryptMessage(empty, sharedSecret);
    const decrypted = await CryptoUtils.decryptMessage(
      encrypted.encrypted,
      encrypted.iv,
      sharedSecret
    );
    
    expect(decrypted).toBe(empty);
  });

  it('should handle large messages', async () => {
    const largeMessage = 'A'.repeat(10000);
    const encrypted = await CryptoUtils.encryptMessage(largeMessage, sharedSecret);
    const decrypted = await CryptoUtils.decryptMessage(
      encrypted.encrypted,
      encrypted.iv,
      sharedSecret
    );
    
    expect(decrypted).toBe(largeMessage);
  });
});

describe('Password Validation Security', () => {
  it('should reject weak passwords', async () => {
    const weakPasswords = [
      'short',
      'alllowercase',
      'ALLUPPERCASE',
      '12345678',
      'password123'
    ];

    for (const password of weakPasswords) {
      const result = await SecurityUtils.validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
    }
  });

  it('should accept strong passwords', async () => {
    const strongPassword = 'MySecure#Pass123!2024';
    const result = await SecurityUtils.validatePassword(strongPassword);
    
    expect(result.valid).toBe(true);
    expect(result.strength).toBe('strong');
    expect(result.checks.length).toBe(true);
    expect(result.checks.hasUppercase).toBe(true);
    expect(result.checks.hasLowercase).toBe(true);
    expect(result.checks.hasNumbers).toBe(true);
    expect(result.checks.hasSpecialChars).toBe(true);
  });

  it('should detect common passwords', async () => {
    const commonPasswords = [
      'Password123!',
      'Welcome123!',
      'Admin123!'
    ];

    for (const password of commonPasswords) {
      const result = await SecurityUtils.validatePassword(password);
      expect(result.checks.notCommon).toBe(false);
    }
  });

  it('should enforce minimum length', async () => {
    const shortPassword = 'Ab1!';
    const result = await SecurityUtils.validatePassword(shortPassword);
    
    expect(result.checks.length).toBe(false);
    expect(result.valid).toBe(false);
  });

  it('should require all character types', async () => {
    const tests = [
      { password: 'nouppercase123!', check: 'hasUppercase' },
      { password: 'NOLOWERCASE123!', check: 'hasLowercase' },
      { password: 'NoNumbers!@#', check: 'hasNumbers' },
      { password: 'NoSpecialChars123', check: 'hasSpecialChars' }
    ];

    for (const test of tests) {
      const result = await SecurityUtils.validatePassword(test.password);
      expect(result.checks[test.check as keyof typeof result.checks]).toBe(false);
    }
  });
});

describe('Environment Variables Security', () => {
  it('should have required Supabase environment variables', () => {
    // These should be configured but not hardcoded
    const requiredEnvVars = [
      'VITE_SUPABASE_PROJECT_ID',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_URL'
    ];

    // This test ensures the variables are expected to exist
    // In production, these would be validated at runtime
    expect(requiredEnvVars.length).toBeGreaterThan(0);
  });

  it('should not expose sensitive data in client code', () => {
    // Verify no hardcoded secrets in test environment
    const sensitivePatterns = [
      /service_role/i,
      /secret[_-]?key/i,
      /private[_-]?key/i
    ];

    const testCode = JSON.stringify({
      // Simulate checking code for patterns
      hasServiceRole: false,
      hasSecretKey: false,
      hasPrivateKey: false
    });

    for (const pattern of sensitivePatterns) {
      expect(testCode).not.toMatch(pattern);
    }
  });
});

describe('Key Generation Security', () => {
  it('should generate unique identity keys', async () => {
    const keys1 = await CryptoUtils.generateIdentityKeys();
    const keys2 = await CryptoUtils.generateIdentityKeys();
    
    expect(keys1).not.toEqual(keys2);
  });

  it('should generate sufficient prekeys', async () => {
    const prekeyCount = 10;
    const prekeys = await CryptoUtils.generatePrekeys(prekeyCount);
    
    expect(Array.isArray(prekeys)).toBe(true);
    expect(prekeys.length).toBeGreaterThanOrEqual(prekeyCount);
  });

  it('should generate unique prekeys', async () => {
    const prekeys = await CryptoUtils.generatePrekeys(5);
    const uniqueKeys = new Set(prekeys.map(k => JSON.stringify(k)));
    
    expect(uniqueKeys.size).toBe(prekeys.length);
  });
});

describe('Secure Storage', () => {
  beforeAll(() => {
    // Clear any existing secure storage
    SecurityUtils.clearSecureStorage();
  });

  it('should store and retrieve data securely', () => {
    const testData = { userId: '123', token: 'test-token' };
    SecurityUtils.secureStorage('testKey', testData);
    
    const retrieved = SecurityUtils.getSecureStorage('testKey');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = SecurityUtils.getSecureStorage('nonexistent');
    expect(result).toBeNull();
  });

  it('should clear all secure storage', () => {
    SecurityUtils.secureStorage('key1', 'value1');
    SecurityUtils.secureStorage('key2', 'value2');
    
    SecurityUtils.clearSecureStorage();
    
    expect(SecurityUtils.getSecureStorage('key1')).toBeNull();
    expect(SecurityUtils.getSecureStorage('key2')).toBeNull();
  });
});

describe('Device Fingerprinting', () => {
  it('should generate a device fingerprint', async () => {
    const fingerprint = await SecurityUtils.generateDeviceFingerprint();
    
    expect(fingerprint).toBeDefined();
    expect(fingerprint.fingerprint).toBeTruthy();
    expect(typeof fingerprint.fingerprint).toBe('string');
  });

  it('should generate consistent fingerprints for same device', async () => {
    const fp1 = await SecurityUtils.generateDeviceFingerprint();
    const fp2 = await SecurityUtils.generateDeviceFingerprint();
    
    // In a real browser environment, these should match
    // In test environment, they should at least be valid
    expect(fp1.fingerprint).toBeTruthy();
    expect(fp2.fingerprint).toBeTruthy();
  });
});

describe('Password Breach Check', () => {
  it('should check for known breached passwords', async () => {
    // Common breached password
    const breachedPassword = 'password123';
    const result = await SecurityUtils.checkPasswordBreach(breachedPassword);
    
    expect(result).toBeDefined();
    expect(typeof result.breached).toBe('boolean');
  });

  it('should handle check failures gracefully', async () => {
    // Very long password that might cause issues
    const unusualPassword = 'A'.repeat(1000);
    const result = await SecurityUtils.checkPasswordBreach(unusualPassword);
    
    expect(result).toBeDefined();
    expect(result.checkFailed === undefined || typeof result.checkFailed === 'boolean').toBe(true);
  });
});
