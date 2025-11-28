// Real-time Web Inspector Tools for NOMAD
// Performs actual website inspection like browser DevTools (F12)

export async function inspectWebsite(url: string): Promise<any> {
  try {
    console.log(`[WEB-INSPECTOR] Inspecting: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    
    // Parse HTML structure
    const findings = {
      url,
      status: response.status,
      headers: {
        server: headers['server'] || 'Not disclosed',
        powered_by: headers['x-powered-by'] || 'Not disclosed',
        content_type: headers['content-type'] || 'Unknown',
        security_headers: extractSecurityHeaders(html, headers)
      },
      
      // Form analysis
      forms: extractForms(html),
      
      // Input fields (including hidden)
      inputs: extractInputs(html),
      
      // JavaScript files
      scripts: extractScripts(html, url),
      
      // API endpoints discovered
      api_endpoints: extractAPIEndpoints(html),
      
      // External resources
      external_resources: extractExternalResources(html),
      
      // Comments (may contain sensitive info)
      comments: extractComments(html),
      
      // Meta tags
      meta_tags: extractMetaTags(html),
      
      // Links
      links: extractLinks(html, url),
      
      // Potential vulnerabilities
      vulnerabilities: detectVulnerabilities(html, headers),
      
      // Technology fingerprinting
      technologies: detectTechnologies(html, headers)
    };
    
    return {
      success: true,
      inspection_time: new Date().toISOString(),
      findings
    };
    
  } catch (error) {
    console.error("[WEB-INSPECTOR] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Inspection failed"
    };
  }
}

function extractForms(html: string): any[] {
  const forms: any[] = [];
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
  let match;
  
  while ((match = formRegex.exec(html)) !== null) {
    const formHtml = match[0];
    const actionMatch = /action=["']([^"']*)["']/i.exec(formHtml);
    const methodMatch = /method=["']([^"']*)["']/i.exec(formHtml);
    
    forms.push({
      action: actionMatch ? actionMatch[1] : 'Not specified',
      method: methodMatch ? methodMatch[1].toUpperCase() : 'GET',
      has_csrf_token: formHtml.includes('csrf') || formHtml.includes('_token'),
      input_count: (formHtml.match(/<input/gi) || []).length
    });
  }
  
  return forms;
}

function extractInputs(html: string): any[] {
  const inputs: any[] = [];
  const inputRegex = /<input[^>]*>/gi;
  let match;
  
  while ((match = inputRegex.exec(html)) !== null) {
    const input = match[0];
    const typeMatch = /type=["']([^"']*)["']/i.exec(input);
    const nameMatch = /name=["']([^"']*)["']/i.exec(input);
    const valueMatch = /value=["']([^"']*)["']/i.exec(input);
    
    const inputData: any = {
      type: typeMatch ? typeMatch[1] : 'text',
      name: nameMatch ? nameMatch[1] : 'unnamed'
    };
    
    if (inputData.type === 'hidden' && valueMatch) {
      inputData.value = valueMatch[1];
      inputData.security_concern = 'Hidden input with value exposed in HTML';
    }
    
    inputs.push(inputData);
  }
  
  return inputs;
}

function extractScripts(html: string, baseUrl: string): any[] {
  const scripts: any[] = [];
  const scriptRegex = /<script[^>]*src=["']([^"']*)["'][^>]*>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    let src = match[1];
    if (!src.startsWith('http')) {
      try {
        const base = new URL(baseUrl);
        src = new URL(src, base.origin).href;
      } catch {}
    }
    
    scripts.push({
      src,
      is_external: !src.includes(new URL(baseUrl).hostname),
      potential_risk: src.includes('jquery') && src.match(/jquery[.-](\d+\.\d+)/)?.[1] < '3.5' ? 'Outdated jQuery version' : null
    });
  }
  
  // Inline scripts
  const inlineRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineMatch;
  let inlineCount = 0;
  
  while ((inlineMatch = inlineRegex.exec(html)) !== null) {
    if (!inlineMatch[0].includes('src=')) {
      inlineCount++;
    }
  }
  
  if (inlineCount > 0) {
    scripts.push({
      type: 'inline',
      count: inlineCount,
      security_note: 'Inline scripts can be XSS vectors if not properly sanitized'
    });
  }
  
  return scripts;
}

function extractAPIEndpoints(html: string): string[] {
  const endpoints: Set<string> = new Set();
  
  // Common API patterns
  const patterns = [
    /["']([^"']*\/api\/[^"'\s]+)["']/gi,
    /["']([^"']*\/v\d+\/[^"'\s]+)["']/gi,
    /fetch\(["']([^"']+)["']/gi,
    /axios\.[a-z]+\(["']([^"']+)["']/gi,
    /\$\.(get|post|put|delete)\(["']([^"']+)["']/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const endpoint = match[1] || match[2];
      if (endpoint && endpoint.includes('/')) {
        endpoints.add(endpoint);
      }
    }
  });
  
  return Array.from(endpoints).slice(0, 20);
}

function extractExternalResources(html: string): any {
  const resources = {
    stylesheets: [] as string[],
    images: [] as string[],
    iframes: [] as string[],
    cdn_used: false
  };
  
  // CSS
  const cssRegex = /<link[^>]*href=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    if (match[0].includes('stylesheet')) {
      resources.stylesheets.push(match[1]);
    }
  }
  
  // Images
  const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    resources.images.push(match[1]);
  }
  
  // Iframes
  const iframeRegex = /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi;
  while ((match = iframeRegex.exec(html)) !== null) {
    resources.iframes.push(match[1]);
  }
  
  // Check for CDN usage
  resources.cdn_used = html.includes('cdn.') || html.includes('cloudflare') || 
                       html.includes('cloudfront') || html.includes('jsdelivr');
  
  return {
    stylesheets: resources.stylesheets.slice(0, 10),
    images_count: resources.images.length,
    iframes: resources.iframes,
    cdn_used: resources.cdn_used
  };
}

function extractComments(html: string): string[] {
  const comments: string[] = [];
  const commentRegex = /<!--([\s\S]*?)-->/g;
  let match;
  
  while ((match = commentRegex.exec(html)) !== null) {
    const comment = match[1].trim();
    if (comment.length > 10 && comment.length < 200) {
      // Check for sensitive information
      const hasSensitiveInfo = /password|key|token|secret|admin|debug|todo|fixme|hack/i.test(comment);
      if (hasSensitiveInfo) {
        comments.push(`⚠️ ${comment}`);
      } else if (comments.length < 5) {
        comments.push(comment);
      }
    }
  }
  
  return comments;
}

function extractMetaTags(html: string): any {
  const meta: any = {};
  const metaRegex = /<meta[^>]*>/gi;
  let match;
  
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const nameMatch = /name=["']([^"']*)["']/i.exec(tag);
    const contentMatch = /content=["']([^"']*)["']/i.exec(tag);
    
    if (nameMatch && contentMatch) {
      meta[nameMatch[1]] = contentMatch[1];
    }
  }
  
  return meta;
}

function extractLinks(html: string, baseUrl: string): any {
  const links = {
    internal: 0,
    external: 0,
    suspicious: [] as string[]
  };
  
  const hostname = new URL(baseUrl).hostname;
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    
    if (href.startsWith('http')) {
      if (href.includes(hostname)) {
        links.internal++;
      } else {
        links.external++;
        
        // Check for suspicious patterns
        if (/bit\.ly|tinyurl|goo\.gl|t\.co/i.test(href)) {
          links.suspicious.push(`URL shortener: ${href}`);
        }
      }
    }
  }
  
  return links;
}

function detectVulnerabilities(html: string, headers: any): any[] {
  const vulns: any[] = [];
  
  // Missing security headers
  if (!headers['strict-transport-security']) {
    vulns.push({
      type: 'Missing HSTS Header',
      severity: 'MEDIUM',
      description: 'Site does not enforce HTTPS connections',
      remediation: 'Add Strict-Transport-Security header'
    });
  }
  
  if (!headers['content-security-policy']) {
    vulns.push({
      type: 'Missing CSP',
      severity: 'MEDIUM',
      description: 'No Content Security Policy to prevent XSS',
      remediation: 'Implement Content-Security-Policy header'
    });
  }
  
  if (!headers['x-frame-options']) {
    vulns.push({
      type: 'Clickjacking Risk',
      severity: 'LOW',
      description: 'Site can be embedded in iframes',
      remediation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
    });
  }
  
  // Inline JavaScript (XSS risk)
  if (/<script[^>]*>(?!<\/script>)/i.test(html)) {
    vulns.push({
      type: 'Inline JavaScript',
      severity: 'LOW',
      description: 'Inline scripts found - potential XSS vector',
      remediation: 'Move JavaScript to external files with CSP'
    });
  }
  
  // Autocomplete on password fields
  if (/<input[^>]*type=["']password["'][^>]*autocomplete=["']on["']/i.test(html)) {
    vulns.push({
      type: 'Password Autocomplete Enabled',
      severity: 'LOW',
      description: 'Password fields allow autocomplete',
      remediation: 'Set autocomplete="off" on password inputs'
    });
  }
  
  // Forms without CSRF protection
  const formCount = (html.match(/<form/gi) || []).length;
  const csrfCount = (html.match(/csrf|_token/gi) || []).length;
  if (formCount > 0 && csrfCount === 0) {
    vulns.push({
      type: 'Missing CSRF Protection',
      severity: 'HIGH',
      description: `Found ${formCount} forms without apparent CSRF tokens`,
      remediation: 'Implement CSRF token validation on all forms'
    });
  }
  
  return vulns;
}

function detectTechnologies(html: string, headers: any): any {
  const tech: any = {
    server: headers['server'] || 'Unknown',
    hosting: [],
    frameworks: [],
    cms: null,
    analytics: [],
    libraries: [],
    backend: []
  };
  
  // Server identification
  if (headers['x-powered-by']) {
    tech.frameworks.push(headers['x-powered-by']);
  }
  
  // Hosting platform detection (accurate indicators)
  if (headers['x-vercel-id'] || headers['x-vercel-cache']) {
    tech.hosting.push('Vercel');
  }
  if (headers['server']?.includes('cloudflare')) {
    tech.hosting.push('Cloudflare');
  }
  if (html.includes('herokuapp.com')) {
    tech.hosting.push('Heroku');
  }
  if (headers['x-amz-cf-id'] || headers['x-amz-request-id']) {
    tech.hosting.push('AWS CloudFront');
  }
  
  // Framework detection (ONLY with strong evidence)
  // Next.js specific
  if (html.includes('__NEXT_DATA__') || html.includes('_next/static/')) {
    tech.frameworks.push('Next.js');
  }
  // Vite specific
  if (html.includes('/@vite/') || html.includes('type="module"') && html.includes('/assets/')) {
    tech.frameworks.push('Vite');
  }
  // Nuxt.js specific
  if (html.includes('__NUXT__')) {
    tech.frameworks.push('Nuxt.js');
  }
  
  // Backend/Database detection
  if (html.includes('supabase.co') || html.includes('supabase-js')) {
    tech.backend.push('Supabase');
  }
  if (html.includes('firebaseapp.com') || html.includes('firebase.js')) {
    tech.backend.push('Firebase');
  }
  if (html.includes('amplifyapp.com') || html.includes('aws-amplify')) {
    tech.backend.push('AWS Amplify');
  }
  
  // CMS detection
  if (html.includes('wp-content') || html.includes('wp-includes')) {
    tech.cms = 'WordPress';
  } else if (html.includes('/components/com_')) {
    tech.cms = 'Joomla';
  } else if (html.includes('Drupal.settings')) {
    tech.cms = 'Drupal';
  }
  
  // Analytics
  if (html.includes('google-analytics.com') || html.includes('gtag.js') || html.includes('ga.js')) {
    tech.analytics.push('Google Analytics');
  }
  if (html.includes('facebook.com/tr') || html.includes('fbevents.js')) {
    tech.analytics.push('Facebook Pixel');
  }
  if (html.includes('plausible.io')) {
    tech.analytics.push('Plausible');
  }
  if (html.includes('matomo')) {
    tech.analytics.push('Matomo');
  }
  
  // JavaScript libraries (ONLY with clear evidence)
  if (html.includes('jquery.min.js') || html.includes('jquery.js')) {
    const versionMatch = html.match(/jquery[.-](\d+\.\d+\.\d+)/i);
    tech.libraries.push(`jQuery ${versionMatch ? versionMatch[1] : '(version unknown)'}`);
  }
  // React - look for React-specific bundle patterns
  if (html.includes('react-dom') || html.includes('ReactDOM') || html.match(/\/_react[.-]/)) {
    tech.libraries.push('React');
  }
  // Vue - look for Vue-specific patterns
  if (html.includes('vue.js') || html.includes('vue.runtime') || html.includes('v-app')) {
    tech.libraries.push('Vue.js');
  }
  // Angular - look for Angular-specific patterns
  if (html.includes('ng-version') || html.includes('angular.js') || html.includes('ng-app')) {
    tech.libraries.push('Angular');
  }
  
  // Add confidence note
  tech.note = 'Technologies detected based on visible indicators. Some may be undetectable or hidden.';
  
  return tech;
}

export async function analyzeDOMStructure(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    return {
      success: true,
      analysis: {
        total_elements: (html.match(/<[a-z][^>]*>/gi) || []).length,
        divs: (html.match(/<div/gi) || []).length,
        spans: (html.match(/<span/gi) || []).length,
        forms: (html.match(/<form/gi) || []).length,
        inputs: (html.match(/<input/gi) || []).length,
        buttons: (html.match(/<button/gi) || []).length,
        links: (html.match(/<a/gi) || []).length,
        images: (html.match(/<img/gi) || []).length,
        scripts: (html.match(/<script/gi) || []).length,
        iframes: (html.match(/<iframe/gi) || []).length,
        estimated_complexity: calculateComplexity(html)
      }
    };
  } catch (error) {
    return { success: false, error: "DOM analysis failed" };
  }
}

function calculateComplexity(html: string): string {
  const elementCount = (html.match(/<[a-z][^>]*>/gi) || []).length;
  const scriptCount = (html.match(/<script/gi) || []).length;
  
  const score = elementCount + (scriptCount * 10);
  
  if (score < 500) return 'Simple';
  if (score < 2000) return 'Moderate';
  if (score < 5000) return 'Complex';
  return 'Very Complex';
}

function extractSecurityHeaders(html: string, headers: Record<string, string>) {
  // Check HTTP Response Headers (Server-level - STRONGEST protection)
  const httpHeaders = {
    hsts: headers['strict-transport-security'] || null,
    csp: headers['content-security-policy'] || null,
    xfo: headers['x-frame-options'] || null,
    xcto: headers['x-content-type-options'] || null,
    xss: headers['x-xss-protection'] || null,
    referrer: headers['referrer-policy'] || null
  };
  
  // Extract Meta Tags from HTML (Second-line defense)
  const metaTags = {
    hsts: null as string | null,
    csp: null as string | null,
    xfo: null as string | null,
    xcto: null as string | null,
    xss: null as string | null,
    referrer: null as string | null
  };
  
  // Parse meta tags with http-equiv
  const cspMatch = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([^"']+)["']/i);
  if (cspMatch) metaTags.csp = 'Present (meta tag)';
  
  const xfoMatch = html.match(/<meta\s+http-equiv=["']X-Frame-Options["']\s+content=["']([^"']+)["']/i);
  if (xfoMatch) metaTags.xfo = xfoMatch[1];
  
  const xctoMatch = html.match(/<meta\s+http-equiv=["']X-Content-Type-Options["']\s+content=["']([^"']+)["']/i);
  if (xctoMatch) metaTags.xcto = xctoMatch[1];
  
  const xssMatch = html.match(/<meta\s+http-equiv=["']X-XSS-Protection["']\s+content=["']([^"']+)["']/i);
  if (xssMatch) metaTags.xss = xssMatch[1];
  
  const refMatch = html.match(/<meta\s+http-equiv=["']Referrer-Policy["']\s+content=["']([^"']+)["']/i);
  if (refMatch) metaTags.referrer = refMatch[1];
  
  // Build report with protection levels
  return {
    hsts: {
      value: httpHeaders.hsts || metaTags.hsts || '❌ Missing',
      level: httpHeaders.hsts ? '🛡️ SERVER' : metaTags.hsts ? '⚠️ META' : '🚨 MISSING'
    },
    csp: {
      value: httpHeaders.csp || metaTags.csp || '❌ Missing',
      level: httpHeaders.csp ? '🛡️ SERVER' : metaTags.csp ? '⚠️ META' : '🚨 MISSING'
    },
    xfo: {
      value: httpHeaders.xfo || metaTags.xfo || '❌ Missing',
      level: httpHeaders.xfo ? '🛡️ SERVER' : metaTags.xfo ? '⚠️ META' : '🚨 MISSING'
    },
    xcto: {
      value: httpHeaders.xcto || metaTags.xcto || '❌ Missing',
      level: httpHeaders.xcto ? '🛡️ SERVER' : metaTags.xcto ? '⚠️ META' : '🚨 MISSING'
    },
    xss: {
      value: httpHeaders.xss || metaTags.xss || '❌ Missing',
      level: httpHeaders.xss ? '🛡️ SERVER' : metaTags.xss ? '⚠️ META' : '🚨 MISSING'
    },
    referrer: {
      value: httpHeaders.referrer || metaTags.referrer || '❌ Missing',
      level: httpHeaders.referrer ? '🛡️ SERVER' : metaTags.referrer ? '⚠️ META' : '🚨 MISSING'
    },
    overall: {
      http_count: Object.values(httpHeaders).filter(v => v !== null).length,
      meta_count: Object.values(metaTags).filter(v => v !== null).length,
      recommendation: Object.values(httpHeaders).filter(v => v !== null).length === 0 && 
                     Object.values(metaTags).filter(v => v !== null).length > 0 ?
        '⚠️ Using meta tags - Configure server headers at Cloudflare for stronger protection' :
        Object.values(httpHeaders).filter(v => v !== null).length < 6 ?
        '🚨 Missing critical headers - Configure immediately' :
        '✅ Properly configured'
    }
  };
}
