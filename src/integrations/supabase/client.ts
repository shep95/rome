// Military-grade secure backend client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const BACKEND_URL = "https://mnijromffaalvpadojbj.supabase.co";
const BACKEND_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaWpyb21mZmFhbHZwYWRvamJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDAzNjYsImV4cCI6MjA3MDc3NjM2Nn0.i3vlN-B6_u0cwJzAYM-CpTKn7nvlaQOSa_u7DIg05Uc";

// Secure backend client for encrypted communications  
export const supabase = createClient<Database>(BACKEND_URL, BACKEND_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});