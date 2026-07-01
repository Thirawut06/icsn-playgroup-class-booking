import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_active', true)
    .gt('session_date', new Date().toISOString().split('T')[0])
    .limit(1);
    
  console.log("Sessions:", data);
  if (error) console.error("Error:", error);
}

run();
