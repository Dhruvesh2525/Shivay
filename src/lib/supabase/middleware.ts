// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.error('Middleware Auth Check Failed:', err);
  }

  // Route guarding checks
  const url = new URL(request.url);
  const path = url.pathname;

  // If page is restricted, verify authenticated status & role
  const isAdminPath = path.startsWith('/admin');
  const isManagerPath = path.startsWith('/manager');
  const isOrganizerPath = path.startsWith('/organizer');
  const isProtectedPath = isAdminPath || isManagerPath || isOrganizerPath || path.startsWith('/bookings') || path.startsWith('/profile');

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    try {
      // 1. Single session check: retrieve current active session ID from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, active_session_id, is_active')
        .eq('id', user.id)
        .single();

      // Check if user account is deactivated
      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?error=deactivated', request.url));
      }

      // Force sign-out if the current session ID doesn't match the database value
      const currentSessionToken = request.cookies.get('sb-access-token')?.value;
      if (profile?.active_session_id && currentSessionToken && profile.active_session_id !== currentSessionToken) {
        await supabase.auth.signOut();
        const redirectResponse = NextResponse.redirect(new URL('/login?error=session_terminated', request.url));
        redirectResponse.cookies.delete('sb-access-token');
        redirectResponse.cookies.delete('sb-refresh-token');
        return redirectResponse;
      }

      // 2. Role validation guards
      if (isAdminPath && !['super_admin', 'manager', 'organizer'].includes(profile?.role || '')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isManagerPath && profile?.role !== 'manager' && profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isOrganizerPath && profile?.role !== 'organizer' && profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      console.error('Middleware database query failed:', err);
    }
  }

  return response;
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
