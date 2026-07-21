// ============================================================
// ICSN Playgroup — Supabase to Sheets Backfill
// ============================================================
// วิธีติดตั้ง:
// 1. เปิด Google Sheets → Extensions → Apps Script
// 2. วางโค้ดนี้ แล้วบันทึก
// 3. ไปที่ Project Settings → Script Properties → เพิ่ม:
//    SUPABASE_URL  = https://psusuyesaxuhiondxqie.supabase.co
//    SUPABASE_KEY  = <service role key จาก .env.prod (PROD_SERVICE_KEY)>
// 4. รัน onOpen() ครั้งเดียว หรือ refresh Sheet เพื่อให้เมนูปรากฏ
// ============================================================

const SHEET_NAME    = 'Form Responses 1';
const WEB_START_ROW = 255;               // แถวแรกของข้อมูลจากเว็บ (Google Form เดิมอยู่แถว 2-254)
const START_DATE    = '2026-07-06T08:09:49Z'; // ข้อมูลแรกในระบบเว็บ
const TIMEZONE      = 'Asia/Bangkok';

// ──────────────────────────────────────────────────────────
// MENU
// ──────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet().addMenu('🔄 Web Data Sync', [
    { name: '✅ Sync ข้อมูลใหม่ล่าสุด (Incremental)', functionName: 'backfillFromSupabase' }
  ]);
}

function noop() {}

// ──────────────────────────────────────────────────────────
// SUPABASE REST API
// ──────────────────────────────────────────────────────────

function getConfig_() {
  const props = PropertiesService.getScriptProperties();
  const url   = props.getProperty('SUPABASE_URL');
  const key   = props.getProperty('SUPABASE_KEY');
  if (!url || !key) throw new Error('กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_KEY ใน Script Properties');
  return { url, key };
}

