// src/app/api/auth/2fa/enroll/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAuth } from '@/lib/auth-helpers';
import * as OTPAuth from 'otpauth';

export async function POST(request: Request) {
  try {
    const authCtx = await resolveAuth();
    if (authCtx instanceof NextResponse) return authCtx;
    const { user } = authCtx;

    // Only allow admins/staff to enroll 2FA
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'manager', 'organizer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden. Staff only.' }, { status: 403 });
    }

    // Generate TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'Shivay',
      label: profile.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret
    });

    const secretBase32 = secret.base32;
    const qrUrl = totp.toString();

    // Store the secret temporarily (unverified)
    await adminSupabase
      .from('profiles')
      .update({
        two_factor_secret: secretBase32
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      secret: secretBase32,
      qrUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to enroll 2FA.' }, { status: 500 });
  }
}
