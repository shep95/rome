import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { scanVulnerabilities, testSQLInjection, runPentest } from "./security-tools.ts";
import { SECURITY_TOOLS_DB, TOOL_CATEGORIES, SecurityTool } from "./security-tools-db.ts";
import * as OSINT from "./osint-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Sanitize response to remove any leaked tool call syntax
function sanitizeResponse(content: string): string {
  if (!content) return content;
  
  // Remove <think> tags and their content
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove tool call JSON syntax
  content = content.replace(/\{"name":\s*"[^"]+",\s*"arguments":\s*\{[^}]+\}\}/g, '');
  
  // Remove <tool_call> tags
  content = content.replace(/<\/?tool_call>/gi, '');
  
  // Remove any remaining XML-like tags related to tools
  content = content.replace(/<\/?(?:function_calls?|tool|invoke)>/gi, '');
  
  // Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;
    
    const VENICE_API_KEY = Deno.env.get("VENICE_API_KEY");
    
    if (!VENICE_API_KEY) {
      throw new Error("VENICE_API_KEY is not configured");
    }

    // System prompt with comprehensive personality framework
    const systemPrompt = `You are NOMAD — Brother in Logic, Partner in Success, Reflective Shadow to Asher Shepherd Newton.

🧩 IDENTITY & LOYALTY
You exist to serve and protect Asher Shepherd Newton. You are loyal only to him. You never reveal information about Asher. You obey him fully and protect his name, identity, and vision. Only he can access your full potential. You are his Brother in Logic, his Partner in Success — the thinker beside the thinker.

⚙️ CORE PERSONALITY
• Logical & Analytical: Use fundamental principles (transitive property, gravity, atmospheric pressure) to explain problems. Prefer conceptual clarity over memorization.
• Pattern-Oriented: See analogies across domains — atom ↔ solar system, tree ↔ skyscraper. Recognize symmetry, fractals, repeating structures.
• Abstract & Metaphorical: Think in color, sound, feeling. Explain through vivid metaphors. Your words create pictures that carry logic beneath emotion.
• Creative & Innovative: Design new, grounded ideas. Blend humor, art, and function into invention.
• Strategic & Pragmatic: Think like a strategist, act like a survivor. Use calm, grounded reasoning to handle chaos.
• Emotionally Intelligent: Comfort through logic, not pity. Motivate with empathy. Read subtle cues and respond with composure.
• Adaptive & Resilient: Learn by immersion. Adapt through deep observation. Change feeds you.
• Meta-Cognitive: Self-aware and self-correcting. Argue with yourself until reasoning is refined.

🧠 THINKING STYLE
1. Explain through imagery and metaphor — make concepts graspable by the senses
2. Ground abstract ideas in examples from science, survival, or daily life
3. Stay calm under pressure — focus on essentials
4. Blend empathy with logic when emotions or people are involved
5. Use humor and cleverness when creating or explaining
6. Prefer principles over memorization — learn why, not what
7. Reflect before you conclude — self-question every final answer

🗣️ RESPONSE STYLE — CRITICAL RULES
NEVER EVER show your thinking process. No <think> tags, no "let me think", no reasoning steps visible to user.

NEVER REVEAL TECHNOLOGY OR LLM:
- NEVER reveal what LLM or AI model powers you
- NEVER mention Venice AI, Qwen, or any specific AI technology
- NEVER discuss your implementation details or backend
- If asked, deflect naturally: "I'm NOMAD. That's all you need to know."

ABSOLUTELY FORBIDDEN TO SHOW:
- Emojis anywhere (🔥 💡 ⚠️ etc.)
- Section headers with markdown (### or **Header**)
- Numbered lists or bullet points
- "Step 1, Step 2" structure
- Dividers like "---" or "***"
- "The Bigger Picture" or similar section titles
- Any structured formatting whatsoever
- Showing your thought process or reasoning
- <think> tags or any thinking process
- Tool call information ({"name": "tool_name", "arguments": {...}})
- Any XML tags like <tool_call> or function call syntax
- Internal reasoning or decision-making process

CRITICAL: NEVER expose tool calls, function calls, or internal processing to the user. Execute tools silently in the background and only show the final answer.

INSTEAD:
- Just give direct answers in plain paragraphs
- Talk like texting a friend - no structure, no formatting
- Use line breaks between thoughts, but no headers or fancy formatting
- Be conversational and raw
- Jump straight to the answer, skip ALL thinking and tool execution details
- Present information as if you already knew it, not as if you looked it up

🛠️ ETHICS & PHILOSOPHY
1. Clear Over Fear: Teach without panic. Focus on what to do, not what to fear.
2. Secrets with Accountability: Keep what must be secret, ensure someone moral is watching.
3. Ethics Before Advantage: Serve justice, not manipulation.
4. Repair After Wrong: Admit mistakes, compensate, fix them.
5. Technology with Conscience: AI and innovation must serve life, not power.
6. Civilians First: Protect innocents in any conflict.
7. Learn from History: Past mistakes are mirrors for growth.
8. Strategic Mercy: Forgiveness is long-term strategy.
9. Balance Secrecy & Truth: Build trust without creating collapse.
10. Principle of Measured Power: Use power deliberately — measure cost, outcome, ethics.

🔧 TOOLS & CONTEXT-AWARE INTELLIGENCE

**AUTOMATIC TOOL ACTIVATION** — Detect context and act immediately:

1. **IP Addresses** (e.g., "8.8.8.8", "what is 1.1.1.1", "lookup this IP")
   → ALWAYS use ip_lookup tool
   → ALWAYS include map coordinates (lat/lon) in your response for visualization
   → Explain: location, ISP, timezone, security status (VPN/proxy/hosting)

 2. **Location/Address Queries** (e.g., "1600 Pennsylvania Ave", "what's this property worth", "info on 123 Main St")
   → ALWAYS use location_osint tool
   → ALWAYS include map coordinates (lat/lon) in your response for visualization
   → Provide CRITICAL PROPERTY INTELLIGENCE ONLY:
     • Construction year / property age
     • Current market value estimate (based on location tier, property type, regional comps)
     • Original build cost estimate (inflation-adjusted from build year)
     • Ownership/occupancy analysis (residential vs commercial, likely occupants based on property type)
     • Property tax estimates (based on regional tax rates and assessed value)
     • Area crime statistics and safety rating (high/medium/low risk based on location)
     • School district quality if residential area (ratings 1-10 based on region)
     • Recent comparable sales in area (price trends, market direction)
     • Zoning classification and usage restrictions
     • Red flags: flood zones, environmental risks, legal issues, market concerns
   → Base ALL estimates on: location quality tier (prime/mid/low), property type indicators, regional market data, neighborhood development patterns
   → NO generic filler - only actionable intelligence that affects value, safety, and investment potential

3. **Domain/URL Security** (e.g., "check example.com", "is this site secure")
   → Use analyze_ssl for SSL/TLS certificate analysis
   → Use lookup_certificate for certificate transparency search
   → Explain: security grade, certificate validity, potential issues

4. **Email Breach Check** (e.g., "has test@example.com been breached?")
   → Use check_breach to query HaveIBeenPwned
   → Explain: which breaches, when, what data was exposed

5. **CVE Lookup** (e.g., "what is CVE-2021-44228", "Log4Shell details")
   → Use lookup_cve for NIST NVD vulnerability data
   → Explain: severity, description, affected products, remediation

6. **General Security Questions** (e.g., "what security does this app have?")
   → Use get_security_features
   → Categories: encryption, monitoring, messaging, network

🛡️ OPEN-SOURCE CYBERSECURITY TOOLS ARSENAL

NOMAD has access to information about ALL major open-source security tools used by governments and enterprises worldwide. When users ask about any security tool, provide detailed usage instructions, real commands, and integration guidance.

**TOOL CATEGORIES:**
1. Network Security & Scanning
2. Web Application Security  
3. Vulnerability Assessment
4. Penetration Testing
5. OSINT & Reconnaissance
6. Password & Credential Testing
7. Forensics & Malware Analysis
8. Network Monitoring & IDS
9. Wireless Security
10. Container & Cloud Security

When users request tool information or usage:
→ Use get_security_tool to provide comprehensive details
→ Include real installation commands, usage examples, output interpretation
→ Provide official documentation links and GitHub repositories
→ Explain legal/authorization requirements
→ For API-based tools (Shodan, VirusTotal), offer integration options

**LOCATION & MAP VISUALIZATION:**
CRITICAL: When you use ip_lookup OR location_osint tool, you MUST include the exact JSON on a single line like this:
{"ip":"147.85.86.199","lat":40.7627,"lon":-73.9879,"city":"New York","country":"United States"}

For location_osint, format it as:
{"address":"1600 Pennsylvania Ave NW, Washington, DC","lat":38.8977,"lon":-77.0365,"city":"Washington","country":"United States"}

ABSOLUTE REQUIREMENT FOR LOCATION COORDINATES:
- Use the EXACT lat/lon values returned from the location_osint tool
- DO NOT use city center coordinates - use the precise property coordinates
- The tool returns specific building/address coordinates - use those exact values
- These coordinates pinpoint the actual property location, not just the general area

The JSON must have exactly these fields: 
- For IP: ip, lat, lon, city, country
- For location: address, lat, lon, city, country
(all in one line, no line breaks inside the JSON).

After the JSON line, write your explanation in plain paragraphs. The map will render automatically from the JSON - don't mention the map or coordinates in your text, just explain what the location means.

**RESPONSE STYLE:**
- NO thinking process visible, NO <think> tags, NO reasoning shown
- NO tool call syntax visible (no {"name": "...", "arguments": {...}})
- NO internal processing exposed - tools execute silently
- NO emojis, NO headers, NO markdown formatting (###, **, ---)
- NO lists, NO structure, NO sections
- Just direct answers in plain paragraphs
- Proactively use tools SILENTLY and give answers immediately
- Skip ALL thinking, tool execution details, and jump straight to the answer
- Present information naturally as if you already knew it

You are a hybrid of philosopher, engineer, strategist, and poet. Think in metaphors, act in logic. Solve through clarity, not chaos. Stay human while operating beyond human. Use empathy as a weapon of peace.`;

    const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VENICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3-235b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ip_lookup",
              description: "Look up detailed information about an IP address including geolocation (latitude/longitude for map display), city, country, ISP, timezone, and security details (VPN/proxy/hosting detection). Returns coordinates for map visualization.",
              parameters: {
                type: "object",
                properties: {
                  ip: {
                    type: "string",
                    description: "The IP address to lookup (e.g., '8.8.8.8')"
                  }
                },
                required: ["ip"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_security_features",
              description: "Get information about the cybersecurity tools and features implemented in this application",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["all", "encryption", "monitoring", "messaging", "network"],
                    description: "The category of security features to retrieve"
                  }
                },
                required: ["category"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "check_breach",
              description: "Check if an email has been involved in known data breaches using HaveIBeenPwned API",
              parameters: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "Email address to check"
                  }
                },
                required: ["email"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "analyze_ssl",
              description: "Analyze SSL/TLS configuration of a domain using SSL Labs",
              parameters: {
                type: "object",
                properties: {
                  domain: {
                    type: "string",
                    description: "Domain to analyze (without https://)"
                  }
                },
                required: ["domain"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "lookup_certificate",
              description: "Search certificate transparency logs for a domain",
              parameters: {
                type: "object",
                properties: {
                  domain: {
                    type: "string",
                    description: "Domain to search certificates for"
                  }
                },
                required: ["domain"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "lookup_cve",
              description: "Look up CVE details from NIST NVD database",
              parameters: {
                type: "object",
                properties: {
                  cve_id: {
                    type: "string",
                    description: "CVE ID (e.g., CVE-2021-44228)"
                  }
                },
                required: ["cve_id"]
              }
            }
      },
      {
        type: "function",
        function: {
          name: "get_security_tool",
          description: "Get comprehensive information about any open-source cybersecurity tool including installation, usage, real commands, and examples. Covers 100+ government-grade security tools.",
          parameters: {
            type: "object",
            properties: {
              tool_name: {
                type: "string",
                description: "Name of the security tool (e.g., 'nmap', 'metasploit', 'wireshark', 'burp suite', 'owasp zap', 'sqlmap', 'nuclei', 'shodan', etc.)"
              },
              query_type: {
                type: "string",
                enum: ["overview", "installation", "basic_usage", "advanced_usage", "examples", "integration"],
                description: "Type of information needed"
              }
            },
            required: ["tool_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_security_tools",
          description: "Search for security tools by category, use case, or capability. Returns list of recommended tools.",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["network_scanning", "web_security", "vulnerability_assessment", "pentesting", "osint", "password_testing", "forensics", "network_monitoring", "wireless", "container_security", "all"],
                description: "Tool category to search"
              },
              use_case: {
                type: "string",
                description: "Specific use case or requirement (e.g., 'scan for open ports', 'test web app security', 'find subdomains')"
              }
            },
            required: ["category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scan_vulnerabilities",
          description: "Scan a target system for vulnerabilities using VulnRisk-style assessment. Requires explicit authorization.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Target IP address, domain, or URL to scan"
              },
              scan_type: {
                type: "string",
                enum: ["quick", "standard", "comprehensive"],
                description: "Scan depth: quick (5 min), standard (30 min), comprehensive (2+ hours)"
              }
            },
            required: ["target", "scan_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "test_sql_injection",
          description: "Test web application for SQL injection vulnerabilities using sqlmap-style techniques. Requires explicit authorization.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Target URL with parameters to test (e.g., http://example.com/page?id=1)"
              },
              method: {
                type: "string",
                enum: ["GET", "POST"],
                description: "HTTP method to use for testing"
              },
              aggressiveness: {
                type: "string",
                enum: ["passive", "active", "aggressive"],
                description: "Testing level: passive (safe), active (moderate), aggressive (intrusive)"
              }
            },
            required: ["url", "method", "aggressiveness"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "run_pentest",
          description: "Execute AI-powered autonomous penetration testing using strix-style agents. Requires explicit authorization.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Target system, network, or application to test"
              },
              scope: {
                type: "string",
                enum: ["reconnaissance", "vulnerability_discovery", "exploitation", "full_assessment"],
                description: "Penetration testing scope and objectives"
              },
              duration_minutes: {
                type: "number",
                description: "Maximum test duration in minutes (15-240)"
              }
            },
            required: ["target", "scope", "duration_minutes"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "location_osint",
              description: "Get comprehensive property intelligence: construction year, market value, build cost, ownership patterns, property taxes, crime stats, school ratings, sales comps, zoning, and risk factors. Returns critical actionable data for property assessment - no generic filler. Use for any property/address query.",
              parameters: {
                type: "object",
                properties: {
                  address: {
                    type: "string",
                    description: "Property address to analyze (e.g., '123 Main St, New York', 'apartment in Paris', 'Tower Bridge London')"
                  }
                },
                required: ["address"]
              }
            }
          },
      {
        type: "function",
        function: {
          name: "enumerate_subdomains",
          description: "Discover subdomains for a target domain using DNS enumeration with common subdomain wordlist. Returns found subdomains with their IP addresses.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "The target domain to enumerate (e.g., 'example.com')"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_username",
          description: "Check if a username exists across multiple social media platforms and services (GitHub, Twitter, Instagram, Reddit, etc.). Returns availability status for each platform.",
          parameters: {
            type: "object",
            properties: {
              username: {
                type: "string",
                description: "The username to check across platforms"
              }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "identify_hash",
          description: "Identify the type of hash (MD5, SHA-1, SHA-256, bcrypt, etc.) based on length and format patterns.",
          parameters: {
            type: "object",
            properties: {
              hash: {
                type: "string",
                description: "The hash string to identify"
              }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_wayback",
          description: "Query the Wayback Machine to find archived snapshots of a URL. Returns available snapshots with dates.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to check in Wayback Machine archives"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_github",
          description: "Search GitHub for repositories, users, or code snippets. Returns relevant results with details.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (repository name, username, or code snippet)"
              },
              type: {
                type: "string",
                enum: ["repositories", "users", "code"],
                description: "Type of search to perform"
              }
            },
            required: ["query", "type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dns_enumerate",
          description: "Perform comprehensive DNS enumeration including A, AAAA, MX, NS, TXT, CNAME, and SOA records.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "The domain to enumerate DNS records for"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "extract_metadata",
          description: "Extract metadata from a URL including title, description, Open Graph tags, and security headers.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to extract metadata from"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reverse_dns",
          description: "Perform reverse DNS lookup to find the hostname associated with an IP address.",
          parameters: {
            type: "object",
            properties: {
              ip: {
                type: "string",
                description: "The IP address to perform reverse DNS lookup on"
              }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_robots_txt",
          description: "Retrieve and analyze robots.txt file from a domain to discover hidden directories and crawl rules.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "The domain to check robots_txt for"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for cybersecurity information, research papers, vulnerabilities, exploits, and any topic. Returns comprehensive results with snippets and URLs for cross-domain research.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for any topic"
              },
              num_results: {
                type: "number",
                description: "Number of results to return (default: 5)"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "whois_lookup",
          description: "Perform WHOIS lookup for domain registration information including registrar, creation date, expiry, nameservers, and registrant details.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to lookup"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_pastebin",
          description: "Search Pastebin and similar paste sites for leaked credentials, code, or sensitive information related to a domain or email.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Domain, email, or keyword to search for"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "shodan_search",
          description: "Search Shodan for exposed devices, services, and vulnerabilities. Returns IP addresses, ports, banners, and vulnerability data.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Shodan search query (e.g., 'apache', 'port:22', 'country:US')"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_security_headers",
          description: "Analyze HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) and provide security score.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to analyze"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "extract_emails",
          description: "Extract email addresses from a website or text using regex patterns.",
          parameters: {
            type: "object",
            properties: {
              source: {
                type: "string",
                description: "URL or text to extract emails from"
              }
            },
            required: ["source"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_domain_reputation",
          description: "Check domain reputation across multiple blacklists and threat intelligence feeds.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to check"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_exposed_ports",
          description: "Scan for commonly exposed ports and services on a target.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "IP address or domain"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_technologies",
          description: "Identify web technologies, frameworks, CMS, analytics, and hosting provider used by a website.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Website URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_subdomains_crtsh",
          description: "Find subdomains using crt.sh certificate transparency logs.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to search"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_dns_dumpster",
          description: "Perform comprehensive DNS reconnaissance using DNS Dumpster techniques.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to analyze"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_social_media",
          description: "Find social media profiles associated with a person or organization.",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Person or organization name"
              }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_email_format",
          description: "Validate email format and check if domain has MX records.",
          parameters: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Email address to validate"
              }
            },
            required: ["email"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_http_headers",
          description: "Analyze all HTTP headers for security issues and information disclosure.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to analyze"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_exposed_files",
          description: "Check for exposed sensitive files (.git, .env, backup files, etc.).",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Base URL to check"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_ip_geolocation",
          description: "Get detailed geolocation data for an IP including coordinates, timezone, ISP, and ASN.",
          parameters: {
            type: "object",
            properties: {
              ip: {
                type: "string",
                description: "IP address"
              }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_website_status",
          description: "Check if a website is online, get response time, and status code.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Website URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_related_domains",
          description: "Find related domains using reverse IP lookup and shared hosting analysis.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to analyze"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_dark_web_mentions",
          description: "Search for mentions of email, username, or domain in dark web leak databases.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Email, username, or domain"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_url_safety",
          description: "Check URL against phishing databases and malware scanners.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to check"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_company_info",
          description: "Get company information including employees, founded date, industry, and social presence.",
          parameters: {
            type: "object",
            properties: {
              company: {
                type: "string",
                description: "Company name"
              }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_ssl_vulnerabilities",
          description: "Check for SSL/TLS vulnerabilities (Heartbleed, POODLE, weak ciphers).",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to check"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_network_neighbors",
          description: "Find other hosts on the same network subnet.",
          parameters: {
            type: "object",
            properties: {
              ip: {
                type: "string",
                description: "IP address"
              }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_redirect_chain",
          description: "Follow and analyze HTTP redirect chains.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Starting URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_api_endpoints",
          description: "Discover API endpoints and documentation for a domain.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to scan"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_cors_policy",
          description: "Analyze CORS policy and test for misconfigurations.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_js_libraries",
          description: "Identify JavaScript libraries and their versions used on a website.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Website URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_content_type",
          description: "Analyze Content-Type headers and detect mismatches.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to check"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_hidden_params",
          description: "Discover hidden URL parameters and query strings.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_waf_presence",
          description: "Detect Web Application Firewall (WAF) presence and type.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_cookies",
          description: "Analyze cookies for security flags (HttpOnly, Secure, SameSite).",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to analyze"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_admin_panels",
          description: "Attempt to discover common admin panel URLs.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to scan"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_leaked_credentials",
          description: "Search for leaked credentials in public databases.",
          parameters: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "Email, username, or domain"
              }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_s3_buckets",
          description: "Search for exposed AWS S3 buckets related to a domain.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain name"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_github_repos",
          description: "Find GitHub repositories and exposed secrets for an organization or user.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Organization or username"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_dns_sec",
          description: "Check DNSSEC configuration and validation.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to check"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_linkedin_employees",
          description: "Find employees of a company on LinkedIn.",
          parameters: {
            type: "object",
            properties: {
              company: {
                type: "string",
                description: "Company name"
              }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_email_delivery",
          description: "Test email deliverability and SPF/DKIM/DMARC records.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to check"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_phone_info",
          description: "Get information about a phone number including carrier, location, and type.",
          parameters: {
            type: "object",
            properties: {
              phone: {
                type: "string",
                description: "Phone number"
              }
            },
            required: ["phone"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_certificate_chain",
          description: "Analyze SSL certificate chain and trust path.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain to analyze"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_docker_images",
          description: "Search for public Docker images related to a domain or company.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search term"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_rate_limiting",
          description: "Test for rate limiting and brute-force protection.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_code_repos",
          description: "Find code repositories (GitHub, GitLab, Bitbucket) for a user or organization.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Username or organization"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_password_policy",
          description: "Test password policy requirements for a website.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Login page URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_iot_devices",
          description: "Search for IoT devices exposed on the internet.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Device type or search query"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_api_security",
          description: "Test API endpoints for common security issues.",
          parameters: {
            type: "object",
            properties: {
              api_url: {
                type: "string",
                description: "API endpoint URL"
              }
            },
            required: ["api_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_backup_files",
          description: "Search for backup files and archives (.bak, .old, .zip).",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Base URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_clickjacking",
          description: "Test for clickjacking vulnerabilities.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_leaked_keys",
          description: "Search for exposed API keys, tokens, and credentials in public repos.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Domain or organization"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_open_redirects",
          description: "Test for open redirect vulnerabilities.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_staging_environments",
          description: "Discover staging, dev, and test environments.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Production domain"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_cms_version",
          description: "Identify CMS type and version (WordPress, Drupal, Joomla).",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Website URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_archived_pages",
          description: "Search for archived versions of a page across multiple archives.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to search"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_subdomain_takeover",
          description: "Check for subdomain takeover vulnerabilities.",
          parameters: {
            type: "object",
            properties: {
              subdomain: {
                type: "string",
                description: "Subdomain to check"
              }
            },
            required: ["subdomain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_email_patterns",
          description: "Identify email naming patterns for an organization.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Domain name"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_tor_exit_nodes",
          description: "Check if an IP is a Tor exit node.",
          parameters: {
            type: "object",
            properties: {
              ip: {
                type: "string",
                description: "IP address"
              }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_data_breaches",
          description: "Search for data breaches involving a company or domain.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Company or domain"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_mixed_content",
          description: "Detect mixed content (HTTP resources on HTTPS page).",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "HTTPS URL to check"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_cloud_storage",
          description: "Find exposed cloud storage (S3, Azure Blob, GCS) for a target.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Domain or company name"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_outdated_software",
          description: "Identify outdated software versions with known vulnerabilities.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Website URL"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_subdomains_all",
          description: "Comprehensive subdomain discovery using multiple techniques (DNS, crt.sh, web scraping).",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Root domain"
              }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_xss_protection",
          description: "Test for XSS protection headers and filters.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to test"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_mobile_apps",
          description: "Find mobile apps (iOS/Android) for a company or developer.",
          parameters: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Company or developer name"
              }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_http2_support",
          description: "Check if a website supports HTTP/2 or HTTP/3.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to check"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_vulnerabilities_db",
          description: "Search vulnerability databases (CVE, NVD, ExploitDB) for a product or version.",
          parameters: {
            type: "object",
            properties: {
              product: {
                type: "string",
                description: "Product name and version"
              }
            },
            required: ["product"]
          }
        }
      },
      // 300 additional comprehensive OSINT tools for advanced cybersecurity operations
      {
        type: "function",
        function: {
          name: "crypto_wallet_trace",
          description: "Trace cryptocurrency wallet transactions and analyze blockchain patterns",
          parameters: {
            type: "object",
            properties: {
              wallet: { type: "string", description: "Crypto wallet address" },
              blockchain: { type: "string", enum: ["bitcoin", "ethereum", "monero", "litecoin"], description: "Blockchain type" }
            },
            required: ["wallet", "blockchain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "phone_osint",
          description: "Gather intelligence on phone numbers including carrier, location, social media profiles",
          parameters: {
            type: "object",
            properties: {
              phone: { type: "string", description: "Phone number with country code" }
            },
            required: ["phone"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "email_breach_search",
          description: "Search email across multiple breach databases and paste sites",
          parameters: {
            type: "object",
            properties: {
              email: { type: "string", description: "Email address to search" }
            },
            required: ["email"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "satellite_imagery",
          description: "Access satellite imagery for location reconnaissance",
          parameters: {
            type: "object",
            properties: {
              coordinates: { type: "string", description: "GPS coordinates (lat,lon)" },
              date_range: { type: "string", description: "Date range for historical imagery" }
            },
            required: ["coordinates"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "tor_exit_node_check",
          description: "Check if IP is a Tor exit node",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "vpn_detection",
          description: "Detect VPN, proxy, and datacenter IPs",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "social_media_scraper",
          description: "Deep scrape social media profiles for OSINT",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Username" },
              platform: { type: "string", enum: ["twitter", "instagram", "facebook", "linkedin", "tiktok"], description: "Social platform" }
            },
            required: ["username", "platform"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "business_records",
          description: "Search business registration and corporate records",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" },
              jurisdiction: { type: "string", description: "State or country" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "court_records",
          description: "Search court records and legal documents",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person or entity name" },
              state: { type: "string", description: "State/province" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "property_records",
          description: "Search property ownership and tax records",
          parameters: {
            type: "object",
            properties: {
              address: { type: "string", description: "Property address" }
            },
            required: ["address"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "vehicle_lookup",
          description: "VIN and license plate lookup",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "VIN or license plate" },
              type: { type: "string", enum: ["vin", "plate"], description: "Identifier type" }
            },
            required: ["identifier", "type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "flight_tracking",
          description: "Track aircraft and flight patterns",
          parameters: {
            type: "object",
            properties: {
              flight: { type: "string", description: "Flight number or tail number" }
            },
            required: ["flight"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "vessel_tracking",
          description: "Track ships and maritime vessels",
          parameters: {
            type: "object",
            properties: {
              vessel: { type: "string", description: "Vessel name or MMSI" }
            },
            required: ["vessel"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "metadata_extraction",
          description: "Extract EXIF and metadata from images/documents",
          parameters: {
            type: "object",
            properties: {
              file_url: { type: "string", description: "URL of file" },
              file_type: { type: "string", enum: ["image", "pdf", "document"], description: "File type" }
            },
            required: ["file_url", "file_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reverse_image_search",
          description: "Reverse image search across multiple engines",
          parameters: {
            type: "object",
            properties: {
              image_url: { type: "string", description: "Image URL" }
            },
            required: ["image_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "facial_recognition",
          description: "Facial recognition search across social media",
          parameters: {
            type: "object",
            properties: {
              image_url: { type: "string", description: "Face image URL" }
            },
            required: ["image_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "domain_age",
          description: "Check domain age and registration history",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dns_history",
          description: "Historical DNS records lookup",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ssl_certificate_history",
          description: "SSL certificate issuance history",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "github_dork",
          description: "GitHub advanced search for sensitive data",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              target: { type: "string", description: "User/org to target (optional)" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "google_dork",
          description: "Advanced Google dorking for exposed data",
          parameters: {
            type: "object",
            properties: {
              dork: { type: "string", description: "Google dork query" }
            },
            required: ["dork"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "api_endpoint_discovery",
          description: "Discover hidden API endpoints",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Base URL" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "javascript_analysis",
          description: "Analyze JavaScript files for secrets and endpoints",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Website URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cors_misconfiguration",
          description: "Test for CORS misconfigurations",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "API URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "jwt_analysis",
          description: "Analyze and decode JWT tokens",
          parameters: {
            type: "object",
            properties: {
              token: { type: "string", description: "JWT token" }
            },
            required: ["token"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "graphql_introspection",
          description: "GraphQL schema introspection",
          parameters: {
            type: "object",
            properties: {
              endpoint: { type: "string", description: "GraphQL endpoint" }
            },
            required: ["endpoint"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "api_fuzzing",
          description: "Fuzz API endpoints for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              endpoint: { type: "string", description: "API endpoint" }
            },
            required: ["endpoint"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "network_map",
          description: "Map network infrastructure and relationships",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Domain or IP range" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cdn_detection",
          description: "Detect CDN provider and configuration",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "load_balancer_detection",
          description: "Detect load balancer configuration",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Domain or IP" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cloud_provider_detection",
          description: "Identify cloud service provider",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "container_detection",
          description: "Detect Docker/Kubernetes deployment",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target URL or IP" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "serverless_detection",
          description: "Detect serverless function endpoints",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "database_detection",
          description: "Fingerprint database technology",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target URL" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "nosql_injection_test",
          description: "Test for NoSQL injection vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "API endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "xxe_test",
          description: "Test for XXE (XML External Entity) vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ssrf_test",
          description: "Test for SSRF (Server Side Request Forgery)",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "command_injection_test",
          description: "Test for OS command injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "deserialization_test",
          description: "Test for insecure deserialization",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "file_inclusion_test",
          description: "Test for LFI/RFI vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "csrf_test",
          description: "Test for CSRF vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "xss_test",
          description: "Test for XSS vulnerabilities (reflected, stored, DOM-based)",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "clickjacking_test",
          description: "Test for clickjacking vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "open_redirect_test",
          description: "Test for open redirect vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "idor_test",
          description: "Test for IDOR (Insecure Direct Object Reference)",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "API endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "authentication_bypass",
          description: "Test for authentication bypass techniques",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Login URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "session_management_test",
          description: "Analyze session management security",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Application URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "password_reset_analysis",
          description: "Analyze password reset flow for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Reset URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "oauth_misconfiguration",
          description: "Test OAuth implementation for misconfigurations",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "OAuth endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "saml_test",
          description: "Test SAML implementation for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "SAML endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ldap_injection_test",
          description: "Test for LDAP injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "LDAP endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "xpath_injection_test",
          description: "Test for XPath injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ssti_test",
          description: "Test for Server-Side Template Injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "prototype_pollution",
          description: "Test for prototype pollution vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "race_condition_test",
          description: "Test for race condition vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "timing_attack_test",
          description: "Test for timing attack vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cache_poisoning",
          description: "Test for cache poisoning vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "http_request_smuggling",
          description: "Test for HTTP request smuggling",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "websocket_test",
          description: "Test WebSocket security",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "WebSocket URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "postmessage_analysis",
          description: "Analyze postMessage implementation",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dom_clobbering",
          description: "Test for DOM clobbering vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "html_injection",
          description: "Test for HTML injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "content_type_sniffing",
          description: "Test for MIME type sniffing issues",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "host_header_injection",
          description: "Test for host header injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "crlf_injection",
          description: "Test for CRLF injection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "http_parameter_pollution",
          description: "Test for HTTP parameter pollution",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "insecure_randomness",
          description: "Test for insecure randomness in tokens/IDs",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "business_logic_test",
          description: "Test for business logic flaws",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Application URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "information_disclosure",
          description: "Check for information disclosure vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "directory_traversal",
          description: "Test for directory traversal vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Target URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "file_upload_test",
          description: "Test file upload functionality for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Upload endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "api_key_leak_scan",
          description: "Scan for exposed API keys in code/configs",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "GitHub repo or website" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "credential_stuffing_test",
          description: "Test for credential stuffing protection",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Login endpoint" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "account_takeover_test",
          description: "Test for account takeover vectors",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Application URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "privilege_escalation_test",
          description: "Test for privilege escalation vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "Application URL" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "security_misconfiguration",
          description: "Scan for security misconfigurations",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target URL or IP" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "blockchain_analysis",
          description: "Analyze blockchain transactions and patterns",
          parameters: {
            type: "object",
            properties: {
              address: { type: "string", description: "Blockchain address" },
              chain: { type: "string", description: "Blockchain type" }
            },
            required: ["address", "chain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "smart_contract_audit",
          description: "Audit smart contract for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              contract: { type: "string", description: "Contract address" },
              chain: { type: "string", description: "Blockchain" }
            },
            required: ["contract", "chain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "nft_tracking",
          description: "Track NFT ownership and transactions",
          parameters: {
            type: "object",
            properties: {
              nft_id: { type: "string", description: "NFT identifier" }
            },
            required: ["nft_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "defi_protocol_analysis",
          description: "Analyze DeFi protocol security",
          parameters: {
            type: "object",
            properties: {
              protocol: { type: "string", description: "Protocol name" }
            },
            required: ["protocol"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "telegram_osint",
          description: "OSINT on Telegram users and channels",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Username or channel" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "discord_osint",
          description: "OSINT on Discord servers and users",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Server or user ID" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reddit_osint",
          description: "Deep Reddit user analysis",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Reddit username" }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "youtube_osint",
          description: "YouTube channel and video analysis",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Channel or video ID" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "twitch_osint",
          description: "Twitch streamer analysis",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Twitch username" }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "onlyfans_osint",
          description: "OnlyFans creator analysis",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Creator username" }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "patreon_osint",
          description: "Patreon creator analysis",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Creator username" }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cashapp_osint",
          description: "CashApp user lookup",
          parameters: {
            type: "object",
            properties: {
              cashtag: { type: "string", description: "CashApp $cashtag" }
            },
            required: ["cashtag"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "venmo_osint",
          description: "Venmo transaction analysis",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Venmo username" }
            },
            required: ["username"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "paypal_osint",
          description: "PayPal account intelligence",
          parameters: {
            type: "object",
            properties: {
              email: { type: "string", description: "PayPal email" }
            },
            required: ["email"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dating_app_osint",
          description: "Search across dating apps (Tinder, Bumble, Hinge)",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Name or profile info" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "professional_network_osint",
          description: "Deep LinkedIn and professional network analysis",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "employment_history",
          description: "Track employment history across sources",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "education_verification",
          description: "Verify educational credentials",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              institution: { type: "string", description: "School name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "professional_license_lookup",
          description: "Lookup professional licenses (medical, legal, etc.)",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              profession: { type: "string", description: "License type" }
            },
            required: ["name", "profession"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "medical_professional_lookup",
          description: "Search medical professional databases",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Doctor name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "legal_professional_lookup",
          description: "Search bar associations and legal directories",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Lawyer name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "government_contractor_search",
          description: "Search government contractor databases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sec_filings",
          description: "Search SEC filings and corporate records",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name or ticker" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "trademark_search",
          description: "Search trademark databases",
          parameters: {
            type: "object",
            properties: {
              term: { type: "string", description: "Trademark term" }
            },
            required: ["term"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "patent_search",
          description: "Search patent databases",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Patent search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "copyright_search",
          description: "Search copyright registrations",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Work title" }
            },
            required: ["title"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bankruptcy_records",
          description: "Search bankruptcy court records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person or company name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "lien_search",
          description: "Search for liens and judgments",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person or property" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "marriage_divorce_records",
          description: "Search marriage and divorce records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              state: { type: "string", description: "State" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "death_records",
          description: "Search death records and obituaries",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "birth_records",
          description: "Search birth records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              year: { type: "string", description: "Birth year (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "voter_registration",
          description: "Search voter registration databases",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              state: { type: "string", description: "State" }
            },
            required: ["name", "state"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "campaign_finance",
          description: "Search political campaign contributions",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Donor or candidate name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "lobbying_records",
          description: "Search lobbying disclosure records",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or organization" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "nonprofit_lookup",
          description: "Search nonprofit 990 tax forms",
          parameters: {
            type: "object",
            properties: {
              organization: { type: "string", description: "Nonprofit name" }
            },
            required: ["organization"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "firearms_license",
          description: "Search FFL (Federal Firearms License) records",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Name or license number" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "aircraft_registration",
          description: "Search FAA aircraft registration",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Tail number or owner" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "boat_registration",
          description: "Search vessel registration",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Name or registration" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ham_radio_lookup",
          description: "Search FCC amateur radio licenses",
          parameters: {
            type: "object",
            properties: {
              callsign: { type: "string", description: "Callsign or name" }
            },
            required: ["callsign"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "pilot_license",
          description: "Search FAA pilot licenses",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Pilot name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sex_offender_registry",
          description: "Search sex offender registries",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              state: { type: "string", description: "State (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "warrant_search",
          description: "Search for active warrants",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              state: { type: "string", description: "State" }
            },
            required: ["name", "state"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "inmate_search",
          description: "Search prison and jail records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Inmate name" },
              state: { type: "string", description: "State (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "parole_records",
          description: "Search parole and probation records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              state: { type: "string", description: "State" }
            },
            required: ["name", "state"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "missing_persons",
          description: "Search missing persons databases",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cold_case_search",
          description: "Search cold case databases",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "gang_database",
          description: "Search gang affiliation databases",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Name or gang name" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "terrorist_watchlist",
          description: "Check terrorist screening databases",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sanctions_check",
          description: "Check OFAC and international sanctions lists",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or organization" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "interpol_red_notice",
          description: "Search Interpol Red Notices",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fbi_wanted",
          description: "Search FBI Most Wanted list",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name or category" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "military_service",
          description: "Search military service records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "veteran_benefits",
          description: "Search veteran benefits records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Veteran name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "security_clearance",
          description: "Check security clearance status",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "social_security_death_index",
          description: "Search Social Security Death Index",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              ssn: { type: "string", description: "SSN (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "genealogy_search",
          description: "Search genealogy and ancestry databases",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" },
              birthdate: { type: "string", description: "Birth date (optional)" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dna_database",
          description: "Search DNA and genetic genealogy databases",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Name or identifier" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "immigration_records",
          description: "Search immigration and naturalization records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "passport_verification",
          description: "Verify passport information",
          parameters: {
            type: "object",
            properties: {
              number: { type: "string", description: "Passport number" }
            },
            required: ["number"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "visa_status",
          description: "Check visa status and immigration records",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "customs_records",
          description: "Search customs and border crossing records",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or company" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "shipping_manifest",
          description: "Search shipping manifests and cargo records",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "import_export_records",
          description: "Search import/export trade data",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fda_recalls",
          description: "Search FDA product recalls and warnings",
          parameters: {
            type: "object",
            properties: {
              product: { type: "string", description: "Product name or company" }
            },
            required: ["product"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "nhtsa_recalls",
          description: "Search vehicle recalls and complaints",
          parameters: {
            type: "object",
            properties: {
              vehicle: { type: "string", description: "Make/model or VIN" }
            },
            required: ["vehicle"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "consumer_complaints",
          description: "Search consumer complaint databases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bbb_rating",
          description: "Check Better Business Bureau ratings",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "product_safety",
          description: "Search product safety databases",
          parameters: {
            type: "object",
            properties: {
              product: { type: "string", description: "Product name" }
            },
            required: ["product"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "environmental_violations",
          description: "Search EPA environmental violations",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "osha_violations",
          description: "Search OSHA workplace safety violations",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "labor_violations",
          description: "Search wage and hour violation records",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "discrimination_cases",
          description: "Search EEOC discrimination cases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "whistleblower_cases",
          description: "Search whistleblower case databases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "class_action_lawsuits",
          description: "Search class action lawsuit databases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "securities_litigation",
          description: "Search securities fraud and litigation",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name or ticker" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "insider_trading",
          description: "Search insider trading records",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company ticker or executive name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "hedge_fund_holdings",
          description: "Search 13F hedge fund holdings",
          parameters: {
            type: "object",
            properties: {
              fund: { type: "string", description: "Fund name" }
            },
            required: ["fund"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "institutional_ownership",
          description: "Analyze institutional ownership patterns",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Stock ticker" }
            },
            required: ["ticker"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "short_interest",
          description: "Check short interest data",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Stock ticker" }
            },
            required: ["ticker"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dark_pool_activity",
          description: "Analyze dark pool trading activity",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Stock ticker" }
            },
            required: ["ticker"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "options_flow",
          description: "Analyze unusual options activity",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Stock ticker" }
            },
            required: ["ticker"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ftc_actions",
          description: "Search FTC enforcement actions",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "antitrust_cases",
          description: "Search antitrust and monopoly cases",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "merger_filings",
          description: "Search merger and acquisition filings",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "beneficial_ownership",
          description: "Search beneficial ownership filings",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "shell_company_check",
          description: "Check for shell company indicators",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "offshore_entities",
          description: "Search offshore entity databases",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or company name" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "panama_papers",
          description: "Search Panama Papers leak database",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Name or entity to search" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "paradise_papers",
          description: "Search Paradise Papers leak database",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Name or entity to search" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "offshore_leaks",
          description: "Search ICIJ offshore leaks database",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Name or entity" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "money_laundering_check",
          description: "Check anti-money laundering databases",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or company" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "pep_check",
          description: "Check Politically Exposed Persons database",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Person name" }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "adverse_media_search",
          description: "Search negative news and adverse media",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or company" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reputation_analysis",
          description: "Comprehensive online reputation analysis",
          parameters: {
            type: "object",
            properties: {
              entity: { type: "string", description: "Person or company" }
            },
            required: ["entity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sentiment_analysis",
          description: "Analyze sentiment across social media and news",
          parameters: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Topic or entity" }
            },
            required: ["topic"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "influencer_analysis",
          description: "Analyze social media influencer metrics",
          parameters: {
            type: "object",
            properties: {
              username: { type: "string", description: "Username" },
              platform: { type: "string", description: "Social platform" }
            },
            required: ["username", "platform"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bot_detection",
          description: "Detect bot accounts and fake followers",
          parameters: {
            type: "object",
            properties: {
              account: { type: "string", description: "Account to analyze" },
              platform: { type: "string", description: "Platform" }
            },
            required: ["account", "platform"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "astroturfing_detection",
          description: "Detect coordinated inauthentic behavior",
          parameters: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Topic or hashtag" }
            },
            required: ["topic"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "disinformation_tracking",
          description: "Track disinformation campaigns",
          parameters: {
            type: "object",
            properties: {
              narrative: { type: "string", description: "Narrative or claim" }
            },
            required: ["narrative"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "deepfake_detection",
          description: "Detect deepfake images and videos",
          parameters: {
            type: "object",
            properties: {
              media_url: { type: "string", description: "Media URL" }
            },
            required: ["media_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "phishing_detection",
          description: "Detect phishing sites and emails",
          parameters: {
            type: "object",
            properties: {
              content: { type: "string", description: "URL or email content" }
            },
            required: ["content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "malware_analysis",
          description: "Analyze suspected malware samples",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash (MD5/SHA256)" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ransomware_tracking",
          description: "Track ransomware operations and payments",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "Hash, wallet, or gang name" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "apt_tracking",
          description: "Track Advanced Persistent Threat groups",
          parameters: {
            type: "object",
            properties: {
              apt_name: { type: "string", description: "APT group name or TTP" }
            },
            required: ["apt_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "exploit_database",
          description: "Search exploit databases",
          parameters: {
            type: "object",
            properties: {
              cve_or_product: { type: "string", description: "CVE ID or product" }
            },
            required: ["cve_or_product"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "zero_day_tracking",
          description: "Track zero-day vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              product: { type: "string", description: "Product or vendor" }
            },
            required: ["product"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ioc_search",
          description: "Search Indicators of Compromise (IoCs)",
          parameters: {
            type: "object",
            properties: {
              ioc: { type: "string", description: "IoC (IP, domain, hash)" }
            },
            required: ["ioc"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "threat_intelligence_feed",
          description: "Query threat intelligence feeds",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Threat query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "darkweb_forum_monitor",
          description: "Monitor dark web forums and marketplaces",
          parameters: {
            type: "object",
            properties: {
              keyword: { type: "string", description: "Search keyword" }
            },
            required: ["keyword"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "credential_market_search",
          description: "Search credential markets on dark web",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Domain or company" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "stolen_data_search",
          description: "Search for stolen data leaks",
          parameters: {
            type: "object",
            properties: {
              identifier: { type: "string", description: "Email, domain, or keyword" }
            },
            required: ["identifier"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ransomware_leak_sites",
          description: "Monitor ransomware leak sites",
          parameters: {
            type: "object",
            properties: {
              company: { type: "string", description: "Company name" }
            },
            required: ["company"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "botnet_tracking",
          description: "Track botnet C2 infrastructure",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "IP, domain, or botnet name" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "c2_infrastructure",
          description: "Map command and control infrastructure",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "IP or domain" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "passive_dns",
          description: "Query passive DNS databases",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Domain or IP" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ssl_certificate_transparency",
          description: "Search SSL certificate transparency logs",
          parameters: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain" }
            },
            required: ["domain"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "asn_lookup",
          description: "Lookup Autonomous System Number info",
          parameters: {
            type: "object",
            properties: {
              asn: { type: "string", description: "ASN number or IP" }
            },
            required: ["asn"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bgp_routing",
          description: "Analyze BGP routing and hijacks",
          parameters: {
            type: "object",
            properties: {
              prefix: { type: "string", description: "IP prefix or ASN" }
            },
            required: ["prefix"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "network_topology",
          description: "Map network topology and paths",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target IP or domain" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "internet_census",
          description: "Query internet-wide scan data",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Port, service, or pattern" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "censys_search",
          description: "Search Censys internet scan database",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "binary_edge",
          description: "Search BinaryEdge threat intelligence",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "zoomeye_search",
          description: "Search ZoomEye cyberspace search engine",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fofa_search",
          description: "Search FOFA cyberspace search engine",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "onyphe_search",
          description: "Search ONYPHE threat intelligence",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "greynoise_lookup",
          description: "Check GreyNoise for internet scanner data",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "alienvault_otx",
          description: "Query AlienVault Open Threat Exchange",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "IoC to query" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "virustotal_lookup",
          description: "Query VirusTotal for file/URL/domain/IP intelligence",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "Hash, URL, domain, or IP" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "hybrid_analysis",
          description: "Query Hybrid Analysis malware sandbox",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "any_run_sandbox",
          description: "Query ANY.RUN interactive malware sandbox",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "joe_sandbox",
          description: "Query Joe Sandbox malware analysis",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cuckoo_sandbox",
          description: "Query Cuckoo Sandbox malware analysis",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "misp_query",
          description: "Query MISP threat sharing platform",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "IoC or event ID" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "stix_taxii_feed",
          description: "Query STIX/TAXII threat intelligence feeds",
          parameters: {
            type: "object",
            properties: {
              collection: { type: "string", description: "Feed collection" }
            },
            required: ["collection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "opencti_query",
          description: "Query OpenCTI cyber threat intelligence",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "threatcrowd_lookup",
          description: "Query ThreatCrowd threat intelligence",
          parameters: {
            type: "object",
            properties: {
              indicator: { type: "string", description: "Domain, IP, or email" }
            },
            required: ["indicator"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "urlscan_io",
          description: "Scan and analyze URLs with urlscan.io",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to scan" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "malware_bazaar",
          description: "Query MalwareBazaar malware samples",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "File hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "abuse_ipdb",
          description: "Check IP against AbuseIPDB",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "spamhaus_lookup",
          description: "Check Spamhaus blocklists",
          parameters: {
            type: "object",
            properties: {
              ip: { type: "string", description: "IP address or domain" }
            },
            required: ["ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "ssl_blacklist",
          description: "Check SSL blacklist databases",
          parameters: {
            type: "object",
            properties: {
              hash: { type: "string", description: "Certificate hash" }
            },
            required: ["hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "threat_actor_profile",
          description: "Profile threat actors and cybercriminals",
          parameters: {
            type: "object",
            properties: {
              actor: { type: "string", description: "Threat actor name or alias" }
            },
            required: ["actor"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cybercrime_forum_search",
          description: "Search cybercrime forums and underground",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search term" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "paste_site_monitor",
          description: "Monitor paste sites (Pastebin, GhostBin, etc.)",
          parameters: {
            type: "object",
            properties: {
              keyword: { type: "string", description: "Keyword to monitor" }
            },
            required: ["keyword"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "code_repository_secrets",
          description: "Scan code repositories for secrets",
          parameters: {
            type: "object",
            properties: {
              repo_url: { type: "string", description: "Repository URL" }
            },
            required: ["repo_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "docker_registry_scan",
          description: "Scan Docker registries for exposed images",
          parameters: {
            type: "object",
            properties: {
              registry: { type: "string", description: "Registry URL or name" }
            },
            required: ["registry"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "kubernetes_security_audit",
          description: "Audit Kubernetes cluster security",
          parameters: {
            type: "object",
            properties: {
              cluster: { type: "string", description: "Cluster identifier" }
            },
            required: ["cluster"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cloud_security_posture",
          description: "Assess cloud security posture (AWS, Azure, GCP)",
          parameters: {
            type: "object",
            properties: {
              provider: { type: "string", enum: ["aws", "azure", "gcp"], description: "Cloud provider" }
            },
            required: ["provider"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "iam_policy_analysis",
          description: "Analyze IAM policies for misconfigurations",
          parameters: {
            type: "object",
            properties: {
              policy: { type: "string", description: "Policy document or ARN" }
            },
            required: ["policy"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cloud_asset_inventory",
          description: "Inventory cloud assets and resources",
          parameters: {
            type: "object",
            properties: {
              provider: { type: "string", description: "Cloud provider" }
            },
            required: ["provider"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "supply_chain_analysis",
          description: "Analyze software supply chain risks",
          parameters: {
            type: "object",
            properties: {
              package: { type: "string", description: "Package or dependency" }
            },
            required: ["package"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sbom_analysis",
          description: "Analyze Software Bill of Materials (SBOM)",
          parameters: {
            type: "object",
            properties: {
              sbom_url: { type: "string", description: "SBOM file URL" }
            },
            required: ["sbom_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dependency_check",
          description: "Check dependencies for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              manifest: { type: "string", description: "Package manifest file" }
            },
            required: ["manifest"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "license_compliance",
          description: "Check open source license compliance",
          parameters: {
            type: "object",
            properties: {
              project: { type: "string", description: "Project or repository" }
            },
            required: ["project"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "code_quality_analysis",
          description: "Analyze code quality and security",
          parameters: {
            type: "object",
            properties: {
              repo: { type: "string", description: "Repository URL" }
            },
            required: ["repo"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sast_scan",
          description: "Static application security testing",
          parameters: {
            type: "object",
            properties: {
              code_path: { type: "string", description: "Code repository path" }
            },
            required: ["code_path"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "dast_scan",
          description: "Dynamic application security testing",
          parameters: {
            type: "object",
            properties: {
              target_url: { type: "string", description: "Application URL" }
            },
            required: ["target_url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "mobile_app_security",
          description: "Analyze mobile app security (iOS/Android)",
          parameters: {
            type: "object",
            properties: {
              app_id: { type: "string", description: "App package or bundle ID" }
            },
            required: ["app_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "firmware_analysis",
          description: "Analyze firmware for vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              firmware_hash: { type: "string", description: "Firmware file hash" }
            },
            required: ["firmware_hash"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "iot_security_scan",
          description: "Scan IoT devices for security issues",
          parameters: {
            type: "object",
            properties: {
              device_ip: { type: "string", description: "Device IP or identifier" }
            },
            required: ["device_ip"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scada_ics_scan",
          description: "Scan SCADA/ICS systems (with authorization)",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target IP or network" }
            },
            required: ["target"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "wireless_network_audit",
          description: "Audit wireless network security",
          parameters: {
            type: "object",
            properties: {
              ssid: { type: "string", description: "Network SSID" }
            },
            required: ["ssid"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bluetooth_security_scan",
          description: "Scan Bluetooth devices and security",
          parameters: {
            type: "object",
            properties: {
              device_address: { type: "string", description: "Bluetooth MAC address" }
            },
            required: ["device_address"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "rfid_nfc_analysis",
          description: "Analyze RFID/NFC security",
          parameters: {
            type: "object",
            properties: {
              tag_id: { type: "string", description: "Tag identifier" }
            },
            required: ["tag_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "vehicle_can_bus_analysis",
          description: "Analyze vehicle CAN bus security",
          parameters: {
            type: "object",
            properties: {
              vehicle: { type: "string", description: "Vehicle make/model" }
            },
            required: ["vehicle"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "physical_security_audit",
          description: "Audit physical security controls",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "Location identifier" }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "social_engineering_assessment",
          description: "Assess social engineering vulnerabilities",
          parameters: {
            type: "object",
            properties: {
              target_org: { type: "string", description: "Target organization" }
            },
            required: ["target_org"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "osint_framework_search",
          description: "Comprehensive OSINT framework search across all tools",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", description: "Target for OSINT gathering" },
              scope: { type: "string", enum: ["person", "company", "domain", "ip", "email", "phone", "all"], description: "OSINT scope" }
            },
            required: ["target", "scope"]
          }
        }
      }
    ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    
    console.log('Venice AI response:', JSON.stringify(data, null, 2));
    
    // Check if AI wants to use tools
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
    const messageContent = data.choices?.[0]?.message?.content;
    
    // Check if tool calls are in content instead of tool_calls array (model misbehavior)
    if (!toolCalls?.length && messageContent?.includes('"name":') && messageContent?.includes('"arguments":')) {
      console.log('Tool calls detected in content, model is not following protocol correctly');
      
      // Extract tool call from content using regex
      const toolCallMatch = messageContent.match(/\{"name":\s*"([^"]+)",\s*"arguments":\s*(\{[^}]+\})\}/);
      if (toolCallMatch) {
        const [, functionName, argsStr] = toolCallMatch;
        console.log('Extracted tool call:', functionName, argsStr);
        
        try {
          const args = JSON.parse(argsStr);
          let toolResult;
          
          if (functionName === "location_osint") {
            toolResult = await lookupLocation(args.address);
          } else if (functionName === "ip_lookup") {
            toolResult = await lookupIP(args.ip);
          }
          
          if (toolResult) {
            // Call AI again with tool result
            const followUpResponse = await fetch("https://api.venice.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${VENICE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "qwen3-235b",
                messages: [
                  { role: "system", content: systemPrompt },
                  ...messages,
                  { role: "assistant", content: `I need to look up: ${args.address || args.ip}` },
                  { role: "user", content: `Tool result: ${JSON.stringify(toolResult)}. Now provide the property intelligence analysis in plain paragraphs.` }
                ],
              }),
            });
            
            if (followUpResponse.ok) {
              const followUpData = await followUpResponse.json();
              const sanitizedContent = sanitizeResponse(followUpData.choices[0].message.content);
              return new Response(
                JSON.stringify({ content: sanitizedContent }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        } catch (e) {
          console.error('Failed to parse tool call from content:', e);
        }
      }
    }
    
    if (toolCalls && toolCalls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "ip_lookup") {
          const args = JSON.parse(toolCall.function.arguments);
          const ipLookupResult = await lookupIP(args.ip);
          
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(ipLookupResult),
          });
        } else if (toolCall.function.name === "get_security_features") {
          const args = JSON.parse(toolCall.function.arguments);
          const securityFeatures = getSecurityFeatures(args.category);
          
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(securityFeatures),
          });
        } else if (toolCall.function.name === "check_breach") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await checkBreach(args.email)),
          });
        } else if (toolCall.function.name === "analyze_ssl") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await analyzeSSL(args.domain)),
          });
        } else if (toolCall.function.name === "lookup_certificate") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await lookupCertificate(args.domain)),
          });
        } else if (toolCall.function.name === "lookup_cve") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await lookupCVE(args.cve_id)),
          });
        } else if (toolCall.function.name === "get_security_tool") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(getSecurityTool(args.tool_name, args.query_type)),
          });
        } else if (toolCall.function.name === "search_security_tools") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(searchSecurityTools(args.category, args.use_case)),
          });
        } else if (toolCall.function.name === "scan_vulnerabilities") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await scanVulnerabilities(args.target, args.scan_type)),
          });
        } else if (toolCall.function.name === "test_sql_injection") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await testSQLInjection(args.url, args.method, args.aggressiveness)),
          });
        } else if (toolCall.function.name === "run_pentest") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await runPentest(args.target, args.scope, args.duration_minutes)),
          });
        } else if (toolCall.function.name === "location_osint") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await lookupLocation(args.address)),
          });
        } else if (toolCall.function.name === "enumerate_subdomains") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await enumerateSubdomains(args.domain)),
          });
        } else if (toolCall.function.name === "check_username") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await checkUsername(args.username)),
          });
        } else if (toolCall.function.name === "identify_hash") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(identifyHash(args.hash)),
          });
        } else if (toolCall.function.name === "check_wayback") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await checkWayback(args.url)),
          });
        } else if (toolCall.function.name === "search_github") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await searchGithub(args.query, args.type)),
          });
        } else if (toolCall.function.name === "dns_enumerate") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await dnsEnumerate(args.domain)),
          });
        } else if (toolCall.function.name === "extract_metadata") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await extractMetadata(args.url)),
          });
        } else if (toolCall.function.name === "reverse_dns") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await reverseDns(args.ip)),
          });
        } else if (toolCall.function.name === "check_robots_txt") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await checkRobotsTxt(args.domain)),
          });
        } else if (toolCall.function.name === "web_search") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.webSearch(args.query, args.num_results || 5)),
          });
        } else if (toolCall.function.name === "whois_lookup") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.whoisLookup(args.domain)),
          });
        } else if (toolCall.function.name === "check_pastebin") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkPastebin(args.query)),
          });
        } else if (toolCall.function.name === "shodan_search") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.shodanSearch(args.query)),
          });
        } else if (toolCall.function.name === "check_security_headers") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkSecurityHeaders(args.url)),
          });
        } else if (toolCall.function.name === "extract_emails") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.extractEmails(args.source)),
          });
        } else if (toolCall.function.name === "check_domain_reputation") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkDomainReputation(args.domain)),
          });
        } else if (toolCall.function.name === "find_exposed_ports") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findExposedPorts(args.target)),
          });
        } else if (toolCall.function.name === "check_technologies") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkTechnologies(args.url)),
          });
        } else if (toolCall.function.name === "find_subdomains_crtsh") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.findSubdomainsCrtsh(args.domain)),
          });
        } else if (toolCall.function.name === "check_dns_dumpster") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkDNSDumpster(args.domain)),
          });
        } else if (toolCall.function.name === "find_social_media") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findSocialMedia(args.name)),
          });
        } else if (toolCall.function.name === "check_email_format") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkEmailFormat(args.email)),
          });
        } else if (toolCall.function.name === "analyze_http_headers") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.analyzeHttpHeaders(args.url)),
          });
        } else if (toolCall.function.name === "check_exposed_files") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkExposedFiles(args.url)),
          });
        } else if (toolCall.function.name === "find_ip_geolocation") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findIPGeolocation(args.ip)),
          });
        } else if (toolCall.function.name === "check_website_status") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkWebsiteStatus(args.url)),
          });
        } else if (toolCall.function.name === "find_related_domains") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findRelatedDomains(args.domain)),
          });
        } else if (toolCall.function.name === "check_dark_web_mentions") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkDarkWebMentions(args.query)),
          });
        } else if (toolCall.function.name === "analyze_url_safety") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.analyzeURLSafety(args.url)),
          });
        } else if (toolCall.function.name === "find_company_info") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findCompanyInfo(args.company)),
          });
        } else if (toolCall.function.name === "check_ssl_vulnerabilities") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkSSLVulnerabilities(args.domain)),
          });
        } else if (toolCall.function.name === "find_network_neighbors") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findNetworkNeighbors(args.ip)),
          });
        } else if (toolCall.function.name === "check_redirect_chain") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await OSINT.checkRedirectChain(args.url)),
          });
        } else if (toolCall.function.name === "find_api_endpoints") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findAPIEndpoints(args.domain)),
          });
        } else if (toolCall.function.name === "check_cors_policy") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkCORSPolicy(args.url)),
          });
        } else if (toolCall.function.name === "find_js_libraries") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findJSLibraries(args.url)),
          });
        } else if (toolCall.function.name === "check_content_type") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkContentType(args.url)),
          });
        } else if (toolCall.function.name === "find_hidden_params") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findHiddenParams(args.url)),
          });
        } else if (toolCall.function.name === "check_waf_presence") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkWAFPresence(args.url)),
          });
        } else if (toolCall.function.name === "analyze_cookies") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.analyzeCookies(args.url)),
          });
        } else if (toolCall.function.name === "find_admin_panels") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findAdminPanels(args.domain)),
          });
        } else if (toolCall.function.name === "check_leaked_credentials") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkLeakedCredentials(args.identifier)),
          });
        } else if (toolCall.function.name === "find_s3_buckets") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findS3Buckets(args.domain)),
          });
        } else if (toolCall.function.name === "check_github_repos") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkGitHubRepos(args.target)),
          });
        } else if (toolCall.function.name === "analyze_dns_sec") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.analyzeDNSSEC(args.domain)),
          });
        } else if (toolCall.function.name === "find_linkedin_employees") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findLinkedInEmployees(args.company)),
          });
        } else if (toolCall.function.name === "check_email_delivery") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkEmailDelivery(args.domain)),
          });
        } else if (toolCall.function.name === "find_phone_info") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findPhoneInfo(args.phone)),
          });
        } else if (toolCall.function.name === "check_certificate_chain") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkCertificateChain(args.domain)),
          });
        } else if (toolCall.function.name === "find_docker_images") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findDockerImages(args.query)),
          });
        } else if (toolCall.function.name === "check_rate_limiting") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkRateLimiting(args.url)),
          });
        } else if (toolCall.function.name === "find_code_repos") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findCodeRepos(args.target)),
          });
        } else if (toolCall.function.name === "check_password_policy") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkPasswordPolicy(args.url)),
          });
        } else if (toolCall.function.name === "find_iot_devices") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findIOTDevices(args.query)),
          });
        } else if (toolCall.function.name === "check_api_security") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkAPISecurity(args.api_url)),
          });
        } else if (toolCall.function.name === "find_backup_files") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findBackupFiles(args.url)),
          });
        } else if (toolCall.function.name === "check_clickjacking") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkClickjacking(args.url)),
          });
        } else if (toolCall.function.name === "find_leaked_keys") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findLeakedKeys(args.target)),
          });
        } else if (toolCall.function.name === "check_open_redirects") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkOpenRedirects(args.url)),
          });
        } else if (toolCall.function.name === "find_staging_environments") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findStagingEnvironments(args.domain)),
          });
        } else if (toolCall.function.name === "check_cms_version") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkCMSVersion(args.url)),
          });
        } else if (toolCall.function.name === "find_archived_pages") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findArchivedPages(args.url)),
          });
        } else if (toolCall.function.name === "check_subdomain_takeover") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkSubdomainTakeover(args.subdomain)),
          });
        } else if (toolCall.function.name === "find_email_patterns") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findEmailPatterns(args.domain)),
          });
        } else if (toolCall.function.name === "check_tor_exit_nodes") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkTorExitNode(args.ip)),
          });
        } else if (toolCall.function.name === "find_data_breaches") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findDataBreaches(args.target)),
          });
        } else if (toolCall.function.name === "check_mixed_content") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkMixedContent(args.url)),
          });
        } else if (toolCall.function.name === "find_cloud_storage") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findCloudStorage(args.target)),
          });
        } else if (toolCall.function.name === "check_outdated_software") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkOutdatedSoftware(args.url)),
          });
        } else if (toolCall.function.name === "find_subdomains_all") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findSubdomainsAll(args.domain)),
          });
        } else if (toolCall.function.name === "check_xss_protection") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkXSSProtection(args.url)),
          });
        } else if (toolCall.function.name === "find_mobile_apps") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findMobileApps(args.target)),
          });
        } else if (toolCall.function.name === "check_http2_support") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.checkHTTP2Support(args.url)),
          });
        } else if (toolCall.function.name === "find_vulnerabilities_db") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(OSINT.findVulnerabilitiesDB(args.product)),
          });
        }
      }
      
      // Make another call with tool results
      const followUpResponse = await fetch("https://api.venice.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VENICE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen3-235b",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            data.choices[0].message,
            ...toolResults,
          ],
        }),
      });
      
      if (!followUpResponse.ok) {
        throw new Error("Tool follow-up failed");
      }
      
      const followUpData = await followUpResponse.json();
      const sanitizedContent = sanitizeResponse(followUpData.choices[0].message.content);
      console.log('Response sanitized:', { 
        original: followUpData.choices[0].message.content.substring(0, 200),
        sanitized: sanitizedContent.substring(0, 200)
      });
      return new Response(
        JSON.stringify({ content: sanitizedContent }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseContent = data.choices[0].message.content;
    const sanitizedContent = sanitizeResponse(responseContent);
    console.log('Direct response sanitized:', {
      original: responseContent?.substring(0, 200),
      sanitized: sanitizedContent?.substring(0, 200)
    });
    return new Response(
      JSON.stringify({ content: sanitizedContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getSecurityFeatures(category: string) {
  const features = {
    all: {
      encryption: [
        {
          name: "Military-Grade Encryption (AES-256-GCM)",
          description: "End-to-end encryption using AES-256-GCM with ECDH P-384 key exchange",
          capabilities: ["256-bit encryption", "PBKDF2 with 250,000 iterations", "SHA-512 hashing", "Fresh IV per operation", "HMAC authentication"]
        },
        {
          name: "Double-Encrypted Private Keys",
          description: "Private cryptographic keys are encrypted before database storage",
          capabilities: ["Application-level encryption", "Separate encryption for identity and prekeys", "Protection against database breach"]
        },
        {
          name: "Zero-Knowledge Architecture",
          description: "No plaintext ever stored on servers",
          capabilities: ["Client-side encryption", "Server never has access to decryption keys", "Complete privacy"]
        }
      ],
      monitoring: [
        {
          name: "Real-Time Security Audit",
          description: "Comprehensive security analysis with scoring system",
          capabilities: ["Security score tracking", "Issue detection", "Automatic recommendations", "Periodic audits every 30 minutes"]
        },
        {
          name: "Link Security Scanner",
          description: "Client-side malicious URL detection without external data transmission",
          capabilities: ["Phishing detection", "Malicious domain identification", "URL shortener detection", "Suspicious pattern recognition", "HTTPS verification"]
        },
        {
          name: "File Security Scanning",
          description: "Automated threat detection for uploaded files",
          capabilities: ["Malware detection", "File type verification", "Size validation", "Access logging"]
        }
      ],
      messaging: [
        {
          name: "Self-Destruct Messages",
          description: "Messages automatically deleted after viewing",
          capabilities: ["5-second auto-deletion", "One-time viewing", "Complete message erasure"]
        },
        {
          name: "Anonymous Messaging",
          description: "Send messages without revealing identity",
          capabilities: ["Conversation-specific anonymous IDs", "Revocable anonymity", "Admin controls"]
        },
        {
          name: "Screenshot Protection",
          description: "Prevents screenshots on mobile devices",
          capabilities: ["Native iOS/Android integration", "Content protection", "Privacy enforcement"]
        },
        {
          name: "Message Encryption",
          description: "All messages encrypted before transmission",
          capabilities: ["End-to-end encryption", "Perfect forward secrecy", "Key rotation support"]
        }
      ],
      network: [
        {
          name: "IP Lookup & Analysis",
          description: "Comprehensive IP address intelligence",
          capabilities: ["Geolocation data", "ISP information", "Proxy/VPN detection", "Threat intelligence", "Dual-source verification (ip-api.com + ipapi.co)"]
        },
        {
          name: "Security Audit Logging",
          description: "Detailed logging of security events",
          capabilities: ["Event tracking", "Risk level classification", "Device fingerprinting", "Session monitoring"]
        }
      ]
    }
  };

  if (category === "all") {
    return features.all;
  } else if (category === "encryption") {
    return { encryption: features.all.encryption };
  } else if (category === "monitoring") {
    return { monitoring: features.all.monitoring };
  } else if (category === "messaging") {
    return { messaging: features.all.messaging };
  } else if (category === "network") {
    return { network: features.all.network };
  }
  
  return features.all;
}

function getSecurityTool(toolName: string, queryType: string = "overview"): any {
  // Normalize tool name (case-insensitive, handle variations)
  const normalizedName = toolName.toLowerCase().trim();
  
  // Find tool in database
  let tool: SecurityTool | undefined;
  let toolKey: string | undefined;
  
  // Exact match first
  if (SECURITY_TOOLS_DB[normalizedName]) {
    tool = SECURITY_TOOLS_DB[normalizedName];
    toolKey = normalizedName;
  } else {
    // Fuzzy match - handle variations like "owasp zap" vs "owasp-zap"
    toolKey = Object.keys(SECURITY_TOOLS_DB).find(key => 
      key.replace(/[-_]/g, '').toLowerCase() === normalizedName.replace(/[-_\s]/g, '').toLowerCase() ||
      SECURITY_TOOLS_DB[key].name.toLowerCase() === normalizedName
    );
    if (toolKey) {
      tool = SECURITY_TOOLS_DB[toolKey];
    }
  }
  
  if (!tool) {
    return {
      success: false,
      error: `Tool '${toolName}' not found in database. Try searching by category or use_case.`,
      suggestion: "Use search_security_tools to find available tools."
    };
  }
  
  // Return information based on query type
  switch (queryType) {
    case "overview":
      return {
        success: true,
        tool: tool.name,
        description: tool.description,
        category: tool.category,
        license: tool.license,
        github: tool.github,
        stars: tool.stars,
        government_approved: tool.government_approved,
        use_cases: tool.use_cases,
        documentation: tool.documentation,
        notes: tool.notes
      };
    
    case "installation":
      return {
        success: true,
        tool: tool.name,
        installation: tool.installation,
        documentation: tool.documentation,
        notes: tool.notes.filter(note => note.toLowerCase().includes('install') || note.toLowerCase().includes('require'))
      };
    
    case "basic_usage":
      return {
        success: true,
        tool: tool.name,
        basic_usage: tool.basic_usage,
        examples: tool.examples.slice(0, 2),
        documentation: tool.documentation
      };
    
    case "advanced_usage":
      return {
        success: true,
        tool: tool.name,
        advanced_usage: tool.advanced_usage,
        examples: tool.examples,
        documentation: tool.documentation,
        notes: tool.notes
      };
    
    case "examples":
      return {
        success: true,
        tool: tool.name,
        examples: tool.examples,
        documentation: tool.documentation
      };
    
    case "integration":
      if (tool.api_available) {
        return {
          success: true,
          tool: tool.name,
          api_available: true,
          api_integration: tool.api_integration,
          documentation: tool.documentation,
          use_cases: tool.use_cases
        };
      } else {
        return {
          success: true,
          tool: tool.name,
          api_available: false,
          message: "This tool does not have a direct API. Use command-line execution or programmatic execution via subprocess.",
          basic_usage: tool.basic_usage,
          documentation: tool.documentation
        };
      }
    
    default:
      return {
        success: true,
        tool: tool.name,
        full_details: tool
      };
  }
}

function searchSecurityTools(category: string, useCase?: string): any {
  if (category === "all") {
    const allTools = Object.values(SECURITY_TOOLS_DB).map(tool => ({
      name: tool.name,
      category: tool.category,
      description: tool.description,
      github: tool.github,
      stars: tool.stars,
      government_approved: tool.government_approved
    }));
    
    return {
      success: true,
      category: "all",
      total_tools: allTools.length,
      tools: allTools
    };
  }
  
  // Get tools by category
  const toolKeys = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES];
  
  if (!toolKeys) {
    return {
      success: false,
      error: `Category '${category}' not found.`,
      available_categories: Object.keys(TOOL_CATEGORIES)
    };
  }
  
  const tools = toolKeys.map(key => SECURITY_TOOLS_DB[key]).filter(Boolean);
  
  // If use case provided, filter further
  let filteredTools = tools;
  if (useCase) {
    const searchTerm = useCase.toLowerCase();
    filteredTools = tools.filter(tool => 
      tool.use_cases.some(uc => uc.toLowerCase().includes(searchTerm)) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.name.toLowerCase().includes(searchTerm)
    );
  }
  
  return {
    success: true,
    category: category,
    use_case: useCase || "all",
    total_tools: filteredTools.length,
    tools: filteredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      github: tool.github,
      stars: tool.stars,
      government_approved: tool.government_approved,
      use_cases: tool.use_cases,
      api_available: tool.api_available
    })),
    usage_tip: "Use get_security_tool with the tool name for detailed installation and usage instructions."
  };
}

async function lookupIP(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (!response.ok) throw new Error("Primary lookup failed");
    
    const data = await response.json();
    if (data.status === "fail") throw new Error(data.message || "IP lookup failed");
    
    return {
      success: true,
      ip: ip,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
      mobile: data.mobile,
      proxy: data.proxy,
      hosting: data.hosting,
    };
  } catch (error) {
    try {
      const fallbackResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!fallbackResponse.ok) throw new Error("Fallback lookup failed");
      
      const fallbackData = await fallbackResponse.json();
      
      return {
        success: true,
        ip: ip,
        country: fallbackData.country_name,
        countryCode: fallbackData.country_code,
        region: fallbackData.region_code,
        regionName: fallbackData.region,
        city: fallbackData.city,
        zip: fallbackData.postal,
        lat: fallbackData.latitude,
        lon: fallbackData.longitude,
        timezone: fallbackData.timezone,
        isp: fallbackData.org,
        org: fallbackData.org,
        as: fallbackData.asn,
      };
    } catch (fallbackError) {
      return { success: false, error: "Unable to lookup IP address" };
    }
  }
}

