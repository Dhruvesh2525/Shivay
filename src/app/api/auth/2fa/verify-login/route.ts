// src/app/api/auth/2fa/verify-login/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import * as OTPAuth from 'otpauth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('email, two_factor_secret, two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.two_factor_enabled || !profile.two_factor_secret) {
      return NextResponse.json({ error: '2FA is not enabled for this account.' }, { status: 400 });
    }

    // Verify token
    const totp = new OTPAuth.TOTP({
      issuer: 'Shivay',
      label: profile.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret)
    });

    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: 'Invalid 2FA code.' }, { status: 400 });
    }

    // Set session cookie as 2fa verified
    const response = NextResponse.json({ success: true });
    response.cookies.set(`2fa_verified_${user.id}`, 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed.' }, { status: 500 });
  }
}
