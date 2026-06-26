// src/app/api/auth/2fa/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ enabled: false, verified: false });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.two_factor_enabled) {
      return NextResponse.json({ enabled: false, verified: false });
    }

    // Check if the cookie is set
    const cookieStore = request.headers.get('cookie') || '';
    const hasCookie = cookieStore.includes(`2fa_verified_${user.id}=true`);

    return NextResponse.json({
      enabled: true,
      verified: hasCookie
    });
  } catch {
    return NextResponse.json({ enabled: false, verified: false });
  }
}