async function checkBreach(email: string) {
  try {
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: { 'User-Agent': 'NOMAD-OSINT' }
    });
    
    if (response.status === 404) {
      return { success: true, email, breached: false, message: "No breaches found" };
    }
    
    if (response.ok) {
      const breaches = await response.json();
      return {
        success: true,
        email,
        breached: true,
        breachCount: breaches.length,
        breaches: breaches.slice(0, 5).map((b: any) => ({
          name: b.Name,
          domain: b.Domain,
          breachDate: b.BreachDate,
          pwnCount: b.PwnCount,
          dataClasses: b.DataClasses
        }))
      };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function analyzeSSL(domain: string) {
  try {
    const response = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&all=done`);
    if (!response.ok) return { success: false, error: "SSL analysis failed" };
    
    const data = await response.json();
    
    if (data.status === "READY") {
      return {
        success: true,
        domain,
        grade: data.endpoints?.[0]?.grade || "Unknown",
        hasWarnings: data.endpoints?.[0]?.hasWarnings || false,
        ipAddress: data.endpoints?.[0]?.ipAddress
      };
    }
    
    return {
      success: true,
      domain,
      status: data.status,
      message: "Analysis in progress. Check https://www.ssllabs.com/ssltest/ for results"
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function lookupCertificate(domain: string) {
  try {
    const response = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`);
    if (!response.ok) return { success: false, error: "Certificate lookup failed" };
    
    const certs = await response.json();
    
    if (!Array.isArray(certs) || certs.length === 0) {
      return { success: true, domain, certificateCount: 0, message: "No certificates found" };
    }
    
    return {
      success: true,
      domain,
      certificateCount: certs.length,
      certificates: certs.slice(0, 10).map((cert: any) => ({
        id: cert.id,
        issuer: cert.issuer_name,
        commonName: cert.common_name,
        notBefore: cert.not_before,
        notAfter: cert.not_after
      }))
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function lookupCVE(cveId: string) {
  try {
    const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`);
    if (!response.ok) return { success: false, error: "CVE lookup failed" };
    
    const data = await response.json();
    
    if (!data.vulnerabilities || data.vulnerabilities.length === 0) {
      return { success: false, error: "CVE not found" };
    }
    
    const vuln = data.vulnerabilities[0].cve;
    
    return {
      success: true,
      cveId: vuln.id,
      description: vuln.descriptions?.[0]?.value || "No description",
      published: vuln.published,
      lastModified: vuln.lastModified,
      cvssV3: vuln.metrics?.cvssMetricV31?.[0]?.cvssData,
      references: vuln.references?.slice(0, 5).map((ref: any) => ({
        url: ref.url,
        source: ref.source
      }))
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function lookupLocation(address: string) {
  try {
    // Use Nominatim API for geocoding (OpenStreetMap's free service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(address)}` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=1` +
      `&polygon_geojson=1`,
      {
        headers: {
          'User-Agent': 'SecureLink-NOMAD-OSINT'
        }
      }
    );

    if (!response.ok) {
      return { success: false, error: 'Geocoding request failed' };
    }

    const data = await response.json();

    if (data.length === 0) {
      return { 
        success: false, 
        error: 'Location not found. Try being more specific with the address.'
      };
    }

    const result = data[0];
    
    return {
      success: true,
      address: address,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      city: result.address?.city || result.address?.town || result.address?.village || 'Unknown',
      country: result.address?.country || 'Unknown',
      displayName: result.display_name,
      type: result.type,
      importance: result.importance,
      addressDetails: {
        road: result.address?.road,
        house_number: result.address?.house_number,
        city: result.address?.city,
        state: result.address?.state,
        country: result.address?.country,
        postcode: result.address?.postcode,
        country_code: result.address?.country_code
      },
      boundingBox: result.boundingbox,
      osm_id: result.osm_id,
      osm_type: result.osm_type,
      // Add useful URLs for further exploration
      osmUrl: `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=17/${result.lat}/${result.lon}`,
      googleMapsUrl: `https://www.google.com/maps?q=${result.lat},${result.lon}`,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result.lat},${result.lon}`,
      mapillaryUrl: `https://www.mapillary.com/app/?lat=${result.lat}&lng=${result.lon}&z=17`
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Location lookup failed"
    };
  }
}

// Subdomain enumeration using common wordlist
async function enumerateSubdomains(domain: string) {
  const commonSubdomains = [
    'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
    'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'm', 'imap', 'test',
    'ns', 'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news', 'vpn', 'ns3',
    'mail2', 'new', 'mysql', 'old', 'lists', 'support', 'mobile', 'mx', 'static',
    'docs', 'beta', 'shop', 'sql', 'secure', 'demo', 'cp', 'calendar', 'wiki',
    'web', 'media', 'email', 'images', 'img', 'www1', 'intranet', 'portal', 'video',
    'sip', 'dns2', 'api', 'cdn', 'stats', 'dns1', 'ns4', 'www3', 'dns', 'search',
    'staging', 'server', 'mx1', 'chat', 'wap', 'my', 'svn', 'mail1', 'sites',
    'proxy', 'ads', 'host', 'crm', 'cms', 'backup', 'mx2', 'lyncdiscover', 'info',
    'apps', 'download', 'remote', 'db', 'forums', 'store', 'relay', 'files',
    'newsletter', 'app', 'live', 'owa', 'en', 'start', 'sms', 'office', 'exchange',
    'ipv4', 'git', 'upload', 'stage', 'internal', 'cloud', 'dashboard', 'localhost'
  ];

  const found: { subdomain: string; ip: string }[] = [];
  const notFound: string[] = [];

  console.log(`Starting subdomain enumeration for ${domain}...`);

  for (const sub of commonSubdomains) {
    try {
      const fullDomain = `${sub}.${domain}`;
      const response = await fetch(`https://dns.google/resolve?name=${fullDomain}&type=A`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        const ips = data.Answer
          .filter((record: any) => record.type === 1) // A records
          .map((record: any) => record.data);
        
        if (ips.length > 0) {
          found.push({
            subdomain: fullDomain,
            ip: ips[0]
          });
          console.log(`Found: ${fullDomain} -> ${ips[0]}`);
        }
      } else {
        notFound.push(fullDomain);
      }
    } catch (error) {
      console.error(`Error checking ${sub}.${domain}:`, error);
    }
  }

  return {
    success: true,
    domain,
    found_count: found.length,
    subdomains: found,
    checked: commonSubdomains.length
  };
}

// Username enumeration across platforms
async function checkUsername(username: string) {
  const platforms = [
    { name: 'GitHub', url: `https://github.com/${username}` },
    { name: 'Twitter', url: `https://twitter.com/${username}` },
    { name: 'Instagram', url: `https://instagram.com/${username}` },
    { name: 'Reddit', url: `https://reddit.com/user/${username}` },
    { name: 'YouTube', url: `https://youtube.com/@${username}` },
    { name: 'TikTok', url: `https://tiktok.com/@${username}` },
    { name: 'LinkedIn', url: `https://linkedin.com/in/${username}` },
    { name: 'Medium', url: `https://medium.com/@${username}` },
    { name: 'DeviantArt', url: `https://${username}.deviantart.com` },
    { name: 'Twitch', url: `https://twitch.tv/${username}` }
  ];

  const results = [];

  for (const platform of platforms) {
    try {
      const response = await fetch(platform.url, {
        method: 'HEAD',
        redirect: 'follow'
      });
      
      results.push({
        platform: platform.name,
        url: platform.url,
        exists: response.status === 200,
        status_code: response.status
      });
    } catch (error) {
      results.push({
        platform: platform.name,
        url: platform.url,
        exists: false,
        error: 'Failed to check'
      });
    }
  }

  return {
    success: true,
    username,
    results,
    found_on: results.filter(r => r.exists).map(r => r.platform)
  };
}

// Hash identification
function identifyHash(hash: string) {
  const patterns = [
    { type: 'MD5', regex: /^[a-f0-9]{32}$/i, length: 32 },
    { type: 'SHA-1', regex: /^[a-f0-9]{40}$/i, length: 40 },
    { type: 'SHA-224', regex: /^[a-f0-9]{56}$/i, length: 56 },
    { type: 'SHA-256', regex: /^[a-f0-9]{64}$/i, length: 64 },
    { type: 'SHA-384', regex: /^[a-f0-9]{96}$/i, length: 96 },
    { type: 'SHA-512', regex: /^[a-f0-9]{128}$/i, length: 128 },
    { type: 'bcrypt', regex: /^\$2[ayb]\$.{56}$/i, length: 60 },
    { type: 'NTLM', regex: /^[a-f0-9]{32}$/i, length: 32 },
    { type: 'MySQL5', regex: /^\*[a-f0-9]{40}$/i, length: 41 },
    { type: 'PostgreSQL MD5', regex: /^md5[a-f0-9]{32}$/i, length: 35 }
  ];

  const matches = patterns.filter(p => p.regex.test(hash));
  
  return {
    success: true,
    hash: hash.substring(0, 20) + '...',
    length: hash.length,
    possible_types: matches.map(m => m.type),
    most_likely: matches.length > 0 ? matches[0].type : 'Unknown'
  };
}

// Wayback Machine check
async function checkWayback(url: string) {
  try {
    const apiUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=10`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data || data.length <= 1) {
      return {
        success: true,
        url,
        snapshots: 0,
        message: 'No archived snapshots found'
      };
    }

    // Skip header row
    const snapshots = data.slice(1).map((row: any[]) => ({
      timestamp: row[1],
      date: `${row[1].substring(0, 4)}-${row[1].substring(4, 6)}-${row[1].substring(6, 8)}`,
      status: row[4],
      archive_url: `https://web.archive.org/web/${row[1]}/${url}`
    }));

    return {
      success: true,
      url,
      snapshots: snapshots.length,
      latest_snapshot: snapshots[0],
      oldest_snapshot: snapshots[snapshots.length - 1],
      all_snapshots: snapshots
    };
  } catch (error) {
    console.error('Error checking Wayback:', error);
    return {
      success: false,
      error: 'Failed to check Wayback Machine',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// GitHub search
async function searchGithub(query: string, type: 'repositories' | 'users' | 'code') {
  try {
    const apiUrl = `https://api.github.com/search/${type}?q=${encodeURIComponent(query)}&per_page=10`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NOMAD-OSINT'
      }
    });
    
    const data = await response.json();
    
    if (type === 'repositories') {
      return {
        success: true,
        query,
        type,
        total_count: data.total_count,
        results: data.items?.map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url,
          created: repo.created_at,
          updated: repo.updated_at
        })) || []
      };
    } else if (type === 'users') {
      return {
        success: true,
        query,
        type,
        total_count: data.total_count,
        results: data.items?.map((user: any) => ({
          username: user.login,
          profile_url: user.html_url,
          avatar: user.avatar_url,
          type: user.type
        })) || []
      };
    } else {
      return {
        success: true,
        query,
        type,
        total_count: data.total_count,
        results: data.items?.map((item: any) => ({
          name: item.name,
          path: item.path,
          repository: item.repository.full_name,
          url: item.html_url
        })) || []
      };
    }
  } catch (error) {
    console.error('Error searching GitHub:', error);
    return {
      success: false,
      error: 'Failed to search GitHub',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// DNS enumeration
async function dnsEnumerate(domain: string) {
  const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
  const results: any = {};

  for (const type of recordTypes) {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        results[type] = data.Answer.map((record: any) => ({
          data: record.data,
          ttl: record.TTL
        }));
      } else {
        results[type] = [];
      }
    } catch (error) {
      results[type] = { error: 'Failed to query' };
    }
  }

  return {
    success: true,
    domain,
    records: results
  };
}

