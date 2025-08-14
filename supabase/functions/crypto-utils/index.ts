import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Signal Protocol Implementation
class SignalCrypto {
  static async generateIdentityKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      true,
      ["sign", "verify"]
    );

    const publicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: new Uint8Array(publicKey),
      privateKey: new Uint8Array(privateKey)
    };
  }

  static async generatePrekey() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "X25519",
        namedCurve: "X25519",
      },
      true,
      ["deriveKey"]
    );

    const publicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: new Uint8Array(publicKey),
      privateKey: new Uint8Array(privateKey)
    };
  }

  static async signPrekey(prekeyPublic: Uint8Array, identityPrivate: CryptoKey) {
    const signature = await crypto.subtle.sign(
      "Ed25519",
      identityPrivate,
      prekeyPublic
    );
    return new Uint8Array(signature);
  }

  static async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey) {
    const sharedKey = await crypto.subtle.deriveKey(
      {
        name: "X25519",
        public: publicKey,
      },
      privateKey,
      {
        name: "HKDF",
        hash: "SHA-256",
      },
      false,
      ["deriveKey"]
    );

    return sharedKey;
  }

  static async encryptMessage(message: string, sharedSecret: CryptoKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      sharedSecret,
      data
    );

    return {
      encrypted: new Uint8Array(encryptedData),
      iv: iv
    };
  }

  static async decryptMessage(encryptedData: Uint8Array, iv: Uint8Array, sharedSecret: CryptoKey) {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      sharedSecret,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'generate_identity_keys':
        return await generateIdentityKeys(supabaseClient, user.id);
      
      case 'generate_prekeys':
        return await generatePrekeys(supabaseClient, user.id, data.count || 100);
      
      case 'get_prekey_bundle':
        return await getPrekeyBundle(supabaseClient, data.userId);
      
      case 'use_one_time_prekey':
        return await useOneTimePrekey(supabaseClient, data.prekeyId);
      
      case 'encrypt_message':
        return await encryptMessage(data);
      
      case 'decrypt_message':
        return await decryptMessage(data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Crypto utils error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateIdentityKeys(supabase: any, userId: string) {
  try {
    // Check if user already has identity keys
    const { data: existingKeys } = await supabase
      .from('user_keys')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingKeys) {
      return new Response(
        JSON.stringify({ error: 'Identity keys already exist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate identity key pair
    const identityKeys = await SignalCrypto.generateIdentityKeyPair();
    
    // Generate signed prekey
    const signedPrekey = await SignalCrypto.generatePrekey();
    const signedPrekeyId = Math.floor(Math.random() * 16777216); // 24-bit random ID

    // Import identity private key for signing
    const identityPrivateKey = await crypto.subtle.importKey(
      "pkcs8",
      identityKeys.privateKey,
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      false,
      ["sign"]
    );

    // Sign the prekey
    const signature = await SignalCrypto.signPrekey(signedPrekey.publicKey, identityPrivateKey);

    // Store in database (keys should be encrypted with user's password in production)
    const { error } = await supabase
      .from('user_keys')
      .insert({
        user_id: userId,
        identity_key_public: identityKeys.publicKey,
        identity_key_private: identityKeys.privateKey, // TODO: Encrypt with user password
        signed_prekey_id: signedPrekeyId,
        signed_prekey_public: signedPrekey.publicKey,
        signed_prekey_private: signedPrekey.privateKey, // TODO: Encrypt with user password
        signed_prekey_signature: signature
      });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        identityKeyPublic: Array.from(identityKeys.publicKey),
        signedPrekeyId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate identity keys error:', error);
    throw error;
  }
}

async function generatePrekeys(supabase: any, userId: string, count: number) {
  try {
    const prekeys = [];
    
    for (let i = 0; i < count; i++) {
      const prekeyPair = await SignalCrypto.generatePrekey();
      const keyId = Math.floor(Math.random() * 16777216);
      
      prekeys.push({
        user_id: userId,
        key_id: keyId,
        public_key: prekeyPair.publicKey,
        private_key: prekeyPair.privateKey // TODO: Encrypt with user password
      });
    }

    const { error } = await supabase
      .from('one_time_prekeys')
      .insert(prekeys);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        generated: count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate prekeys error:', error);
    throw error;
  }
}

async function getPrekeyBundle(supabase: any, userId: string) {
  try {
    // Get user's identity key and signed prekey
    const { data: userKeys } = await supabase
      .from('user_keys')
      .select('identity_key_public, signed_prekey_id, signed_prekey_public, signed_prekey_signature')
      .eq('user_id', userId)
      .single();

    if (!userKeys) {
      return new Response(
        JSON.stringify({ error: 'User keys not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get an unused one-time prekey
    const { data: oneTimePrekey } = await supabase
      .from('one_time_prekeys')
      .select('key_id, public_key')
      .eq('user_id', userId)
      .is('used_at', null)
      .limit(1)
      .single();

    return new Response(
      JSON.stringify({
        identityKey: Array.from(userKeys.identity_key_public),
        signedPrekey: {
          id: userKeys.signed_prekey_id,
          publicKey: Array.from(userKeys.signed_prekey_public),
          signature: Array.from(userKeys.signed_prekey_signature)
        },
        oneTimePrekey: oneTimePrekey ? {
          id: oneTimePrekey.key_id,
          publicKey: Array.from(oneTimePrekey.public_key)
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get prekey bundle error:', error);
    throw error;
  }
}

async function useOneTimePrekey(supabase: any, prekeyId: number) {
  try {
    const { error } = await supabase
      .from('one_time_prekeys')
      .update({ used_at: new Date().toISOString() })
      .eq('key_id', prekeyId);

    return new Response(
      JSON.stringify({ success: !error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Use one-time prekey error:', error);
    throw error;
  }
}

async function encryptMessage(data: any) {
  // This would implement the full Double Ratchet protocol
  // For now, simplified version using AES-GCM
  const { message, sharedSecret } = data;
  
  // In production, this would use the Double Ratchet shared secret
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await SignalCrypto.encryptMessage(message, key);
  
  return new Response(
    JSON.stringify({
      encrypted: Array.from(encrypted.encrypted),
      iv: Array.from(encrypted.iv)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function decryptMessage(data: any) {
  const { encrypted, iv, sharedSecret } = data;
  
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await SignalCrypto.decryptMessage(
    new Uint8Array(encrypted),
    new Uint8Array(iv),
    key
  );
  
  return new Response(
    JSON.stringify({ message: decrypted }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}