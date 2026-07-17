/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSetDateStatus() {
  console.log('Testing set_date_status (false) for 2026-09-07 to 2026-09-18');
  
  const { data, error } = await supabase.rpc('set_date_status', {
    p_start_date: '2026-09-07',
    p_end_date: '2026-09-18',
    p_is_open: false,
    p_reason: null,
    p_time_label: null
  });
  
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
    
    // Fetch closures again
    const { data: closures } = await supabase
      .from('school_closures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log('Closures after RPC:', JSON.stringify(closures, null, 2));
  }
}

testSetDateStatus();
