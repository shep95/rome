import { registerPlugin } from '@capacitor/core';

export interface ScreenshotProtectionPlugin {
  /**
   * Enable screenshot protection
   */
  enableProtection(): Promise<void>;
  
  /**
   * Disable screenshot protection
   */
  disableProtection(): Promise<void>;
  
  /**
   * Check if protection is currently enabled
   */
  isProtectionEnabled(): Promise<{ enabled: boolean }>;
  
  /**
   * Add a listener for screenshot attempts
   */
  addListener(eventName: 'screenshotAttempt', listenerFunc: (info: { timestamp: number }) => void): Promise<any>;
  
  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>;
}

const ScreenshotProtection = registerPlugin<ScreenshotProtectionPlugin>('ScreenshotProtection', {
  web: {
    // Web implementation - limited screenshot protection
    async enableProtection() {
      console.log('Web screenshot protection enabled (limited functionality)');
      // Web browsers have limited screenshot protection capabilities
      // Most protection is handled in the React hook
    },
    
    async disableProtection() {
      console.log('Web screenshot protection disabled');
    },
    
    async isProtectionEnabled() {
      return { enabled: false }; // Web protection is handled differently
    },
    
    async addListener() {
      return { remove: () => {} };
    },
    
    async removeAllListeners() {
      // No-op for web
    }
  }
});

export default ScreenshotProtection;