/**
 * Third-Party Access Protection System
 * Prevents unauthorized access from external apps, downloads, and malicious scripts
 */

import { supabase } from '@/integrations/supabase/client';

export interface ThreatDetection {
  type: 'script_injection' | 'data_exfiltration' | 'unauthorized_access' | 'malicious_file' | 'suspicious_activity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  blocked: boolean;
  details: string;
  timestamp: Date;
}

class ThirdPartyProtectionManager {
  private static instance: ThirdPartyProtectionManager;
  private blockedOrigins: Set<string> = new Set();
  private allowedOrigins: Set<string> = new Set([
    window.location.origin,
    'https://supabase.co',
    'https://progressier.app'
  ]);
  private suspiciousActivityThreshold = 5;
  private activityCount = 0;

  private constructor() {
    this.initializeProtection();
  }

  static getInstance(): ThirdPartyProtectionManager {
    if (!ThirdPartyProtectionManager.instance) {
      ThirdPartyProtectionManager.instance = new ThirdPartyProtectionManager();
    }
    return ThirdPartyProtectionManager.instance;
  }

  private initializeProtection() {
    // Block unauthorized script execution
    this.preventScriptInjection();
    
    // Monitor data access attempts
    this.monitorDataAccess();
    
    // Block unauthorized network requests
    this.blockUnauthorizedRequests();
    
    // Monitor DOM manipulation
    this.monitorDOMChanges();
    
    // Block clipboard access
    this.protectClipboard();
  }

