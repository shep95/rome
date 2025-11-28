// Real passive security assessment tools for NOMAD
// These perform actual checks and return real findings

interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  references?: string[];
}

interface SecurityAssessmentResult {
  target: string;
  scan_type: 'passive_recon' | 'security_audit' | 'full_assessment';
  timestamp: string;
  findings: SecurityFinding[];
  risk_score: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export async function assessSecurityPosture(target: string, assessmentType: string = 'full_assessment'): Promise<SecurityAssessmentResult> {
  console.log(`[SECURITY] Starting real passive assessment on: ${target}`);
  
  const findings: SecurityFinding[] = [];
  const cleanTarget = target.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const targetUrl = target.startsWith('http') ? target : `https://${target}`;
  
  try {
    // 1. Check security headers (REAL CHECK)
    const headersCheck = await checkSecurityHeaders(targetUrl);
    findings.push(...headersCheck);
    
    // 2. Check SSL/TLS configuration (REAL CHECK)
    const sslCheck = await checkSSLConfiguration(cleanTarget);
    findings.push(...sslCheck);
    
    // 3. Check for exposed sensitive files (REAL CHECK)
    const exposedFilesCheck = await checkExposedFiles(targetUrl);
    findings.push(...exposedFilesCheck);
    
    // 4. Check DNS security (REAL CHECK)
    const dnsCheck = await checkDNSSecurity(cleanTarget);
    findings.push(...dnsCheck);
    
    // 5. Check for common misconfigurations (REAL CHECK)
    const misconfigCheck = await checkMisconfigurations(targetUrl);
    findings.push(...misconfigCheck);
    
    // Calculate risk score based on actual findings
    const summary = {
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      info: findings.filter(f => f.severity === 'INFO').length,
    };
    
    const risk_score = 
      (summary.critical * 10) +
      (summary.high * 7) +
      (summary.medium * 4) +
      (summary.low * 2) +
      (summary.info * 0.5);
    
    return {
      target: cleanTarget,
      scan_type: assessmentType as any,
      timestamp: new Date().toISOString(),
      findings,
      risk_score: Math.min(100, risk_score),
      summary
    };
    
  } catch (error) {
    console.error('[SECURITY] Assessment error:', error);
    throw error;
  }
}

async function checkSecurityHeaders(url: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;
    
    // Check for missing critical security headers
    if (!headers.get('strict-transport-security')) {
      findings.push({
        severity: 'HIGH',
        category: 'Security Headers',
        title: 'Missing HSTS Header',
        description: 'HTTP Strict Transport Security (HSTS) header is not set',
        evidence: 'No Strict-Transport-Security header found in HTTP response',
        remediation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      });
    }
    
    if (!headers.get('content-security-policy')) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Security Headers',
        title: 'Missing Content Security Policy',
        description: 'Content-Security-Policy header is not configured',
        evidence: 'No CSP header found in HTTP response',
        remediation: 'Implement a strict Content Security Policy to prevent XSS attacks',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
      });
    }
    
    if (!headers.get('x-frame-options') && !headers.get('content-security-policy')?.includes('frame-ancestors')) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Security Headers',
        title: 'Missing Clickjacking Protection',
        description: 'Neither X-Frame-Options nor CSP frame-ancestors is set',
        evidence: 'No clickjacking protection found',
        remediation: 'Add header: X-Frame-Options: DENY or use CSP frame-ancestors directive',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options']
      });
    }
    
    if (!headers.get('x-content-type-options')) {
      findings.push({
        severity: 'LOW',
        category: 'Security Headers',
        title: 'Missing X-Content-Type-Options',
        description: 'MIME-type sniffing protection is not enabled',
        evidence: 'No X-Content-Type-Options header found',
        remediation: 'Add header: X-Content-Type-Options: nosniff',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options']
      });
    }
    
    if (!headers.get('referrer-policy')) {
      findings.push({
        severity: 'LOW',
        category: 'Security Headers',
        title: 'Missing Referrer Policy',
        description: 'Referrer-Policy header is not configured',
        evidence: 'No Referrer-Policy header found',
        remediation: 'Add header: Referrer-Policy: strict-origin-when-cross-origin',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy']
      });
    }
    
    if (!headers.get('permissions-policy')) {
      findings.push({
        severity: 'INFO',
        category: 'Security Headers',
        title: 'Missing Permissions Policy',
        description: 'Permissions-Policy header is not set',
        evidence: 'No Permissions-Policy header found',
        remediation: 'Configure Permissions-Policy to restrict browser features',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy']
      });
    }
    
  } catch (error) {
    console.error('[HEADERS] Check failed:', error);
  }
  
  return findings;
}

async function checkSSLConfiguration(domain: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  try {
    // Check if SSL Labs API is accessible
    const testUrl = `https://api.ssllabs.com/api/v3/analyze?host=${domain}&startNew=off&all=done`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'READY' && data.endpoints) {
        for (const endpoint of data.endpoints) {
          if (endpoint.grade && ['T', 'F', 'M'].includes(endpoint.grade)) {
            findings.push({
              severity: 'HIGH',
              category: 'SSL/TLS',
              title: `Poor SSL Configuration (Grade: ${endpoint.grade})`,
              description: `SSL Labs grade ${endpoint.grade} indicates security issues`,
              evidence: `IP: ${endpoint.ipAddress}, Grade: ${endpoint.grade}`,
              remediation: 'Review SSL Labs detailed report and fix identified issues',
              references: [`https://www.ssllabs.com/ssltest/analyze.html?d=${domain}`]
            });
          }
        }
      }
    }
    
    // Basic SSL check
    const sslTest = await fetch(`https://${domain}`);
    if (!sslTest.ok) {
      findings.push({
        severity: 'CRITICAL',
        category: 'SSL/TLS',
        title: 'SSL Connection Failed',
        description: 'Unable to establish secure HTTPS connection',
        evidence: `HTTPS request to ${domain} failed`,
        remediation: 'Ensure valid SSL/TLS certificate is installed and properly configured',
        references: ['https://letsencrypt.org/']
      });
    }
    
  } catch (error: any) {
    if (error?.message?.includes('certificate')) {
      findings.push({
        severity: 'CRITICAL',
        category: 'SSL/TLS',
        title: 'SSL Certificate Error',
        description: 'SSL certificate validation failed',
        evidence: error.message,
        remediation: 'Install a valid SSL certificate from a trusted CA',
        references: ['https://letsencrypt.org/']
      });
    }
  }
  
  return findings;
}

