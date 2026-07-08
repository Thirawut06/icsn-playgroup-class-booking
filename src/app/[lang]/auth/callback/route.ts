import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get('code');
  
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  
  // SECURITY: Prevent Open Redirect Vulnerability
  // Ensure 'next' is a relative path and not an absolute or protocol-relative URL
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/';
  }

  // Extract lang from pathname to ensure fallback goes to correct localized login
  const lang = pathname.split('/')[1] || 'th';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Exchange code error:', error.message);
    }
  }

  // return the user to an error page or login if code is missing/invalid
  return NextResponse.redirect(`${origin}/${lang}/login?error=invalid_token`);
}
