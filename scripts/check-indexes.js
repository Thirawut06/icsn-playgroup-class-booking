const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIndexes() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: `
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `
  });
  if (error) {
    console.log("No execute_sql rpc. Let's try direct REST if pg_meta is available, or just output.");
  }
}
checkIndexes();
