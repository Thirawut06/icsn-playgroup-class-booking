import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateSessions() {
  console.log('Starting migration...');
  
  // 1. Update Morning Sessions
  const { data: morningData, error: morningErr } = await supabase
    .from('sessions')
    .update({ time_label: '9.00 - 10.30' })
    .eq('time_label', 'เช้า (09:30 - 11:30)')
    .select();
    
  if (morningErr) console.error('Error morning:', morningErr);
  else console.log('Migrated morning sessions:', morningData?.length || 0);

  // 2. Update Afternoon Sessions (if any)
  const { data: afternoonData, error: afternoonErr } = await supabase
    .from('sessions')
    .update({ time_label: '13.15 - 14.45' })
    .eq('time_label', 'บ่าย (13:30 - 15:30)')
    .select();
    
  if (afternoonErr) console.error('Error afternoon:', afternoonErr);
  else console.log('Migrated afternoon sessions:', afternoonData?.length || 0);
  
  console.log('Migration complete.');
}

migrateSessions();
