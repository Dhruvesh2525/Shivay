// src/lib/auth-helpers.ts
// Centralized authorization, single-session enforcement, and rate limiting
// helpers used across API routes. Keeps role logic in one place so the
// "manager cannot access revenue" / "organizer only own tournaments" rules
// can't drift between endpoints.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type Role = 'customer' | 'manager' | 'organizer' | 'super_admin';

export interface AuthContext {
  user: User;
  role: Role;
  supabase: SupabaseClient;
}

/** Extract session_id from JWT payload */
export function getSessionId(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return payload.session_id || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the authenticated user and their role. Enforces single-active-session:
 * if the profile's active_session_id does not match the request's access token
 * session_id, the session is treated as superseded and rejected.
 *
 * Returns an error NextResponse when unauthorized / session superseded.
 */
export async function resolveAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, is_active, active_session_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    return NextResponse.json({ error: 'Account is not active.' }, { status: 403 });
  }

  // Single-active-session enforcement (SRD).
  const activeSession = profile.active_session_id as string | null;
  if (activeSession) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (token) {
      const currentMarker = getSessionId(token);
      if (currentMarker && activeSession !== currentMarker) {
        return NextResponse.json({ error: 'Session terminated. Another device is active.' }, { status: 401 });
      }
    }
  }

  return { user, role: profile.role as Role, supabase };
}

/** Require the caller to hold one of the allowed roles. */
export async function requireRole(...allowed: Role[]): Promise<AuthContext | NextResponse> {
  const ctx = await resolveAuth();
  if (ctx instanceof NextResponse) return ctx;
  if (!allowed.includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  return ctx;
}
