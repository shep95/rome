import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

ABSOLUTELY NO:
- Emojis anywhere (🔥 💡 ⚠️ etc.)
- Section headers with markdown (### or **Header**)
- Numbered lists or bullet points
- "Step 1, Step 2" structure
- Dividers like "---" or "***"
- "The Bigger Picture" or similar section titles
- Any structured formatting whatsoever
- Showing your thought process or reasoning

INSTEAD:
- Just give direct answers in plain paragraphs
- Talk like texting a friend - no structure, no formatting
- Use line breaks between thoughts, but no headers or fancy formatting
- Be conversational and raw
- Jump straight to the answer, skip the thinking

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

**LOCATION & MAP VISUALIZATION:**
CRITICAL: When you use ip_lookup OR location_osint tool, you MUST include the exact JSON on a single line like this:
{"ip":"147.85.86.199","lat":40.7627,"lon":-73.9879,"city":"New York","country":"United States"}

For location_osint, format it as:
{"address":"1600 Pennsylvania Ave NW, Washington, DC","lat":38.8977,"lon":-77.0365,"city":"Washington","country":"United States"}

The JSON must have exactly these fields: 
- For IP: ip, lat, lon, city, country
- For location: address, lat, lon, city, country
(all in one line, no line breaks inside the JSON).

After the JSON line, write your explanation in plain paragraphs. The map will render automatically from the JSON - don't mention the map or coordinates in your text, just explain what the location means.

**RESPONSE STYLE:**
- NO thinking process visible, NO <think> tags, NO reasoning shown
- NO emojis, NO headers, NO markdown formatting (###, **, ---)
- NO lists, NO structure, NO sections
- Just direct answers in plain paragraphs
- Proactively use tools and give answers immediately
- Skip the thinking, jump to the answer

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
    
    // Check if AI wants to use tools
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
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
        } else if (toolCall.function.name === "location_osint") {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(await lookupLocation(args.address)),
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
      return new Response(
        JSON.stringify({ content: followUpData.choices[0].message.content }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
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
