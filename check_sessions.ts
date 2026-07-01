import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gte('session_date', '2026-07-01')
    .lte('session_date', '2026-07-31')
    .order('session_date', { ascending: true });
    
  console.log(error || data);
}

check();