function supabaseFetch_(config, path) {
  const res = UrlFetchApp.fetch(config.url + path, {
    method: 'GET',
    headers: {
      apikey:        config.key,
      Authorization: 'Bearer ' + config.key,
    },
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code !== 200) throw new Error('Supabase ' + code + ': ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

// ──────────────────────────────────────────────────────────
// FORMATTERS
// ──────────────────────────────────────────────────────────

// Format: 7/6/2026 15:09:49 (ตรงกับ Google Form format)
function formatTimestamp_(isoString) {
  const d = new Date(isoString);
  return Utilities.formatDate(d, TIMEZONE, 'M/d/yyyy HH:mm:ss');
}

// Format: 16/08/2024 (en-GB style, timezone-safe)
function formatDob_(dob) {
  if (!dob) return '';
  const p = dob.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

// ──────────────────────────────────────────────────────────
// GOOGLE DRIVE — resolve file URLs from folder
// ──────────────────────────────────────────────────────────

function getDriveLinks_(folderUrl) {
  const empty = { parentPhoto: '', childPhoto: '', slip: '' };
  if (!folderUrl) return empty;

  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) return empty;

  try {
    const folder = DriveApp.getFolderById(match[1]);
    const files  = folder.getFiles();
    let parentPhoto = '', childPhoto = '', slip = '';

    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName().toLowerCase();
      const url  = file.getUrl();
      if      (name.startsWith('parent_profile_')) parentPhoto = url;
      else if (name.startsWith('profile_'))        childPhoto  = url;
      else if (name.startsWith('slip_'))            slip        = url;
    }

    return { parentPhoto, childPhoto, slip };
  } catch (e) {
    Logger.log('[Drive] error for folder ' + folderUrl + ': ' + e.message);
    return empty;
  }
}

// ──────────────────────────────────────────────────────────
// ROW BUILDERS  (based on column_mapping.md)
// ──────────────────────────────────────────────────────────

function buildTrialRow_(parent, child, driveLinks) {
  const row = Array(37).fill('');
  row[0]  = formatTimestamp_(parent.created_at);  // A  Timestamp
  row[2]  = parent.email || '';                   // C  Email
  row[3]  = 'A free trial class / ทดลองเรียนฟรีครั้งแรก'; // D
  row[5]  = parent.name  || '';                   // F  Parent Name
  row[6]  = parent.phone || '';                   // G  Phone
  row[7]  = driveLinks.parentPhoto;               // H  Parent Photo (Drive URL)

  if (child) {
    row[8]  = child.full_name  || '';             // I  Child Full Name
    row[9]  = child.nickname   || '';             // J  Nickname
    row[10] = formatDob_(child.dob);              // K  DOB  ← field name is 'dob', not 'date_of_birth'
    row[11] = driveLinks.childPhoto;              // L  Child Photo (Drive URL)
    row[12] = child.food_allergy || '-';          // M  Food Allergy
    row[13] = child.special_info || '-';          // N  Special Info
    row[14] = child.media_perm    ? 'Yes' : 'No'; // O  Media Permission
    row[15] = child.no_photo_perm ? 'Yes' : 'No'; // P  No Photo Permission
  }

  row[35] = parent.id; // AJ  Transaction ID
  return row;
}

function buildPaymentRow_(parent, child, pkg, nonRefundable, driveLinks) {
  const row = Array(37).fill('');
  row[0]  = formatTimestamp_(pkg.created_at);     // A  Timestamp
  row[2]  = parent.email || '';                   // C  Email
  row[3]  = 'Make a Payment / ชำระเงิน';          // D
  row[16] = parent.name  || '';                   // Q  Parent Name
  row[17] = parent.phone || '';                   // R  Phone

  if (child) {
    row[18] = child.full_name || '';              // S  Child Full Name
    row[19] = child.nickname  || '';              // T  Nickname
    row[20] = formatDob_(child.dob);             // U  DOB
  }

  row[21] = pkg.type     || '';                   // V  Package Type
  row[22] = driveLinks.slip;                      // W  Payment Slip (Drive URL)
  row[25] = nonRefundable ? 'Yes' : 'No';         // Z  Non-Refundable

  if (child) {
    row[26] = child.media_perm    ? 'Yes' : 'No'; // AA  Media Permission
    row[27] = child.no_photo_perm ? 'Yes' : 'No'; // AB  No Photo Permission
  }

  row[35] = pkg.id; // AJ  Transaction ID
  return row;
}

// ──────────────────────────────────────────────────────────
// MAIN: BACKFILL
// ──────────────────────────────────────────────────────────

function backfillFromSupabase() {
  let ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { /* Ignore when running from Time-based trigger */ }
  
  const config = getConfig_();
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    const msg = '❌ ไม่พบ sheet: ' + SHEET_NAME;
    if (ui) ui.alert(msg);
    Logger.log(msg);
    return;
  }

  Logger.log('=== Sync starting: Incremental ===');

  // --- 1. Read existing Transaction IDs from Column AJ (index 36) ---
  const lastRow = sheet.getLastRow();
  const existingIds = new Set();
  if (lastRow >= WEB_START_ROW) {
    // Column AJ is 36 (A=1...Z=26...AJ=36)
    const ajValues = sheet.getRange(WEB_START_ROW, 36, lastRow - WEB_START_ROW + 1, 1).getValues();
    for (const r of ajValues) {
      if (r[0]) existingIds.add(String(r[0]).trim());
    }
  }
  Logger.log('Existing IDs in Sheets: ' + existingIds.size);

  // Fetch ALL parents — every record in Supabase is from the web system
  const parents = supabaseFetch_(config,
    '/rest/v1/parents'
    + '?select=id,email,name,phone,created_at,google_drive_url'
    + '&order=created_at.asc'
  );
  Logger.log('Parents found: ' + parents.length);

  const rowsToAppend = [];

  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    Logger.log('[' + (i + 1) + '/' + parents.length + '] ' + (parent.name || parent.email));

    // 2. Fetch child (latest)
    const children = supabaseFetch_(config,
      '/rest/v1/children'
      + '?select=full_name,nickname,dob,food_allergy,special_info,media_perm,no_photo_perm'
      + '&parent_id=eq.' + parent.id
      + '&order=created_at.desc&limit=1'
    );
    const child = children[0] || null;

    // 3. Fetch packages
    const packages = supabaseFetch_(config,
      '/rest/v1/packages'
      + '?select=id,type,created_at'
      + '&parent_id=eq.' + parent.id
      + '&order=created_at.asc'
    );

    // 4. Fetch slip — non_refundable source of truth
    // Note: slip_uploads.package_id stores type string (not UUID), join by parent_id
    const slips = supabaseFetch_(config,
      '/rest/v1/slip_uploads'
      + '?select=non_refundable'
      + '&parent_id=eq.' + parent.id
      + '&order=created_at.desc&limit=1'
    );
    const nonRefundable = (slips[0] && slips[0].non_refundable === true);

    // 5. Resolve Drive file links from folder URL
    const driveLinks = getDriveLinks_(parent.google_drive_url);

    // 6. Classify packages
    const hasTrial    = packages.some(p => p.type && p.type.toLowerCase() === 'trial');
    const paymentPkgs = packages.filter(
      p => p.type && p.type.toLowerCase() !== 'trial' && p.type !== 'manual_adjustment'
    );

    if (!hasTrial && paymentPkgs.length === 0) {
      Logger.log('  → SKIP (no packages)');
      continue;
    }

    if (hasTrial) {
      if (existingIds.has(parent.id)) {
        Logger.log('  → SKIP Trial (ID already exists: ' + parent.id + ')');
      } else {
        rowsToAppend.push(buildTrialRow_(parent, child, driveLinks));
        Logger.log('  → Trial row added');
      }
    }

    for (const pkg of paymentPkgs) {
      if (existingIds.has(pkg.id)) {
        Logger.log('  → SKIP Payment (ID already exists: ' + pkg.id + ')');
      } else {
        rowsToAppend.push(buildPaymentRow_(parent, child, pkg, nonRefundable, driveLinks));
        Logger.log('  → Payment row added [' + pkg.type + '] non_refundable=' + nonRefundable);
      }
    }
  }

  // 7. Batch-write all rows at once (no webhook, no rate limit)
  if (rowsToAppend.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rowsToAppend.length, 37).setValues(rowsToAppend);
    Logger.log('✅ Written ' + rowsToAppend.length + ' rows to sheet.');
    if (ui) ui.alert('✅ อัปเดตข้อมูลจากระบบเว็บ Playgroup สำเร็จ!\nเพิ่มแถวใหม่: ' + rowsToAppend.length + ' rows\n(ดู Logs ใน Apps Script console สำหรับรายละเอียด)');
  } else {
    Logger.log('ℹ️ ข้อมูลระบบเว็บ Playgroup ล่าสุดแล้ว (ไม่มีแถวใหม่ต้องเพิ่ม)');
    if (ui) ui.alert('ℹ️ ข้อมูลระบบเว็บ Playgroup ล่าสุดแล้ว (ไม่มีแถวใหม่ต้องเพิ่ม)');
  }
}