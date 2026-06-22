// src/lib/supabase/admin.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

export const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
      global: {
        headers: {
          'x-client-info': 'shivay-admin',
        },
      },
    }
  );
};
