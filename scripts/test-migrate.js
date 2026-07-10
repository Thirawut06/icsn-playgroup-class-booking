const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.prod' });

const SUPABASE_URL = process.env.PROD_SUPABASE_URL;
const SERVICE_KEY = process.env.PROD_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: Missing PROD_SUPABASE_URL or PROD_SERVICE_KEY in .env.prod");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMigration() {
  console.log("�ߘ� Starting migration of Production data to Google Sheets...");

  // PHASE11: Parents (trial form type -> ฐานข้อมูลฟู้เช้)
  console.log("\n--- PHASE 1: PARENTS (ฐานข้อมูลฟู้เช้) ---");
  const { data: parents, error: parentError } = await supabase.from('parents').select('*').order('created_at', { ascending: true });
  if (parents) {
    for (let i = 0; i < 1; i++) {
      console.log(`⌛ [${i + 1}/${parents.length}] Parent: ${parents[i].name}`);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/append-to-sheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({ form_type: 'trial', parentId: parents[i].id, transactionId: parents[i].id })
        });
        const text = await res.text();
        if (!res.ok) console.error(`Error ${res.status}: ${text}`);
      } catch (e) {
        console.error('Error:', e.message);
      }
      await sleep(1000);
    }
  }

  // PHASE 2: Payments (payment form type -> ประวัติการใช้เครดิต & เครดิตคงเหฏือ)
  console.log("\n--- PHASE 2: PAYMENTS (ประวัติการใช้เครดิต & เครดิตคงเหฏือ) ---");
  const { data: slips } = await supabase.from('slip_uploads').select('*').eq('status', 'approved').order('created_at', { ascending: true });
  if (slips) {
    for (let i = 0; i < 1; i++) {
      console.log(`⌛ [${i + 1}/${slips.length}] Payment: ${slips[i].id}`);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/append-to-sheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({ form_type: 'payment', parentId: slips[i].parent_id, transactionId: slips[i].id })
        });
        const text = await res.text();
        if (!res.ok) console.error(`Error ${res.status}: ${text}`);
      } catch (e) {
        console.error('Error:', e.message);
      }
      await sleep(1000);
    }
  }

  // PHASE 3: Bookings (booking form type -> ประวัติการเข้าเรียนทั้งหมด & ประวัติการใช้เครดิต & เครดิตคงเหฏือ)
  console.log("\n--- PHASE 3: BOOKINGS (ประวัติการเข้าเรียน & ประวัติการใช้เครดิต & เครดิตคงเหฏือ) ---");
  const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: true });
  if (bookings) {
    for (let i = 0; i < 1; i++) {
      console.log(`⌛ [${i + 1}/${bookings.length}] Booking: ${bookings[i].id}`);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/append-to-sheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({ form_type: 'booking', parentId: bookings[i].parent_id, transactionId: bookings[i].id })
        });
        const text = await res.text();
        if (!res.ok) console.error(`Error ${res.status}: ${text}`);
      } catch (e) {
        console.error('Error:', e.message);
      }
      await sleep(1000);
    }
  }

  console.log("\n✅ Migration complete!");
}

runMigration();