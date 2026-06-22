// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.delete({ name, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

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
    if (isAdminPath && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isManagerPath && profile?.role !== 'manager' && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isOrganizerPath && profile?.role !== 'organizer' && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