async function checkExposedFiles(baseUrl: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  const sensitivePaths = [
    '.git/config',
    '.env',
    '.env.local',
    '.env.production',
    'config.php',
    'wp-config.php',
    '.htaccess',
    'phpinfo.php',
    'composer.json',
    'package.json',
    '.DS_Store',
    'backup.sql',
    'database.sql',
    'admin',
    'phpmyadmin',
  ];
  
  for (const path of sensitivePaths) {
    try {
      const response = await fetch(`${baseUrl}/${path}`, { 
        method: 'GET',
        redirect: 'manual'
      });
      
      if (response.status === 200) {
        findings.push({
          severity: path.includes('.git') || path.includes('.env') || path.includes('.sql') ? 'CRITICAL' : 'HIGH',
          category: 'Information Disclosure',
          title: `Exposed Sensitive File: ${path}`,
          description: `Publicly accessible file at /${path}`,
          evidence: `HTTP ${response.status} response for ${baseUrl}/${path}`,
          remediation: `Restrict access to ${path} via server configuration or remove from public directory`,
          references: ['https://owasp.org/www-project-web-security-testing-guide/']
        });
      }
    } catch (error) {
      // File not accessible, which is good
    }
  }
  
  return findings;
}

async function checkDNSSecurity(domain: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  try {
    // Check for SPF record
    const spfResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
    const spfData = await spfResponse.json();
    
    const hasSpf = spfData.Answer?.some((record: any) => 
      record.data?.includes('v=spf1')
    );
    
    if (!hasSpf) {
      findings.push({
        severity: 'MEDIUM',
        category: 'DNS Security',
        title: 'Missing SPF Record',
        description: 'No SPF record found to prevent email spoofing',
        evidence: 'No TXT record containing v=spf1',
        remediation: 'Add SPF record to DNS: "v=spf1 -all" or appropriate configuration',
        references: ['https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/']
      });
    }
    
    // Check for DMARC record
    const dmarcResponse = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`);
    const dmarcData = await dmarcResponse.json();
    
    const hasDmarc = dmarcData.Answer?.some((record: any) => 
      record.data?.includes('v=DMARC1')
    );
    
    if (!hasDmarc) {
      findings.push({
        severity: 'MEDIUM',
        category: 'DNS Security',
        title: 'Missing DMARC Record',
        description: 'No DMARC policy configured for email authentication',
        evidence: 'No TXT record at _dmarc subdomain',
        remediation: 'Configure DMARC policy: "v=DMARC1; p=quarantine; rua=mailto:dmarc@domain.com"',
        references: ['https://dmarc.org/']
      });
    }
    
    // Check for CAA record
    const caaResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=257`);
    const caaData = await caaResponse.json();
    
    if (!caaData.Answer || caaData.Answer.length === 0) {
      findings.push({
        severity: 'LOW',
        category: 'DNS Security',
        title: 'Missing CAA Record',
        description: 'No CAA record to restrict certificate issuance',
        evidence: 'No CAA DNS record found',
        remediation: 'Add CAA record to specify authorized certificate authorities',
        references: ['https://support.dnsimple.com/articles/caa-record/']
      });
    }
    
  } catch (error) {
    console.error('[DNS] Check failed:', error);
  }
  
  return findings;
}

async function checkMisconfigurations(baseUrl: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  try {
    // Check robots.txt for sensitive information disclosure
    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    if (robotsResponse.ok) {
      const robotsText = await robotsResponse.text();
      
      if (robotsText.includes('admin') || robotsText.includes('private') || robotsText.includes('secret')) {
        findings.push({
          severity: 'LOW',
          category: 'Information Disclosure',
          title: 'Sensitive Paths in robots.txt',
          description: 'robots.txt file may disclose sensitive directory paths',
          evidence: 'Found admin/private/secret paths in robots.txt',
          remediation: 'Review robots.txt and remove references to sensitive directories',
          references: ['https://developers.google.com/search/docs/crawling-indexing/robots/intro']
        });
      }
    }
    
    // Check for directory listing
    const response = await fetch(baseUrl);
    const html = await response.text();
    
    if (html.includes('Index of /') || html.includes('Directory Listing')) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Configuration',
        title: 'Directory Listing Enabled',
        description: 'Server allows directory browsing',
        evidence: 'Directory listing detected in HTML response',
        remediation: 'Disable directory listing in server configuration',
        references: ['https://owasp.org/www-project-web-security-testing-guide/']
      });
    }
    
    // Check for server version disclosure
    if (response.headers.get('server')) {
      const serverHeader = response.headers.get('server');
      if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
        findings.push({
          severity: 'LOW',
          category: 'Information Disclosure',
          title: 'Server Version Disclosure',
          description: 'Server header reveals version information',
          evidence: `Server: ${serverHeader}`,
          remediation: 'Configure server to hide version information',
          references: ['https://owasp.org/www-project-web-security-testing-guide/']
        });
      }
    }
    
  } catch (error) {
    console.error('[MISCONFIG] Check failed:', error);
  }
  
  return findings;
}
