require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: child } = await supabase.from('children').select('*').limit(1).single();
  console.log("Triggering sync for child:", child.id);
  const { data, error } = await supabase.functions.invoke('sync-files-to-drive', {
    body: {
      type: 'UPDATE',
      table: 'children',
      record: child,
      old_record: { ...child, photo_url: null, parent_photo_url: null }
    }
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
