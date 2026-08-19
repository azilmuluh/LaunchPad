import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zviwyuwpfdmmviqvqhoe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'missing-key';

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    global: {
      fetch: async (url, options = {}) => {
        const fetchOptions = { ...options };
        if (!fetchOptions.signal) {
          fetchOptions.signal = AbortSignal.timeout(5000); // 5-second timeout (15.3)
        }
        const res = await fetch(url, fetchOptions);
        if (!res.ok && res.status >= 500) {
          console.error('Supabase fetch error:', res.status, url);
        }
        return res;
      },
    },
  }
);

export default supabase;
