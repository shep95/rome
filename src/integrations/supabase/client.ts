// Military-grade secure backend client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const BACKEND_URL = "https://secure-backend.example.com";
const BACKEND_KEY = "secure-backend-api-key-placeholder";

// Secure backend client for encrypted communications
export const backend = createClient<Database>(BACKEND_URL, BACKEND_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Legacy alias for compatibility
export const supabase = backend;