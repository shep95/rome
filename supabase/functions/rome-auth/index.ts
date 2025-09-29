import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Username generation function
function generateUsername(): string {
  const adjectives = ["stealth", "ghost", "cipher", "vault", "shadow", "phantom", "raven", "wolf", "falcon", "viper"];
  const nouns = ["fox", "wolf", "phoenix", "raven", "hawk", "tiger", "panther", "eagle", "jaguar", "cobra"];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  
  return `${adjective}_${noun}${number}`;
}

// Banned words check
function isUsernameBlocked(username: string): boolean {
  const bannedWords = [
    "admin", "administrator", "root", "system", "support", "help", "mod", "moderator",
    "bitcoin", "crypto", "wallet", "bank", "money", "cash", "visa", "mastercard",
    "password", "login", "auth", "security", "secure", "test", "demo", "example"
  ];
  
  const lowerUsername = username.toLowerCase();
  return bannedWords.some(word => lowerUsername.includes(word));
}

// SHA-3 hash function (using Web Crypto API's SHA-256 as approximation)
async function sha3Hash(input: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input + pepper);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Argon2 password hashing (simplified implementation)
async function hashPasswordArgon2(password: string, pepper: string): Promise<string> {
  // In production, use actual Argon2 implementation
  // For now, using PBKDF2 with high iterations as fallback
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + pepper);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(bits));
  const saltArray = Array.from(salt);
  
  // Combine salt and hash
  return `argon2:${saltArray.map(b => b.toString(16).padStart(2, '0')).join('')}:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

async function verifyPasswordArgon2(password: string, hashedPassword: string, pepper: string): Promise<boolean> {
  try {
    const parts = hashedPassword.split(':');
    if (parts.length !== 3 || parts[0] !== 'argon2') {
      return false;
    }
    
    const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const storedHash = parts[2];
    
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password + pepper);
    
    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const hashArray = Array.from(new Uint8Array(bits));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computedHash === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const emailPepper = Deno.env.get('EMAIL_PEPPER') || 'DEFAULT_EMAIL_PEPPER_2024';
    const passwordPepper = Deno.env.get('PASSWORD_PEPPER') || 'ROME_PEPPER_v3';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, data } = await req.json();

    switch (action) {
      case 'signup': {
        const { email, password } = data;
        
        // Generate unique username
        let username: string;
        let attempts = 0;
        do {
          username = generateUsername();
          attempts++;
          
          if (attempts > 10) {
            throw new Error('Unable to generate unique username');
          }
          
          // Check if username is blocked
          if (isUsernameBlocked(username)) {
            continue;
          }
          
          // Check uniqueness in database
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();
            
          if (!existingUser) {
            break;
          }
        } while (true);
        
        // Hash email with pepper
        const hashedEmail = await sha3Hash(email, emailPepper);
        
        // Hash password with Argon2
        const hashedPassword = await hashPasswordArgon2(password, passwordPepper);
        
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            display_name: username,
            hashedEmail: hashedEmail
          }
        });
        
        if (authError) {
          throw authError;
        }
        
        // Store secure profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            username: username,
            display_name: username,
            email_encrypted: hashedEmail
          });
          
        if (profileError) {
          throw profileError;
        }
        
        // Store password hash securely
        const { error: passwordError } = await supabase
          .from('password_security')
          .insert({
            user_id: authUser.user.id,
            password_hash: hashedPassword,
            hash_algorithm: 'argon2'
          });
          
        if (passwordError) {
          throw passwordError;
        }
        
        return new Response(JSON.stringify({
          success: true,
          username: username,
          user_id: authUser.user.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'signin': {
        const { username, password } = data;
        
        // Find user by username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', username)
          .maybeSingle();
          
        if (profileError || !profile) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get stored password hash
        const { data: passwordData, error: passwordError } = await supabase
          .from('password_security')
          .select('password_hash')
          .eq('user_id', profile.id)
          .maybeSingle();
          
        if (passwordError || !passwordData) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Verify password
        const isValid = await verifyPasswordArgon2(password, passwordData.password_hash, passwordPepper);
        
        if (!isValid) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get user email for Supabase auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError || !authUser.user) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication failed'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          user_id: profile.id,
          username: profile.username,
          email: authUser.user.email
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: any) {
    console.error('Rome auth error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});