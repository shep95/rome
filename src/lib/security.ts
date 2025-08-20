import { supabase } from '@/integrations/supabase/client';

export interface PasswordValidation {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notCommon: boolean;
  };
}

export interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts: number;
}

export interface DeviceFingerprint {
  fingerprint: string;
}

export class SecurityUtils {
  private static getDeviceMetadata() {
    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
    };
  }

  static async checkRateLimit(identifier: string, action: string): Promise<RateLimitCheck> {
    try {
      const response = await supabase.functions.invoke('auth-security', {
        body: {
          action: 'check_rate_limit',
          identifier,
          metadata: { action }
        }
      });

      if (response.error) {
        console.error('Rate limit check failed:', response.error);
        return { allowed: false, remainingAttempts: 0 }; // Fail closed
      }

      return response.data;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: false, remainingAttempts: 0 }; // Fail closed
    }
  }

  static async incrementRateLimit(identifier: string, action: string): Promise<void> {
    try {
      await supabase.functions.invoke('auth-security', {
        body: {
          action: 'increment_rate_limit',
          identifier,
          metadata: { action }
        }
      });
    } catch (error) {
      console.error('Rate limit increment error:', error);
    }
  }

static async validatePassword(password: string): Promise<PasswordValidation> {
  // Client-side validation only; never send raw password to server
  const checks = {
    length: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChars: /[^A-Za-z0-9]/.test(password),
    notCommon: !/(password|123456|qwerty|letmein|admin|welcome)/i.test(password)
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strength: 'weak' | 'medium' | 'strong' = score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak';
  return { valid: strength !== 'weak', strength, checks };
}

static async checkPasswordBreach(password: string): Promise<{ breached: boolean; checkFailed?: boolean }> {
  try {
    // Compute SHA-1 hash client-side and use k-anonymity (prefix only sent to server)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const buffer = await crypto.subtle.digest('SHA-1', data);
    const bytes = Array.from(new Uint8Array(buffer));
    const fullHash = bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    const response = await supabase.functions.invoke('auth-security', {
      body: { action: 'check_breach_database', metadata: { hash_prefix: prefix } }
    });

    if (response.error) {
      console.error('Breach check failed:', response.error);
      return { breached: false, checkFailed: true };
    }

    const text: string = response.data?.range || '';
    const breached = text.split('\n').some(line => {
      const [suf, count] = line.trim().split(':');
      return suf === suffix && Number(count) > 0;
    });
    return { breached };
  } catch (error) {
    console.error('Breach check error:', error);
    return { breached: false, checkFailed: true };
  }
}

  static async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    try {
      const metadata = this.getDeviceMetadata();
      
      const response = await supabase.functions.invoke('auth-security', {
        body: {
          action: 'generate_device_fingerprint',
          metadata
        }
      });

      if (response.error) {
        console.error('Device fingerprint failed:', response.error);
        // Generate a simple fallback fingerprint
        const simple = JSON.stringify(metadata);
        const hash = await this.simpleHash(simple);
        return { fingerprint: hash };
      }

      return response.data;
    } catch (error) {
      console.error('Device fingerprint error:', error);
      const simple = JSON.stringify(this.getDeviceMetadata());
      const hash = await this.simpleHash(simple);
      return { fingerprint: hash };
    }
  }

  private static async simpleHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static getClientIP(): string {
    // In a real implementation, this would be passed from server
    // For now, return a placeholder
    return 'client-ip';
  }

  static async secureStorage(key: string, value: any): Promise<void> {
    // In production, implement secure storage with encryption
    try {
      localStorage.setItem(`rome_secure_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Secure storage failed:', error);
    }
  }

  static async getSecureStorage(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(`rome_secure_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Secure storage retrieval failed:', error);
      return null;
    }
  }

  static async clearSecureStorage(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('rome_secure_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Secure storage clear failed:', error);
    }
  }
}

export class CryptoUtils {
  static async generateIdentityKeys() {
    try {
      const response = await supabase.functions.invoke('crypto-utils', {
        body: {
          action: 'generate_identity_keys'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Generate identity keys error:', error);
      throw error;
    }
  }

  static async generatePrekeys(count: number = 100) {
    try {
      const response = await supabase.functions.invoke('crypto-utils', {
        body: {
          action: 'generate_prekeys',
          data: { count }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Generate prekeys error:', error);
      throw error;
    }
  }

  static async getPrekeyBundle(userId: string) {
    try {
      const response = await supabase.functions.invoke('crypto-utils', {
        body: {
          action: 'get_prekey_bundle',
          data: { userId }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Get prekey bundle error:', error);
      throw error;
    }
  }

  static async encryptMessage(message: string, sharedSecret: number[]) {
    try {
      const response = await supabase.functions.invoke('crypto-utils', {
        body: {
          action: 'encrypt_message',
          data: { message, sharedSecret }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Encrypt message error:', error);
      throw error;
    }
  }

  static async decryptMessage(encrypted: number[], iv: number[], sharedSecret: number[]) {
    try {
      const response = await supabase.functions.invoke('crypto-utils', {
        body: {
          action: 'decrypt_message',
          data: { encrypted, iv, sharedSecret }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Decrypt message error:', error);
      throw error;
    }
  }
}