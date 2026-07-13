import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.prod to connect to Production Database
dotenv.config({ path: path.resolve(process.cwd(), '.env.prod') });

const supabaseUrl = process.env.PROD_SUPABASE_URL;
const supabaseKey = process.env.PROD_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.prod");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ⚠️ ระบุวันที่และเวลาที่ต้องการเริ่มดึงข้อมูล (เพื่อป้องกันการดึงข้อมูลเก่าจาก Google Form ที่มีอยู่แล้วไปต่อท้ายซ้ำ)
// เช่น ถ้าระบบเว็บเริ่มใช้จริงวันที่ 10 ก.ค. ให้ใส่ '2026-07-10T00:00:00Z'
const START_DATE = '2026-07-10T00:00:00Z'; 

async function backfillAll() {
  console.log(`Starting backfill to Form Responses 1 for data AFTER: ${START_DATE}...`);
  console.log(`(This will APPEND rows to the bottom of the sheet, without deleting anything)`);

  // 1. Fetch parents created AFTER the start date
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('*')
    .gte('created_at', START_DATE)
    .order('created_at', { ascending: true });

  if (parentsError) {
    console.error("Error fetching parents:", parentsError);
    return;
  }

  console.log(`Found ${parents.length} parents. Processing...`);

  let count = 0;

  for (const parent of parents) {
    // Check packages to determine if they did trial, payment, or both
    const { data: packages } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: true });

    let hasTrial = false;
    let paymentPackages = [];

    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        if (pkg.type && pkg.type.toLowerCase() === 'trial') {
          hasTrial = true;
        } else if (pkg.type !== 'manual_adjustment') {
          paymentPackages.push(pkg);
        }
      }
    } else {
      // If no packages found, they are just REGISTERED. We DO NOT send them to Form Responses!
      console.log(`[${count + 1}/${parents.length}] Skipping: ${parent.name || parent.email} (REGISTERED status, no packages)`);
      count++;
      continue;
    }

    try {
      // Send Trial row if applicable
      if (hasTrial) {
        console.log(`[${count + 1}/${parents.length}] Sending Trial row for: ${parent.name || parent.email}`);
        const res = await supabase.functions.invoke('append-to-sheets', {
          body: {
            form_type: 'trial',
            parentId: parent.id,
            transactionId: parent.id
          }
        });
        if (res.error) console.error("  -> Edge Function Error (Trial):", res.error);
        await sleep(1500); // Prevent Google Sheets rate limiting
      }

      // Send Payment rows
      for (const pkg of paymentPackages) {
        console.log(`[${count + 1}/${parents.length}] Sending Payment row for: ${parent.name || parent.email} (Pkg: ${pkg.type})`);
        const res = await supabase.functions.invoke('append-to-sheets', {
          body: {
            form_type: 'payment',
            parentId: parent.id,
            transactionId: pkg.id
          }
        });
        if (res.error) console.error("  -> Edge Function Error (Payment):", res.error);
        await sleep(1500); // Prevent Google Sheets rate limiting
      }

      count++;
    } catch (err) {
      console.error(`  -> Failed to process parent ${parent.id}:`, err);
    }
  }

  console.log("✅ Backfill completed successfully!");
}

backfillAll();
