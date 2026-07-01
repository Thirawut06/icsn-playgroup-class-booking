import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Using service role for test to bypass RLS, or we can use anon key if we want to simulate client.
// To simulate client with admin role, we need an admin JWT.
// Instead, let's just use the service role key to see if the query itself is valid in Supabase JS.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testUpdate() {
  const { data, error } = await supabase
    .from('sessions')
    .update({ is_active: true, theme: null })
    .gte('session_date', '2026-07-20')
    .lte('session_date', '2026-07-20')
    .select();
    
  console.log("Error:", error);
  console.log("Updated rows:", data?.length);
}

testUpdate();