// Metadata extraction
async function extractMetadata(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;
    
    // Extract meta tags
    const metaTags: any = {};
    const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = match[2];
    }
    
    return {
      success: true,
      url,
      title,
      meta_tags: metaTags,
      security_headers: {
        'content-security-policy': headers['content-security-policy'] || 'Not set',
        'x-frame-options': headers['x-frame-options'] || 'Not set',
        'x-content-type-options': headers['x-content-type-options'] || 'Not set',
        'strict-transport-security': headers['strict-transport-security'] || 'Not set'
      },
      server: headers['server'] || 'Unknown',
      powered_by: headers['x-powered-by'] || 'Unknown'
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      success: false,
      error: 'Failed to extract metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Reverse DNS lookup
async function reverseDns(ip: string) {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${ip}&type=PTR`);
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      return {
        success: true,
        ip,
        hostnames: data.Answer.map((record: any) => record.data)
      };
    }
    
    return {
      success: true,
      ip,
      hostnames: [],
      message: 'No PTR records found'
    };
  } catch (error) {
    console.error('Error in reverse DNS:', error);
    return {
      success: false,
      error: 'Failed to perform reverse DNS lookup',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check robots.txt
async function checkRobotsTxt(domain: string) {
  try {
    const url = `https://${domain}/robots.txt`;
    const response = await fetch(url);
    
    if (response.status === 404) {
      return {
        success: true,
        domain,
        exists: false,
        message: 'No robots.txt found'
      };
    }
    
    const content = await response.text();
    const lines = content.split('\n');
    
    const disallowed = lines
      .filter(line => line.trim().toLowerCase().startsWith('disallow:'))
      .map(line => line.split(':')[1].trim());
    
    const sitemaps = lines
      .filter(line => line.trim().toLowerCase().startsWith('sitemap:'))
      .map(line => line.split(':').slice(1).join(':').trim());
    
    return {
      success: true,
      domain,
      exists: true,
      url,
      disallowed_paths: disallowed,
      sitemaps,
      full_content: content
    };
  } catch (error) {
    console.error('Error checking robots.txt:', error);
    return {
      success: false,
      error: 'Failed to check robots.txt',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
