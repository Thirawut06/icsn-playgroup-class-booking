import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/config/routes';

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  
  // Extract lang from pathname (e.g. /en/auth/verify-reset)
  const lang = pathname.split('/')[1] || 'th';

  if (token_hash) {
    const supabase = await createClient();
    
    // Verify the OTP via token_hash (This bypasses PKCE browser restriction)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' });
    
    if (!error) {
      // Successfully authenticated. Redirect to the password reset form.
      return NextResponse.redirect(`${origin}${ROUTES.RESET_PASSWORD(lang)}`);
    } else {
      console.error('Verify OTP error:', error.message);
      // Redirect to login page with an explicit error message
      return NextResponse.redirect(`${origin}/${lang}/login?error=invalid_token`);
    }
  }

  // If no token_hash is provided, redirect to login page
  return NextResponse.redirect(`${origin}/${lang}/login?error=invalid_token`);
}
