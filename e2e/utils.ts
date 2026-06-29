import { createClient } from '@supabase/supabase-js';

// We need to use the service role key to bypass RLS and setup data easily.
// For tests, we use the anon key if testing user flows, but to setup test data we might need direct DB access.
// Since we don't have the service_role key locally, we can either:
// 1. Ask the user for it
// 2. Or just simulate login through the UI and test from there.
// We will test entirely through the UI!

export const generateTestPhone = () => {
  return '099' + Math.floor(1000000 + Math.random() * 9000000).toString();
};
