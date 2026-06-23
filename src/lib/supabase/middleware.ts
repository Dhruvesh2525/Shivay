// src/lib/supabase/middleware.ts
// PERFORMANCE: Middleware must be as fast as possible — it runs on every request.
// Strategy: only do the minimum needed checks. Heavy auth checks (profile DB queries)
// happen in the page/API, NOT here.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require a logged-in session
const PROTECTED_PATHS = ['/bookings', '/profile', '/admin', '/manager', '/organizer'];

// Routes that require specific roles (checked server-side in those pages, not here)
const ADMIN_PATHS = ['/admin', '/manager', '/organizer'];

export async function updateSession(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Skip middleware entirely for static assets — fastest possible path
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') // static files (png, ico, svg, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if this path even needs auth
  const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!needsAuth) {
    // Public page — skip all Supabase calls, just continue
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Only for protected paths: check session from cookie (no network call)
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

  // Single lightweight call — reads JWT from cookie, no network round-trip
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in — let the page handle role-based access
  // (Role checks in every DB query on every request is too slow)
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
