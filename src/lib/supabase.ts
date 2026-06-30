import { createClient } from './supabase/client';

export const supabase = createClient();

// Export the newly separated services
export * from './services/parent.service';
export * from './services/booking.service';
export * from './services/package.service';
export * from './services/admin.service';
export * from './services/settings.service';