  private preventScriptInjection() {
    // Override dangerous functions
    const originalEval = window.eval;
    window.eval = (code: string) => {
      this.logThreat({
        type: 'script_injection',
        severity: 'critical',
        blocked: true,
        details: 'Blocked eval() execution attempt',
        timestamp: new Date()
      });
      throw new Error('Script execution blocked for security');
    };

    // Monitor script element creation
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      if (tagName.toLowerCase() === 'script') {
        const protectionManager = ThirdPartyProtectionManager.getInstance();
        element.addEventListener('beforeload', (e) => {
          const src = (e.target as HTMLScriptElement).src;
          if (src && !protectionManager.isOriginAllowed(src)) {
            e.preventDefault();
            protectionManager.logThreat({
              type: 'script_injection',
              severity: 'high',
              blocked: true,
              details: `Blocked unauthorized script: ${src}`,
              timestamp: new Date()
            });
          }
        });
      }
      return element;
    };
  }

  private monitorDataAccess() {
    // Override localStorage access
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;

    localStorage.setItem = (key: string, value: string) => {
      if (this.isSuspiciousDataAccess(key)) {
        this.logThreat({
          type: 'unauthorized_access',
          severity: 'high',
          blocked: true,
          details: `Blocked unauthorized localStorage write: ${key}`,
          timestamp: new Date()
        });
        return;
      }
      return originalSetItem.call(localStorage, key, value);
    };

    localStorage.getItem = (key: string) => {
      if (this.isSuspiciousDataAccess(key)) {
        this.logThreat({
          type: 'data_exfiltration',
          severity: 'high',
          blocked: true,
          details: `Blocked unauthorized localStorage read: ${key}`,
          timestamp: new Date()
        });
        return null;
      }
      return originalGetItem.call(localStorage, key);
    };
  }

  private blockUnauthorizedRequests() {
    // Override fetch to monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      if (!this.isOriginAllowed(url)) {
        this.logThreat({
          type: 'data_exfiltration',
          severity: 'critical',
          blocked: true,
          details: `Blocked unauthorized network request: ${url}`,
          timestamp: new Date()
        });
        throw new Error('Network request blocked for security');
      }
      
      return originalFetch(input, init);
    };
  }

  private monitorDOMChanges() {
    // Monitor suspicious DOM modifications
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' || element.tagName === 'IFRAME') {
                this.activityCount++;
                if (this.activityCount > this.suspiciousActivityThreshold) {
                  this.logThreat({
                    type: 'suspicious_activity',
                    severity: 'high',
                    blocked: false,
                    details: 'Suspicious DOM modification detected',
                    timestamp: new Date()
                  });
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'onclick']
    });
  }

  private protectClipboard() {
    // Prevent unauthorized clipboard access
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection()?.toString();
      if (selection && this.containsSensitiveData(selection)) {
        e.preventDefault();
        this.logThreat({
          type: 'data_exfiltration',
          severity: 'medium',
          blocked: true,
          details: 'Blocked sensitive data copy attempt',
          timestamp: new Date()
        });
      }
    });
  }

  private isOriginAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      const origin = urlObj.origin;
      
      // Check if origin is in allowed list
      if (this.allowedOrigins.has(origin)) return true;
      
      // Check if origin is blocked
      if (this.blockedOrigins.has(origin)) return false;
      
      // Block by default for security
      this.blockedOrigins.add(origin);
      return false;
    } catch {
      return false;
    }
  }

  private isSuspiciousDataAccess(key: string): boolean {
    const sensitiveKeys = [
      'supabase',
      'auth',
      'session',
      'user',
      'token',
      'key',
      'password',
      'secret',
      'private',
      'secure'
    ];
    
    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }

  private containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /\b[A-Za-z0-9+/]{32,}\b/, // Base64 encoded data
      /\b[0-9a-f]{32,}\b/, // Hex encoded data
      /BEGIN\s+(PRIVATE\s+KEY|CERTIFICATE)/i,
      /eyJ[A-Za-z0-9+/]/ // JWT token pattern
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  async validateFileUpload(file: File): Promise<{ safe: boolean; threat?: ThreatDetection }> {
    // Check file type
    const dangerousTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-sh',
      'application/x-bat',
      'text/x-script'
    ];

    if (dangerousTypes.includes(file.type)) {
      const threat: ThreatDetection = {
        type: 'malicious_file',
        severity: 'critical',
        blocked: true,
        details: `Blocked dangerous file type: ${file.type}`,
        timestamp: new Date()
      };
      this.logThreat(threat);
      return { safe: false, threat };
    }

    // Check file size (block suspiciously large files)
    if (file.size > 100 * 1024 * 1024) { // 100MB
      const threat: ThreatDetection = {
        type: 'suspicious_activity',
        severity: 'medium',
        blocked: true,
        details: `Blocked oversized file: ${file.size} bytes`,
        timestamp: new Date()
      };
      this.logThreat(threat);
      return { safe: false, threat };
    }

    // Check file extension
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExt)) {
      const threat: ThreatDetection = {
        type: 'malicious_file',
        severity: 'high',
        blocked: true,
        details: `Blocked dangerous file extension: ${fileExt}`,
        timestamp: new Date()
      };
      this.logThreat(threat);
      return { safe: false, threat };
    }

    return { safe: true };
  }

  private async logThreat(threat: ThreatDetection) {
    try {
      // Log to Supabase for monitoring
      await supabase.from('security_audit_logs').insert({
        event_type: 'third_party_threat',
        event_description: threat.details,
        risk_level: threat.severity,
        additional_data: {
          threat_type: threat.type,
          blocked: threat.blocked,
          timestamp: threat.timestamp.toISOString()
        }
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('🛡️ Security Threat Detected:', threat);
      }

      // Show user notification for critical threats
      if (threat.severity === 'critical' && threat.blocked) {
        this.showSecurityAlert(threat);
      }
    } catch (error) {
      console.error('Failed to log security threat:', error);
    }
  }

  private showSecurityAlert(threat: ThreatDetection) {
    // Show a discrete security notification
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    alertDiv.textContent = '🛡️ Security threat blocked';
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      document.body.removeChild(alertDiv);
    }, 3000);
  }

  // Public methods for manual protection
  blockOrigin(origin: string) {
    this.blockedOrigins.add(origin);
  }

  allowOrigin(origin: string) {
    this.allowedOrigins.add(origin);
    this.blockedOrigins.delete(origin);
  }

  getBlockedOrigins(): string[] {
    return Array.from(this.blockedOrigins);
  }
}

// Initialize protection on module load
export const thirdPartyProtection = ThirdPartyProtectionManager.getInstance();

// Export for external use
export { ThirdPartyProtectionManager };