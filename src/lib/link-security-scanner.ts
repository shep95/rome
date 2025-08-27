// Client-side link security scanner - no data sent to external servers
// This provides basic protection without compromising privacy

// Known malicious domains (basic list - would be updated regularly in production)
const MALICIOUS_DOMAINS = [
  'phishing-site.com',
  'fake-bank.net',
  'scam-crypto.org',
  'malware-download.xyz',
  'virus-infected.tk',
  // Note: In production, this would be a more comprehensive list
  // and could be updated via secure feeds
];

// Suspicious URL patterns
const SUSPICIOUS_PATTERNS = [
  // URL shorteners (potential for hiding malicious URLs)
  /^https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|short\.link|cutt\.ly)/i,
  
  // Common phishing patterns
  /payp[a4]l/i,
  /g[o0]{2}gle/i,
  /fac[e3]b[o0]{2}k/i,
  /tw[i1]tt[e3]r/i,
  /[a4]m[a4]z[o0]n/i,
  /[a4]ppl[e3]/i,
  /micr[o0]s[o0]ft/i,
  /netfl[i1]x/i,
  /sp[o0]t[i1]fy/i,
  
  // Suspicious TLDs
  /\.(tk|ml|ga|cf|pw|cc|click|download|work|top|stream|zip|review|country|science|accountant|date|trade|racing|party|bid|loan|men|download|cricket|faith|webcam|win)$/i,
  
  // IP addresses instead of domains
  /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  
  // Suspicious keywords
  /urgent/i,
  /limited.*time/i,
  /verify.*account/i,
  /suspended/i,
  /security.*alert/i,
  /free.*gift/i,
  /winner/i,
  /claim.*prize/i,
  /bitcoin|crypto|earn.*money/i,
  
  // Multiple subdomains (common in phishing)
  /^https?:\/\/[^\/]*\.[^\/]*\.[^\/]*\.[^\/]*\//,
  
  // Non-standard ports
  /:\d{2,5}(?!443|80)/,
  
  // Homograph attacks (similar looking characters)
  /[а-я]/i, // Cyrillic characters
  /[αβγδεζηθικλμνξοπρστυφχψω]/i, // Greek characters
];

// Safe domains (whitelist of known safe domains)
const SAFE_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'github.com',
  'stackoverflow.com',
  'reddit.com',
  'wikipedia.org',
  'amazon.com',
  'apple.com',
  'microsoft.com',
  'netflix.com',
  'spotify.com',
  'zoom.us',
  'dropbox.com',
  'gmail.com',
  'outlook.com',
  'paypal.com',
  'stripe.com',
  'supabase.com',
  'vercel.com',
  'cloudflare.com',
  'mozilla.org',
  'w3.org',
  'npmjs.com',
  'nodejs.org',
  'reactjs.org',
  'tailwindcss.com',
];

export interface LinkSecurityResult {
  url: string;
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  recommendations: string[];
}

export class LinkSecurityScanner {
  /**
   * Analyze a URL for potential security risks
   * This is done entirely client-side without sending data to external servers
   */
  static analyzeUrl(url: string): LinkSecurityResult {
    const result: LinkSecurityResult = {
      url,
      isSafe: true,
      riskLevel: 'low',
      warnings: [],
      recommendations: []
    };

    if (!url || typeof url !== 'string') {
      result.isSafe = false;
      result.riskLevel = 'high';
      result.warnings.push('Invalid URL format');
      return result;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // Check if it's a known safe domain
      const isKnownSafe = SAFE_DOMAINS.some(safeDomain => 
        domain === safeDomain || domain.endsWith('.' + safeDomain)
      );
      
      if (isKnownSafe) {
        result.isSafe = true;
        result.riskLevel = 'low';
        return result;
      }

      // Check against known malicious domains
      if (MALICIOUS_DOMAINS.includes(domain)) {
        result.isSafe = false;
        result.riskLevel = 'high';
        result.warnings.push('This domain is known to be malicious');
        result.recommendations.push('Do not visit this link or enter any personal information');
        return result;
      }

      // Check suspicious patterns
      let suspiciousCount = 0;
      
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(fullUrl) || pattern.test(domain)) {
          suspiciousCount++;
          
          if (pattern.test(domain) && pattern.source.includes('tk|ml|ga|cf')) {
            result.warnings.push('Uses a suspicious top-level domain commonly used for phishing');
          } else if (pattern.source.includes('bit\\.ly|tinyurl')) {
            result.warnings.push('URL shortener detected - actual destination is hidden');
            result.recommendations.push('Be cautious with shortened URLs as they can hide malicious sites');
          } else if (pattern.source.includes('payp[a4]l')) {
            result.warnings.push('Possible PayPal phishing attempt detected');
          } else if (pattern.source.includes('urgent|limited.*time')) {
            result.warnings.push('Contains urgency keywords often used in scams');
          } else if (pattern.source.includes('\\d{1,3}\\.\\d{1,3}')) {
            result.warnings.push('Uses IP address instead of domain name');
          } else if (pattern.source.includes('multiple subdomains')) {
            result.warnings.push('Has multiple subdomains which is suspicious');
          }
        }
      }

