import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/roles';

/**
 * POST /api/trigger-drive-sync
 *
 * Fires off the `sync-signature-to-drive` Edge Function as a background task.
 * The client does NOT need to await the Google Drive upload — this returns 202
 * immediately after kicking off the function.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the caller is an authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Invoke the Edge Function without awaiting its completion
    supabase.functions.invoke('sync-signature-to-drive', { body }).catch((err: unknown) => {
      console.error('[trigger-drive-sync] Edge function error (background):', err);
    });

    return NextResponse.json({ queued: true }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[trigger-drive-sync] Route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
