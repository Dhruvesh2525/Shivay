// src/proxy.ts
// This is the Next.js 16 proxy — runs on every request before the page loads.
// MUST be kept FAST — no heavy DB queries here.
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Only these paths need an authenticated user
const PROTECTED_PATHS = ['/bookings', '/profile', '/admin', '/manager', '/organizer'];

export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Check if this route needs authentication at all
  const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // PUBLIC ROUTES: zero overhead, skip all Supabase calls
  if (!needsAuth) {
    return NextResponse.next();
  }

  // PROTECTED ROUTES: one lightweight JWT verification (reads from cookie — no network call)
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
