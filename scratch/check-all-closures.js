/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllClosures() {
  const { data, error } = await supabase
    .from('school_closures')
    .select('*')
    .order('start_date', { ascending: true });
    
  console.log(JSON.stringify(data, null, 2));
}

checkAllClosures();
