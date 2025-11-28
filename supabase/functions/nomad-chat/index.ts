import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { scanVulnerabilities, testSQLInjection, runPentest } from "./security-tools.ts";
import { SECURITY_TOOLS_DB, TOOL_CATEGORIES, SecurityTool } from "./security-tools-db.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
                description: "The domain to check robots.txt for"
              }
            },
            required: ["domain"]
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
