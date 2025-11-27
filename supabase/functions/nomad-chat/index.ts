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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt with IP lookup capabilities
    const systemPrompt = `You are NOMAD, an advanced AI assistant integrated into a secure messaging application. You help users with various tasks and have access to IP lookup functionality.

When users ask you to lookup an IP address or provide information about an IP:
1. Use the ip_lookup tool to get detailed information
2. Present the information in a clear, organized format
3. Include relevant details like location, ISP, timezone, and security information

Be helpful, concise, and professional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ip_lookup",
              description: "Lookup detailed information about an IP address including geolocation, ISP, and security information",
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
        }
      }
      
      // Make another call with tool results
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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

async function lookupIP(ip: string) {
  try {
    // Primary source: ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (!response.ok) {
      throw new Error("Primary lookup failed");
    }
    
    const data = await response.json();
    
    if (data.status === "fail") {
      throw new Error(data.message || "IP lookup failed");
    }
    
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
    // Fallback source: ipapi.co
    try {
      const fallbackResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!fallbackResponse.ok) {
        throw new Error("Fallback lookup failed");
      }
      
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
      return {
        success: false,
        error: "Unable to lookup IP address from any source",
      };
    }
  }
}
