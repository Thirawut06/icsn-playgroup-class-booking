import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const createOrGetSupabase = () => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!(globalThis as any)._supabaseInstance) {
    (globalThis as any)._supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return (globalThis as any)._supabaseInstance;
};

export const supabase = createOrGetSupabase();

// Export the newly separated services
export * from './services/parent.service';
export * from './services/booking.service';
export * from './services/package.service';
export * from './services/admin.service';
export * from './services/settings.service';
