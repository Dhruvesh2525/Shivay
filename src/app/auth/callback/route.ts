// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user && data?.session) {
      const user = data.user;
      const session = data.session;

      // 1. Enforce Single Session: Write the current access token to the database
      const adminSupabase = createAdminClient();
      
      // Check if profile exists
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('id, phone, birth_date')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Redirection to finish registering Phone & Birth Date
        return NextResponse.redirect(`${origin}/register?email=${encodeURIComponent(user.email ?? '')}&name=${encodeURIComponent(user.user_metadata?.full_name ?? '')}`);
      }

      // Profile exists, update active session token
      await adminSupabase
        .from('profiles')
        .update({ active_session_id: session.access_token })
        .eq('id', user.id);

      // Redirect target
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback redirect if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
