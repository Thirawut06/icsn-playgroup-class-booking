const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' }); // เราจะอ่านจาก .env.production แทน

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars. Please check .env.production");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncHistoricalData() {
  console.log(`Starting historical data sync via Edge Function...`);
  console.log(`Connecting to: ${supabaseUrl}`);

  // 1. Fetch actual payments (slip_uploads) NOT credit_transactions
  const { data: txs, error: txErr } = await supabase.from('slip_uploads').select('*');
  if (txErr) throw txErr;

  // 2. Fetch all packages (Trials)
  const { data: packages, error: pkgErr } = await supabase.from('packages').select('*').eq('type', 'trial');
  if (pkgErr) throw pkgErr;

  let successCount = 0;
  let failCount = 0;

  // Sync Payments
  console.log(`Found ${txs.length} slips to sync.`);
  for (const tx of txs) {
    try {
      const { data, error } = await supabase.functions.invoke('append-to-sheets', {
        body: { form_type: 'payment', parentId: tx.parent_id, transactionId: tx.id }
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(JSON.stringify(data));
      if (data && data.status === 'error') throw new Error(JSON.stringify(data));
      successCount++;
      console.log(`[OK] Synced payment ${tx.id}`, data);
    } catch (e) {
      failCount++;
      console.error(`[FAIL] Payment ${tx.id}:`, e.message || e);
    }
    await new Promise(r => setTimeout(r, 500)); // Delay
  }

  // Sync Trials
  console.log(`Found ${packages.length} trial packages to sync.`);
  for (const pkg of packages) {
    try {
      const { data, error } = await supabase.functions.invoke('append-to-sheets', {
        body: { form_type: 'trial', parentId: pkg.parent_id, transactionId: pkg.parent_id }
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(JSON.stringify(data));
      if (data && data.status === 'error') throw new Error(JSON.stringify(data));
      successCount++;
      console.log(`[OK] Synced trial ${pkg.parent_id}`, data);
    } catch (e) {
      failCount++;
      console.error(`[FAIL] Trial ${pkg.parent_id}:`, e.message || e);
    }
    await new Promise(r => setTimeout(r, 500)); // Delay
  }

  console.log(`\nSync complete! ${successCount} succeeded, ${failCount} failed.`);
}

syncHistoricalData();