      // Check for HTTPS
      if (urlObj.protocol !== 'https:') {
        result.warnings.push('Not using secure HTTPS connection');
        result.recommendations.push('Avoid entering sensitive information on non-HTTPS sites');
        suspiciousCount++;
      }

      // Check for suspicious query parameters
      const suspiciousParams = ['token', 'auth', 'login', 'verify', 'confirm', 'redirect', 'return'];
      const hasParams = urlObj.searchParams;
      if (hasParams) {
        for (const param of suspiciousParams) {
          if (urlObj.searchParams.has(param)) {
            result.warnings.push('Contains suspicious authentication parameters');
            suspiciousCount++;
            break;
          }
        }
      }

      // Check domain age heuristics (simple checks)
      if (domain.length > 50) {
        result.warnings.push('Unusually long domain name');
        suspiciousCount++;
      }

      const domainParts = domain.split('.');
      if (domainParts.length > 4) {
        result.warnings.push('Complex subdomain structure detected');
        suspiciousCount++;
      }

      // Determine risk level based on suspicious indicators
      if (suspiciousCount === 0) {
        result.isSafe = true;
        result.riskLevel = 'low';
      } else if (suspiciousCount <= 2) {
        result.isSafe = false;
        result.riskLevel = 'medium';
        result.recommendations.push('Exercise caution when visiting this link');
        result.recommendations.push('Do not enter personal or financial information');
      } else {
        result.isSafe = false;
        result.riskLevel = 'high';
        result.recommendations.push('Avoid visiting this link');
        result.recommendations.push('This appears to be a potential phishing or malicious site');
      }

      return result;
      
    } catch (error) {
      result.isSafe = false;
      result.riskLevel = 'high';
      result.warnings.push('Malformed or invalid URL');
      result.recommendations.push('Do not attempt to visit this link');
      return result;
    }
  }

  /**
   * Extract all URLs from a text message
   */
  static extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"\[\]{}|\\^`]+/gi;
    return text.match(urlRegex) || [];
  }

  /**
   * Scan a message for suspicious links
   */
  static scanMessage(message: string): {
    hasLinks: boolean;
    hasSuspiciousLinks: boolean;
    linkAnalysis: LinkSecurityResult[];
    overallRisk: 'low' | 'medium' | 'high';
  } {
    const urls = this.extractUrls(message);
    
    if (urls.length === 0) {
      return {
        hasLinks: false,
        hasSuspiciousLinks: false,
        linkAnalysis: [],
        overallRisk: 'low'
      };
    }

    const linkAnalysis = urls.map(url => this.analyzeUrl(url));
    const hasSuspiciousLinks = linkAnalysis.some(analysis => !analysis.isSafe);
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (linkAnalysis.some(analysis => analysis.riskLevel === 'high')) {
      overallRisk = 'high';
    } else if (linkAnalysis.some(analysis => analysis.riskLevel === 'medium')) {
      overallRisk = 'medium';
    }

    return {
      hasLinks: true,
      hasSuspiciousLinks,
      linkAnalysis,
      overallRisk
    };
  }
}