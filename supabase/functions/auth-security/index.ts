import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = (origin: string | null, allowed: string[]) => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Security-Policy": "default-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer"
});

const getAllowedOrigins = (): string[] => {
  const raw = Deno.env.get('ALLOWED_ORIGINS') || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const allowed = ['*'];

  // Always handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin, allowed) });
  }

  // Create Supabase client (no auth required for these operations)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnon);

  try {
    const { action, identifier, metadata, data } = await req.json();

    switch (action) {
      case 'check_rate_limit': {
        // identifier is required
        const id = String(identifier || '');
        if (!id) throw new Error('identifier required');

        // window: 1 minute, max 5 tries
        const windowMins = 1;
        const max = 5;
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowMins * 60000).toISOString();

        const { data: rows } = await supabase
          .from('rate_limits')
          .select('id, count, expires_at')
          .eq('identifier', id)
          .eq('action', metadata?.action || 'generic')
          .gte('window_start', windowStart)
          .limit(1);

        const remaining = rows && rows.length ? Math.max(0, max - rows[0].count) : max;
        const isAllowed = remaining > 0;
        return new Response(JSON.stringify({ allowed: isAllowed, remainingAttempts: remaining }), {
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
      }

      case 'increment_rate_limit': {
        const id = String(identifier || '');
        if (!id) throw new Error('identifier required');
        const now = new Date();
        const expires = new Date(now.getTime() + 1 * 60000).toISOString();
        await supabase.from('rate_limits').insert({
          identifier: id,
          action: metadata?.action || 'generic',
          window_start: now.toISOString(),
          expires_at: expires,
        });
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
      }

      case 'validate_password_strength': {
        // Do NOT accept raw passwords server-side
        return new Response(JSON.stringify({ error: 'client_only' }), {
          status: 400,
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
      }

      case 'generate_device_fingerprint': {
        const meta = metadata || {};
        const enc = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(meta)));
        const hashArray = Array.from(new Uint8Array(enc)).map(b => b.toString(16).padStart(2, '0')).join('');
        return new Response(JSON.stringify({ fingerprint: hashArray }), {
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
      }

      case 'check_breach_database': {
        // Expect k-anonymity prefix only
        const prefix = (metadata?.hash_prefix || '').toString().toUpperCase();
        if (!prefix || prefix.length !== 5) {
          return new Response(JSON.stringify({ error: 'invalid_prefix' }), {
            status: 400,
            headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
          });
        }
        const hibp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await hibp.text();
        // Return raw list to client; client checks suffix locally
        return new Response(JSON.stringify({ range: text }), {
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'unknown_action' }), {
          status: 400,
          headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'bad_request' }), {
      status: 400,
      headers: { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' },
    });
  }
});