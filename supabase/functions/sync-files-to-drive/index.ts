import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  resolveFetchUrl,
  uploadToGasWebhook,
  updateGoogleDriveUrl,
  sanitizeForFilename,
  getFormattedDateStr,
  resolveFolderInfo,
} from '../_shared/drive-utils.ts';

// --- Specific Handlers ---

async function updateGoogleSheetsLink(
  gasSheetsWebhookUrl: string, 
  transactionId: string, 
  type: string, 
  url: string
) {
  if (!gasSheetsWebhookUrl) return;
  const payload = {
    action: 'update_drive_link',
    transactionId,
    type,
    url
  };
  
  try {
    const res = await fetch(gasSheetsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      console.error(`GAS Sheets Webhook failed to update link: ${await res.text()}`);
    } else {
      console.log(`Updated Sheets link for ${transactionId} (${type})`);
    }
  } catch (err) {
    console.error(`Failed to invoke GAS Sheets Webhook:`, err);
  }
}

// deno-lint-ignore no-explicit-any
async function handleSlipUpload(record: any, folderName: string, parentPhone: string, supabaseUrl: string, supabase: any, gasWebhookUrl: string, gasSheetsWebhookUrl: string) {
  if (!record.file_url) return;
  const fetchUrl = resolveFetchUrl(record.file_url, supabaseUrl);
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Could not fetch file: ${res.status}`);
  
  const blob = await res.blob();
  const ext = record.file_url.split('?')[0].split('.').pop() || 'jpg';
  const createdAt = new Date((record.created_at as string) || new Date());
  const dateStr = getFormattedDateStr(createdAt);
  
  const safePhone = sanitizeForFilename(parentPhone) || 'no_phone';
  const fileName = `slip_${safePhone}_${dateStr}.${ext}`;
  
  const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, '', parentPhone, 'slip', gasWebhookUrl);
  if (gasResponse?.url) {
    if (record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id, gasResponse.folderUrl || gasResponse.url);
    if (gasSheetsWebhookUrl) await updateGoogleSheetsLink(gasSheetsWebhookUrl, record.id, 'slip', gasResponse.url);
  }
  console.log(`Synced slip ${record.id} to folder: ${folderName}`);
}

// deno-lint-ignore no-explicit-any
async function handleChildRecord(record: any, folderName: string, parentPhone: string, childNickname: string, supabaseUrl: string, supabase: any, gasWebhookUrl: string, gasSheetsWebhookUrl: string) {
  if (record.photo_url) {
    const fetchUrl = resolveFetchUrl(record.photo_url, supabaseUrl);
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const blob = await res.blob();
      const ext = record.photo_url.split('?')[0].split('.').pop() || 'jpg';
      
      const safeFullName = sanitizeForFilename(record.full_name);
      const safeNickname = sanitizeForFilename(record.nickname);
      const namePart = [safeFullName, safeNickname].filter(Boolean).join('_') || 'unknown';
      const fileName = `profile_${namePart}.${ext}`;
      
      const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, 'child_photo', gasWebhookUrl);
      if (gasResponse?.url) {
        if (record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id, gasResponse.folderUrl || gasResponse.url);
        if (gasSheetsWebhookUrl) await updateGoogleSheetsLink(gasSheetsWebhookUrl, record.parent_id, 'child_photo', gasResponse.url);
      }
    }
  }
  
  if (record.parent_photo_url) {
    const fetchUrl = resolveFetchUrl(record.parent_photo_url, supabaseUrl);
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const blob = await res.blob();
      const ext = record.parent_photo_url.split('?')[0].split('.').pop() || 'jpg';
      
      const extractedParentName = folderName.split(' (')[0];
      const safeParentName = sanitizeForFilename(extractedParentName) || 'unknown';
      const fileName = `parent_profile_${safeParentName}.${ext}`;
      
      const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, '', parentPhone, 'parent_photo', gasWebhookUrl);
      if (gasResponse?.url) {
        if (record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id, gasResponse.folderUrl || gasResponse.url);
        if (gasSheetsWebhookUrl) await updateGoogleSheetsLink(gasSheetsWebhookUrl, record.parent_id, 'parent_photo', gasResponse.url);
      }
    }
  }
  console.log(`Synced child photos for ${record.id} to folder: ${folderName}`);
}

// deno-lint-ignore no-explicit-any
async function handleBookingSignature(record: any, folderName: string, parentPhone: string, childNickname: string, supabaseUrl: string, _supabase: any, gasWebhookUrl: string) {
  if (!record.signature_url) return;
  const fetchUrl = resolveFetchUrl(record.signature_url, supabaseUrl);
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Could not fetch signature: ${res.status}`);
  
  const blob = await res.blob();
  const ext = record.signature_url.split('?')[0].split('.').pop() || 'png';
  const checkinDate = record.checkin_at ? new Date(record.checkin_at) : new Date();
  const dateStr = getFormattedDateStr(checkinDate);
  
  const safeChildName = sanitizeForFilename(childNickname) || 'unknown';
  const fileName = `signature_${safeChildName}_${dateStr}.${ext}`;
  
  await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, 'signature', gasWebhookUrl);
  console.log(`Synced signature for booking ${record.id} to folder: ${folderName}`);
}

// --- Main Handler ---

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (supabaseUrl && !supabaseUrl.includes('psusuyesaxuhiondxqie')) {
    console.log('Skipping sync: Not in production environment.');
    return new Response('Ignored - Not in production environment', { status: 200 });
  }
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const gasWebhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_DRIVE');
  const gasSheetsWebhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');

  if (!gasWebhookUrl || !supabaseUrl || !supabaseServiceKey || !gasSheetsWebhookUrl) {
    console.error('Missing required env vars');
    return new Response('Config error', { status: 500 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;
    
    if (type !== 'INSERT' && type !== 'UPDATE') return new Response('Ignored', { status: 200 });
    
    // Ignore early based on specific table rules
    if (table === 'slip_uploads') {
      if (type === 'INSERT') return new Response('Ignored - Slips only uploaded upon approval', { status: 200 });
      if (type === 'UPDATE' && !(record.status === 'approved' && old_record?.status !== 'approved')) {
        return new Response('Ignored - Slip status did not change to approved', { status: 200 });
      }
    } else if (type === 'UPDATE') {
      if (table === 'children' && record.photo_url === old_record?.photo_url && record.parent_photo_url === old_record?.parent_photo_url) {
        return new Response('Ignored', { status: 200 });
      }
      if (table === 'bookings' && record.signature_url === old_record?.signature_url) {
        return new Response('Ignored', { status: 200 });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { folderName, parentPhone, childNickname } = await resolveFolderInfo(table, record, supabase);

    switch (table) {
      case 'slip_uploads':
        await handleSlipUpload(record, folderName, parentPhone, supabaseUrl, supabase, gasWebhookUrl, gasSheetsWebhookUrl);
        break;
      case 'children':
        await handleChildRecord(record, folderName, parentPhone, childNickname, supabaseUrl, supabase, gasWebhookUrl, gasSheetsWebhookUrl);
        break;
      case 'bookings':
        await handleBookingSignature(record, folderName, parentPhone, childNickname, supabaseUrl, supabase, gasWebhookUrl);
        break;
      default:
        console.log(`No sync logic defined for table: ${table}`);
    }

    return new Response('Success', { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error syncing to drive:', errorMsg);
    return new Response(errorMsg, { status: 500 });
  }
});
