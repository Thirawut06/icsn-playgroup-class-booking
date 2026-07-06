import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local for local testing
dotenv.config({ path: '.env.local' });

// Skip this test in CI environments as per AGENTS.md rules
const isCI = process.env.CI === 'true';

describe.skipIf(isCI)('Google Sheets Sync Webhook Integration', () => {
  it('should successfully invoke the sync-to-sheets edge function and return success', async () => {
    // Note: This relies on the environment variables being set in .env.local
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Skipping test because Supabase credentials are not set');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Invoke the edge function manually to verify it successfully builds the payload and sends it
    const { data, error } = await supabase.functions.invoke('sync-to-sheets', {
      method: 'POST',
      body: {}
    });

    // We expect no HTTP errors from the invoke itself
    expect(error).toBeNull();
    
    // We expect the edge function to return success: true
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Synced successfully');
  }, 30000);
});
