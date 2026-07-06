import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local for local/staging testing
dotenv.config({ path: '.env.local' });

const isCI = process.env.CI === 'true';

describe.skipIf(isCI)('Google Chat Webhook Integration', () => {
  it('should successfully invoke the google-chat-notify edge function with a mock payload', async () => {
    // Note: This relies on the environment variables being set in .env.local
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Skipping test because Supabase credentials are not set');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Provide a safe mock payload that won't cause side effects,
    // or test a scenario where the Edge Function parses it but might fail to send if Webhook isn't configured in Staging yet.
    const mockPayload = {
      type: 'INSERT',
      table: 'children',
      record: {
        parent_id: '00000000-0000-0000-0000-000000000000',
        nickname: 'Mock Child TDD',
        created_at: new Date().toISOString()
      },
      old_record: null
    };

    const { data, error } = await supabase.functions.invoke('google-chat-notify', {
      method: 'POST',
      body: mockPayload
    });

    // If the function is not deployed to the target environment, this will fail.
    if (error) {
      console.error('Edge function invocation failed. If this returns 404 or 500, ensure google-chat-notify is deployed to the Staging environment and secrets are set.');
    }

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // In our implementation, we return { success: true } even if webhook is not configured (it just logs an error)
    expect(data.success).toBe(true);
  }, 30000);
});
