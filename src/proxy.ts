import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const SUPPORTED_LOCALES = ['th', 'en'];
const DEFAULT_LOCALE = 'th';

function getPreferredLocale(request: NextRequest): string {
  // Check Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  
  // Simple parsing: look for 'en' or 'th' in the header
  const languages = acceptLang.split(',').map(part => {
    const [lang] = part.trim().split(';');
    return lang.trim().toLowerCase();
  });

  for (const lang of languages) {
    // Match exact or prefix (e.g. 'en-US' → 'en', 'th-TH' → 'th')
    const prefix = lang.split('-')[0];
    if (SUPPORTED_LOCALES.includes(prefix)) {
      return prefix;
    }
  }

  return DEFAULT_LOCALE;
}

function pathnameHasLocale(pathname: string): boolean {
  return SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip admin routes — they stay Thai-only, no locale prefix
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // If pathname already has a locale, proceed normally
  if (pathnameHasLocale(pathname)) {
    const { supabaseResponse, user } = await updateSession(request);

    // Extract lang from path
    const lang = pathname.split('/')[1];

    // Protect parent routes
    if (pathname.startsWith(`/${lang}/book`) || pathname.startsWith(`/${lang}/apply`)) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${lang}/login`;
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  // No locale in path — redirect to locale-prefixed path
  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
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
