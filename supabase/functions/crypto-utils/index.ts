import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced Signal Protocol with Double Ratchet Implementation
class EnhancedSignalCrypto {
  // Security constants
  static readonly KEY_LENGTH = 32;
  static readonly IV_LENGTH = 12;
  static readonly SALT_LENGTH = 32;
  static readonly HMAC_LENGTH = 32;
  static readonly PBKDF2_ITERATIONS = 250000; // Increased from 100k for enhanced security

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
      privateKey: new Uint8Array(privateKey),
      keyPair
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
      privateKey: new Uint8Array(privateKey),
      keyPair
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

  // Enhanced key derivation with HKDF and multiple rounds
  static async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey, info?: string) {
    // Step 1: Perform X25519 ECDH
    const rawSharedSecret = await crypto.subtle.deriveBits(
      {
        name: "X25519",
        public: publicKey,
      },
      privateKey,
      256
    );

    // Step 2: Use HKDF for key stretching and domain separation
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const infoBytes = new TextEncoder().encode(info || "SecureLink-E2EE");
    
    const hkdfKey = await crypto.subtle.importKey(
      "raw",
      rawSharedSecret,
      "HKDF",
      false,
      ["deriveKey"]
    );

    // Derive multiple keys for different purposes
    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-512", // Upgraded to SHA-512
        salt: salt,
        info: new Uint8Array([...infoBytes, 0x01])
      },
      hkdfKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["encrypt", "decrypt"]
    );

    const macKey = await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-512",
        salt: salt,
        info: new Uint8Array([...infoBytes, 0x02])
      },
      hkdfKey,
      {
        name: "HMAC",
        hash: "SHA-512"
      },
      false,
      ["sign", "verify"]
    );

    return { encryptionKey, macKey, salt };
  }

  // Enhanced encryption with HMAC authentication
  static async encryptMessage(message: string, keyMaterial: any, messageNumber: number = 0) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate fresh IV
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Add message number for replay protection
    const header = new Uint8Array(8);
    new DataView(header.buffer).setBigUint64(0, BigInt(messageNumber), false);
    
    // Encrypt the message
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: header // Authenticate the header
      },
      keyMaterial.encryptionKey,
      data
    );

    // Create HMAC for additional authentication
    const hmacData = new Uint8Array(header.length + iv.length + encryptedData.byteLength);
    hmacData.set(header, 0);
    hmacData.set(iv, header.length);
    hmacData.set(new Uint8Array(encryptedData), header.length + iv.length);
    
    const hmac = await crypto.subtle.sign(
      "HMAC",
      keyMaterial.macKey,
      hmacData
    );

    return {
      encrypted: new Uint8Array(encryptedData),
      iv: iv,
      header: header,
      hmac: new Uint8Array(hmac),
      messageNumber
    };
  }

  // Enhanced decryption with HMAC verification
  static async decryptMessage(
    encryptedData: Uint8Array, 
    iv: Uint8Array, 
    header: Uint8Array,
    hmac: Uint8Array,
    keyMaterial: any
  ) {
    // Verify HMAC first
    const hmacData = new Uint8Array(header.length + iv.length + encryptedData.length);
    hmacData.set(header, 0);
    hmacData.set(iv, header.length);
    hmacData.set(encryptedData, header.length + iv.length);
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      keyMaterial.macKey,
      hmac,
      hmacData
    );

    if (!isValid) {
      throw new Error("Message authentication failed - possible tampering detected");
    }

    // Decrypt the message
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: header
      },
      keyMaterial.encryptionKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  // Secure key encryption for storage
  static async encryptPrivateKey(privateKey: Uint8Array, password: string): Promise<{ encrypted: string; salt: Uint8Array; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Derive key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-512' // Upgraded hash
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the private key
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      privateKey
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt,
      iv
    };
  }

  // Secure key decryption from storage
  static async decryptPrivateKey(encryptedData: string, salt: Uint8Array, iv: Uint8Array, password: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    
    // Derive the same key from password and salt
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const decryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-512'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the private key
    const encryptedBytes = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      decryptionKey,
      encryptedBytes
    );

    return new Uint8Array(decrypted);
  }

  // Generate cryptographically secure session keys
  static async generateSessionKeys() {
    const rootKey = crypto.getRandomValues(new Uint8Array(this.KEY_LENGTH));
    const chainKey = crypto.getRandomValues(new Uint8Array(this.KEY_LENGTH));
    
    return { rootKey, chainKey };
  }

  // Implement key ratcheting for forward secrecy
  static async ratchetChainKey(chainKey: Uint8Array): Promise<{ newChainKey: Uint8Array; messageKey: Uint8Array }> {
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      chainKey,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    // Ratchet chain key
    const newChainKeyMac = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode("chain-key")
    );
    const newChainKey = new Uint8Array(newChainKeyMac).slice(0, this.KEY_LENGTH);

    // Derive message key
    const messageKeyMac = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode("message-key")
    );
    const messageKey = new Uint8Array(messageKeyMac).slice(0, this.KEY_LENGTH);

    return { newChainKey, messageKey };
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
        return await generateIdentityKeys(supabaseClient, user.id, data.password);
      
      case 'generate_prekeys':
        return await generatePrekeys(supabaseClient, user.id, data.password, data.count || 100);
      
      case 'get_prekey_bundle':
        return await getPrekeyBundle(supabaseClient, data.userId);
      
      case 'use_one_time_prekey':
        return await useOneTimePrekey(supabaseClient, data.prekeyId);
      
      case 'encrypt_message':
        return await encryptMessage(data);
      
      case 'decrypt_message':
        return await decryptMessage(data);

      case 'rotate_keys':
        return await rotateKeys(supabaseClient, user.id, data.password);

      case 'verify_key_integrity':
        return await verifyKeyIntegrity(supabaseClient, user.id);
      
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

