// Supabase Edge Function: translate
// Proxies translation requests to LibreTranslate to avoid CORS from the client
// Request body: { q: string, source?: string, target?: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { q, source = 'auto', target = 'en' } = await req.json();
    if (!q || typeof q !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing q' }), { status: 400, headers: corsHeaders });
    }

    // Call LibreTranslate (public instance). You can switch to a private instance if needed.
    const upstream = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, source, target, format: 'text' })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(JSON.stringify({ error: 'Upstream error', details: errText }), { status: 502, headers: corsHeaders });
    }

    const data = await upstream.json();
    const translated = data?.translatedText ?? null;

    return new Response(JSON.stringify({ translated }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
