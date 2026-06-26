// src/app/api/auth/login/route.ts
// Server-side login proxy that applies IP-based rate limiting (SRD) before
// delegating to Supabase Auth. The browser posts here instead of calling
// Supabase directly so brute-force attempts on the password flow are throttled.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Rate limit login attempts by IP (SRD). 10 attempts / 10 min.
    const limited = enforceRateLimit(request, {
      key: getClientIp(request),
      action: 'login',
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (limited) return limited;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = data.session.access_token;
    const parts = token.split('.');
    let currentSessionId = token;
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.session_id) currentSessionId = payload.session_id;
      } catch {}
    }

    const adminSupabase = createAdminClient();
    await adminSupabase
      .from('profiles')
      .update({ active_session_id: currentSessionId })
      .eq('id', data.user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed.' }, { status: 500 });
  }
}
