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

      const adminSupabase = createAdminClient();
      
      // Check if profile exists and is complete (has phone number)
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('id, phone, birth_date, full_name')
        .eq('id', user.id)
        .single();

      // No profile at all, or profile missing required phone number → complete registration
      if (!profile || !profile.phone) {
        return NextResponse.redirect(
          `${origin}/register?email=${encodeURIComponent(user.email ?? '')}&name=${encodeURIComponent(user.user_metadata?.full_name ?? profile?.full_name ?? '')}`
        );
      }

      // Profile is complete — update active session token
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
