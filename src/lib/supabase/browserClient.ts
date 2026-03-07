import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
  return key;
};

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
};
