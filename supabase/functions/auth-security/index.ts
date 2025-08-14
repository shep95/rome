import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  action: string;
  maxAttempts: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { action: 'login', maxAttempts: 5, windowMinutes: 15 },
  signup: { action: 'signup', maxAttempts: 3, windowMinutes: 60 },
  mfa_verify: { action: 'mfa_verify', maxAttempts: 3, windowMinutes: 5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, identifier, metadata } = await req.json();

    switch (action) {
      case 'check_rate_limit':
        return await checkRateLimit(supabaseClient, identifier, metadata.action);
      
      case 'increment_rate_limit':
        return await incrementRateLimit(supabaseClient, identifier, metadata.action);
      
      case 'validate_password_strength':
        return await validatePasswordStrength(metadata.password);
      
      case 'generate_device_fingerprint':
        return await generateDeviceFingerprint(metadata);
      
      case 'check_breach_database':
        return await checkBreachDatabase(metadata.password);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Auth security error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkRateLimit(supabase: any, identifier: string, action: string) {
  const config = RATE_LIMITS[action];
  if (!config) {
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Clean up expired entries first
  await supabase.rpc('cleanup_expired_rate_limits');

  // Check current rate limit
  const { data: rateLimitData } = await supabase
    .from('rate_limits')
    .select('count, expires_at')
    .eq('identifier', identifier)
    .eq('action', action)
    .single();

  const allowed = !rateLimitData || rateLimitData.count < config.maxAttempts;
  
  return new Response(
    JSON.stringify({ 
      allowed,
      remainingAttempts: allowed ? config.maxAttempts - (rateLimitData?.count || 0) : 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function incrementRateLimit(supabase: any, identifier: string, action: string) {
  const config = RATE_LIMITS[action];
  if (!config) {
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.windowMinutes);

  const { error } = await supabase
    .from('rate_limits')
    .upsert({
      identifier,
      action,
      count: supabase.raw('COALESCE(count, 0) + 1'),
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'identifier,action'
    });

  return new Response(
    JSON.stringify({ success: !error }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function validatePasswordStrength(password: string) {
  const results = {
    length: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !isCommonPassword(password)
  };

  const score = Object.values(results).filter(Boolean).length;
  const strength = score < 4 ? 'weak' : score < 6 ? 'medium' : 'strong';

  return new Response(
    JSON.stringify({ 
      valid: score >= 5, // Require at least 5/6 criteria
      strength,
      checks: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  return commonPasswords.includes(password.toLowerCase());
}

async function generateDeviceFingerprint(metadata: any) {
  // Generate a device fingerprint based on browser/device characteristics
  const fingerprint = {
    userAgent: metadata.userAgent || '',
    screen: metadata.screen || '',
    timezone: metadata.timezone || '',
    language: metadata.language || '',
    platform: metadata.platform || '',
    timestamp: new Date().toISOString()
  };

  // Create a hash of the fingerprint
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(fingerprint));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return new Response(
    JSON.stringify({ fingerprint: hashHex }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkBreachDatabase(password: string) {
  // Implement k-Anonymity check against HaveIBeenPwned
  // Hash the password and check first 5 chars against API
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      // If API is down, allow the password but log the issue
      console.warn('Breach database check failed, allowing password');
      return new Response(
        JSON.stringify({ breached: false, checkFailed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hashList = await response.text();
    const breached = hashList.split('\n').some(line => 
      line.startsWith(suffix)
    );

    return new Response(
      JSON.stringify({ breached }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Breach check error:', error);
    return new Response(
      JSON.stringify({ breached: false, checkFailed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}