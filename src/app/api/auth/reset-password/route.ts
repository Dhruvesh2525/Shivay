// src/app/api/auth/reset-password/route.ts
// Password reset flow (SRD). Rate limited per IP to prevent email-bomb abuse.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Rate limit password reset emails (SRD). 3 requests / 30 min.
    const limited = enforceRateLimit(request, {
      key: getClientIp(request),
      action: 'password_reset',
      limit: 3,
      windowMs: 30 * 60 * 1000,
    });
    if (limited) return limited;

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Always respond generically so an attacker can't enumerate accounts.
    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset request failed.' }, { status: 500 });
  }
}
