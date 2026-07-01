import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isAdminUser } from '@/lib/auth/roles';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Protect parent routes
  if (pathname.startsWith('/book') || pathname.startsWith('/apply')) {
    if (!user) {
      // Not authenticated, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes
  // We do NOT redirect /admin here. The actual protection is securely handled
  // by AdminLoginGate and Supabase RLS. Redirecting here prevents logged-in 
  // parents from accessing the admin login screen to switch accounts, and 
  // can cause infinite redirect loops due to Next.js router caching.
  if (pathname.startsWith('/admin')) {
    // Let them access /admin to see AdminLoginGate or the Dashboard
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
