import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

declare global {
  var _supabaseInstance: ReturnType<typeof createClient> | undefined;
}

const createOrGetSupabase = () => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!globalThis._supabaseInstance) {
    globalThis._supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return globalThis._supabaseInstance;
};

export const supabase = createOrGetSupabase();

// Export the newly separated services
export * from './services/parent.service';
export * from './services/booking.service';
export * from './services/package.service';
export * from './services/admin.service';
export * from './services/settings.service';
