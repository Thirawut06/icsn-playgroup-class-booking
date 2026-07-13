import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PROD_SUPABASE_URL;
const supabaseKey = process.env.PROD_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function trigger() {
  console.log("Triggering sync-sheets-snapshot...");
  const { data, error } = await supabase.functions.invoke('sync-sheets-snapshot', {
    body: { source: 'manual-trigger' }
  });
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}

trigger();
