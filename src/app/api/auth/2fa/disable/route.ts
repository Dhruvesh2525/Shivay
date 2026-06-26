// src/app/api/auth/2fa/disable/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAuth } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const authCtx = await resolveAuth();
    if (authCtx instanceof NextResponse) return authCtx;
    const { user } = authCtx;

    const adminSupabase = createAdminClient();
    
    // Disable 2FA
    await adminSupabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null
      })
      .eq('id', user.id);

    // Delete verified cookie if present
    const response = NextResponse.json({ success: true });
    response.cookies.delete(`2fa_verified_${user.id}`);

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to disable 2FA.' }, { status: 500 });
  }
}
