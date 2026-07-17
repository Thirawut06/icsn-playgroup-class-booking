/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClosures() {
  const { data, error } = await supabase
    .from('school_closures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkClosures();
