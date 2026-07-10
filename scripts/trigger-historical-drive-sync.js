const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars. Please check .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerDriveSync() {
  console.log("Triggering Edge Function via dummy update to sync historical files to Google Drive...");

  // 1. Trigger for parents (Parent Photo)
  console.log("Triggering parents...");
  const { data: parents, error: pErr } = await supabase.from('parents').select('id, name');
  if (pErr) throw pErr;
  
  let pCount = 0;
  for (const parent of parents) {
    const { error } = await supabase.from('parents').update({ name: parent.name }).eq('id', parent.id);
    if (!error) pCount++;
    // Small delay to prevent edge function overload
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`Triggered ${pCount} parents.`);

  // 2. Trigger for children (Child Photo)
  console.log("Triggering children...");
  const { data: children, error: cErr } = await supabase.from('children').select('id, full_name');
  if (cErr) throw cErr;
  
  let cCount = 0;
  for (const child of children) {
    const { error } = await supabase.from('children').update({ full_name: child.full_name }).eq('id', child.id);
    if (!error) cCount++;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`Triggered ${cCount} children.`);

  // 3. Trigger for slip_uploads (Payment Slips)
  console.log("Triggering slip_uploads...");
  const { data: slips, error: sErr } = await supabase.from('slip_uploads').select('id, status');
  if (sErr) throw sErr;
  
  let sCount = 0;
  for (const slip of slips) {
    const { error } = await supabase.from('slip_uploads').update({ status: slip.status }).eq('id', slip.id);
    if (!error) sCount++;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`Triggered ${sCount} slip_uploads.`);

  console.log("\nFinished triggering drive sync!");
  console.log("The Edge Functions are now running in the background and will update Google Sheets when finished.");
}

triggerDriveSync();