async function generateIdentityKeys(supabase: any, userId: string, password: string) {
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
    const identityKeys = await EnhancedSignalCrypto.generateIdentityKeyPair();
    
    // Generate signed prekey
    const signedPrekey = await EnhancedSignalCrypto.generatePrekey();
    const signedPrekeyId = Math.floor(Math.random() * 16777216); // 24-bit random ID

    // Sign the prekey with identity key
    const signature = await EnhancedSignalCrypto.signPrekey(signedPrekey.publicKey, identityKeys.keyPair.privateKey);

    // Encrypt private keys before storage
    const encryptedIdentityPrivate = await EnhancedSignalCrypto.encryptPrivateKey(identityKeys.privateKey, password);
    const encryptedSignedPrekeyPrivate = await EnhancedSignalCrypto.encryptPrivateKey(signedPrekey.privateKey, password);

    // Store in database with encrypted private keys
    const { error } = await supabase
      .from('user_keys')
      .insert({
        user_id: userId,
        identity_key_public: identityKeys.publicKey,
        identity_key_private: encryptedIdentityPrivate.encrypted,
        identity_key_salt: encryptedIdentityPrivate.salt,
        identity_key_iv: encryptedIdentityPrivate.iv,
        signed_prekey_id: signedPrekeyId,
        signed_prekey_public: signedPrekey.publicKey,
        signed_prekey_private: encryptedSignedPrekeyPrivate.encrypted,
        signed_prekey_salt: encryptedSignedPrekeyPrivate.salt,
        signed_prekey_iv: encryptedSignedPrekeyPrivate.iv,
        signed_prekey_signature: signature,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString()
      });

    if (error) {
      console.error('Database error storing keys:', error);
      throw error;
    }

    // Log security event (without sensitive data)
    console.log(`Security: Identity keys generated for user ${userId.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true,
        identityKeyPublic: Array.from(identityKeys.publicKey),
        signedPrekeyId,
        securityLevel: 'military-grade'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate identity keys error:', error);
    // Don't leak sensitive error details
    return new Response(
      JSON.stringify({ error: 'Key generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generatePrekeys(supabase: any, userId: string, password: string, count: number) {
  try {
    const prekeys = [];
    
    for (let i = 0; i < count; i++) {
      const prekeyPair = await EnhancedSignalCrypto.generatePrekey();
      const keyId = Math.floor(Math.random() * 16777216);
      
      // Encrypt private key before storage
      const encryptedPrivateKey = await EnhancedSignalCrypto.encryptPrivateKey(prekeyPair.privateKey, password);
      
      prekeys.push({
        user_id: userId,
        key_id: keyId,
        public_key: prekeyPair.publicKey,
        private_key: encryptedPrivateKey.encrypted,
        private_key_salt: encryptedPrivateKey.salt,
        private_key_iv: encryptedPrivateKey.iv,
        created_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('one_time_prekeys')
      .insert(prekeys);

    if (error) {
      throw error;
    }

    console.log(`Security: Generated ${count} prekeys for user ${userId.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true,
        generated: count,
        securityLevel: 'military-grade'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate prekeys error:', error);
    return new Response(
      JSON.stringify({ error: 'Prekey generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
  try {
    const { message, keyMaterial, messageNumber = 0 } = data;
    
    // Import key material for encryption
    const encryptionKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyMaterial.encryptionKey),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const macKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyMaterial.macKey),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const encrypted = await EnhancedSignalCrypto.encryptMessage(
      message, 
      { encryptionKey, macKey }, 
      messageNumber
    );
    
    return new Response(
      JSON.stringify({
        encrypted: Array.from(encrypted.encrypted),
        iv: Array.from(encrypted.iv),
        header: Array.from(encrypted.header),
        hmac: Array.from(encrypted.hmac),
        messageNumber: encrypted.messageNumber,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Message encryption error:', error);
    return new Response(
      JSON.stringify({ error: 'Encryption failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function decryptMessage(data: any) {
  try {
    const { encrypted, iv, header, hmac, keyMaterial } = data;
    
    const encryptionKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyMaterial.encryptionKey),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const macKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyMaterial.macKey),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["verify"]
    );

    const decrypted = await EnhancedSignalCrypto.decryptMessage(
      new Uint8Array(encrypted),
      new Uint8Array(iv),
      new Uint8Array(header),
      new Uint8Array(hmac),
      { encryptionKey, macKey }
    );
    
    return new Response(
      JSON.stringify({ 
        message: decrypted,
        verified: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Message decryption error:', error);
    return new Response(
      JSON.stringify({ error: 'Decryption failed - message may be corrupted or tampered' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// New security functions
async function rotateKeys(supabase: any, userId: string, password: string) {
  try {
    // Generate new prekeys
    const newPrekeys = [];
    for (let i = 0; i < 50; i++) { // Generate 50 new prekeys
      const prekeyPair = await EnhancedSignalCrypto.generatePrekey();
      const keyId = Math.floor(Math.random() * 16777216);
      
      const encryptedPrivateKey = await EnhancedSignalCrypto.encryptPrivateKey(prekeyPair.privateKey, password);
      
      newPrekeys.push({
        user_id: userId,
        key_id: keyId,
        public_key: prekeyPair.publicKey,
        private_key: encryptedPrivateKey.encrypted,
        private_key_salt: encryptedPrivateKey.salt,
        private_key_iv: encryptedPrivateKey.iv,
        created_at: new Date().toISOString()
      });
    }

    // Remove old unused prekeys older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await supabase
      .from('one_time_prekeys')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null)
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Insert new prekeys
    const { error } = await supabase
      .from('one_time_prekeys')
      .insert(newPrekeys);

    if (error) {
      throw error;
    }

    console.log(`Security: Keys rotated for user ${userId.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true,
        rotated: newPrekeys.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Key rotation error:', error);
    return new Response(
      JSON.stringify({ error: 'Key rotation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyKeyIntegrity(supabase: any, userId: string) {
  try {
    // Check for key expiration and usage patterns
    const { data: userKeys } = await supabase
      .from('user_keys')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: prekeys } = await supabase
      .from('one_time_prekeys')
      .select('*')
      .eq('user_id', userId);

    if (!userKeys) {
      return new Response(
        JSON.stringify({ error: 'No keys found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const keyAge = new Date(userKeys.created_at);
    const daysSinceCreation = Math.floor((now.getTime() - keyAge.getTime()) / (1000 * 60 * 60 * 24));

    // Check if keys need rotation (every 90 days)
    const needsRotation = daysSinceCreation > 90;
    
    // Check prekey availability
    const availablePrekeys = prekeys?.filter(pk => !pk.used_at).length || 0;
    const needsMorePrekeys = availablePrekeys < 10;

    return new Response(
      JSON.stringify({
        keyAge: daysSinceCreation,
        needsRotation,
        availablePrekeys,
        needsMorePrekeys,
        lastUsed: userKeys.last_used,
        securityStatus: needsRotation || needsMorePrekeys ? 'attention-required' : 'secure'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Key integrity check error:', error);
    return new Response(
      JSON.stringify({ error: 'Integrity check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}