/**
 * backfill-sheets-direct.js
 * 
 * Backfill Google Sheets "Form Responses 1" directly from Supabase.
 * Bypasses Edge Function entirely — queries DB locally, posts to GAS webhook directly.
 * 
 * Run: node scripts/backfill-sheets-direct.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load Production Supabase credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env.prod') });
// Load GAS webhook URL (stored in .env.local)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const SUPABASE_URL = process.env.PROD_SUPABASE_URL;
const SUPABASE_KEY = process.env.PROD_SERVICE_KEY;
const GAS_SHEETS_URL = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.prod');
  process.exit(1);
}
if (!GAS_SHEETS_URL) {
  console.error('Missing GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// First web entry: 7/6/2026, 3:09:49 PM Thai time (UTC+7)
const START_DATE = '2026-07-06T08:09:49Z';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildTrialRow(parent, child, createdAt) {
  const row = Array(37).fill('');
  const ts = new Date(createdAt).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  });

  row[0] = ts;
  row[1] = '';
  row[2] = parent.email || '';
  row[3] = 'A free trial class / ทดลองเรียนฟรีครั้งแรก';
  row[4] = '';
  row[5] = parent.name || '';
  row[6] = parent.phone || '';
  row[7] = ''; // Parent photo (filled later by drive sync)

  if (child) {
    row[8]  = child.full_name || '';
    row[9]  = child.nickname || '';
    row[10] = child.date_of_birth
      ? new Date(child.date_of_birth + 'T00:00:00Z').toLocaleDateString('en-GB')
      : '';
    row[11] = ''; // Child photo (filled later by drive sync)
    row[12] = child.food_allergy || '-';
    row[13] = child.special_info || '-';
    row[14] = child.media_perm ? 'Yes' : 'No';
    row[15] = child.no_photo_perm ? 'Yes' : 'No';
  }

  row[35] = parent.id; // Transaction ID (AJ)
  return row;
}

function buildPaymentRow(parent, child, pkg, nonRefundable) {
  const row = Array(37).fill('');
  const ts = new Date(pkg.created_at).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  });

  row[0] = ts;
  row[1] = '';
  row[2] = parent.email || '';
  row[3] = 'Make a Payment / ชำระเงิน';

  row[16] = parent.name || '';
  row[17] = parent.phone || '';

  if (child) {
    row[18] = child.full_name || '';
    row[19] = child.nickname || '';
    row[20] = child.date_of_birth
      ? new Date(child.date_of_birth + 'T00:00:00Z').toLocaleDateString('en-GB')
      : '';
  }

  row[21] = pkg.type || '';
  row[22] = ''; // Payment slip (filled later by drive sync)
  row[25] = nonRefundable ? 'Yes' : 'No';

  if (child) {
    row[26] = child.media_perm ? 'Yes' : 'No';
    row[27] = child.no_photo_perm ? 'Yes' : 'No';
  }

  row[35] = pkg.id; // Transaction ID (AJ)
  return row;
}

async function postToGAS(rowData) {
  const res = await fetch(GAS_SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'append_row', rowData })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GAS error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log(`Backfill starting — data from: ${START_DATE}`);

  const { data: parents, error } = await supabase
    .from('parents')
    .select('id, email, name, phone, created_at')
    .gte('created_at', START_DATE)
    .order('created_at', { ascending: true });

  if (error) { console.error('Failed to fetch parents:', error); return; }
  console.log(`Found ${parents.length} parents.\n`);

  let rowsSent = 0;
  let rowsFailed = 0;

  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    const label = `[${i + 1}/${parents.length}] ${parent.name || parent.email}`;

    // Fetch child (latest)
    const { data: child } = await supabase
      .from('children')
      .select('full_name, nickname, date_of_birth, food_allergy, special_info, media_perm, no_photo_perm')
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch packages
    const { data: packages } = await supabase
      .from('packages')
      .select('id, type, non_refundable, created_at')
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: true });

    const hasTrial = packages?.some(p => p.type?.toLowerCase() === 'trial');
    const paymentPkgs = packages?.filter(
      p => p.type?.toLowerCase() !== 'trial' && p.type !== 'manual_adjustment'
    ) ?? [];

    // Skip REGISTERED (no packages at all)
    if (!hasTrial && paymentPkgs.length === 0) {
      console.log(`${label} → SKIP (no packages)`);
      continue;
    }

    // Send Trial row (use parent.created_at as timestamp)
    if (hasTrial) {
      try {
        await postToGAS(buildTrialRow(parent, child, parent.created_at));
        console.log(`${label} → Trial ✓`);
        rowsSent++;
        await sleep(1200);
      } catch (err) {
        console.error(`${label} → Trial FAILED: ${err.message}`);
        rowsFailed++;
      }
    }

    // Send Payment rows
    for (const pkg of paymentPkgs) {
      // Get non_refundable from slip_uploads (source of truth)
      // Note: slip_uploads.package_id stores the type string, not UUID — join by parent_id
      const { data: slip } = await supabase
        .from('slip_uploads')
        .select('non_refundable')
        .eq('parent_id', parent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nonRefundable = slip?.non_refundable ?? pkg.non_refundable ?? false;

      try {
        await postToGAS(buildPaymentRow(parent, child, pkg, nonRefundable));
        console.log(`${label} → Payment [${pkg.type}] | non_refundable: ${nonRefundable} ✓`);
        rowsSent++;
        await sleep(1200);
      } catch (err) {
        console.error(`${label} → Payment FAILED: ${err.message}`);
        rowsFailed++;
      }
    }
  }

  console.log(`\n✅ Done. Sent: ${rowsSent} rows. Failed: ${rowsFailed} rows.`);
}

main();
