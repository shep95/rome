// Supabase Edge Function: translate
// Proxies translation requests to an external API to avoid CORS from the client
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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { q, source = 'auto', target = 'en' } = await req.json();
    if (!q || typeof q !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing q' }), { status: 400, headers: corsHeaders });
    }

    // Use MyMemory (no key needed). You may swap to a paid provider and set secrets later.
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    const translated = data?.responseData?.translatedText ?? null;

    return new Response(JSON.stringify({ translated }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
