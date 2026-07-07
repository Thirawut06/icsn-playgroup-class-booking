import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function resolveFetchUrl(fileUrl: string, supabaseUrl: string): string {
  if (!fileUrl) return fileUrl;
  try {
    if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) {
      const urlObj = new URL(fileUrl);
      const supaObj = new URL(supabaseUrl);
      return `${supaObj.origin}${urlObj.pathname}${urlObj.search}`;
    }
  } catch (e) {
    // ignore
  }
  return fileUrl;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Chunking to ensure no call stack limits are hit
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

async function uploadToGasWebhook(
  blob: Blob, 
  fileName: string, 
  parentFolderName: string, 
  subFolderName: string,
  parentPhone: string,
  gasWebhookUrl: string
) {
  const base64Data = await blobToBase64(blob);
  const payload = {
    action: 'sync_file',
    parentFolderName,
    subFolderName,
    parentPhone,
    fileName,
    mimeType: blob.type || 'application/octet-stream',
    base64Data
  };

  const res = await fetch(gasWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`GAS Webhook failed: ${await res.text()}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`GAS Error: ${data.error}`);
  }
  return data;
}

// Helpers for string sanitization
function sanitizeForFilename(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/[()\/\\:*?"<>|]/g, '') // Remove invalid file characters and parentheses
    .replace(/_+/g, '_');     // Replace multiple underscores with single underscore
}

// Helpers for Date Formatting (DD-MM-YYYY)
function getFormattedDateStr(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function getFormattedTimeStr(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}${min}${s}`;
}

async function resolveFolderInfo(table: string, record: any, supabase: any) {
  let folderName = 'Unknown Parent';
  let parentPhone = '';
  let childNickname = '';

  if (record.parent_id) {
    const { data: parent } = await supabase
      .from('parents')
      .select('name, phone, children(nickname)')
      .eq('id', record.parent_id)
      .single();
      
    if (parent) {
      parentPhone = parent.phone || '';
      const childNicknames = parent.children?.map((c: any) => c.nickname).filter(Boolean).join(', ');
      const childStr = childNicknames ? ` (${childNicknames})` : '';
      folderName = `${parent.name}${childStr}`.trim();
    }
  }

  if (table === 'children') {
    const fn = record.full_name ? record.full_name.trim() : '';
    const nn = record.nickname ? record.nickname.trim() : '';
    if (fn && nn) childNickname = `${fn} (${nn})`;
    else if (fn) childNickname = fn;
    else if (nn) childNickname = nn;
  } else if (table === 'bookings' && record.child_id) {
    const { data: child } = await supabase
      .from('children')
      .select('nickname, full_name')
      .eq('id', record.child_id)
      .single();
      
    if (child) {
      const fn = child.full_name ? child.full_name.trim() : '';
      const nn = child.nickname ? child.nickname.trim() : '';
      if (fn && nn) childNickname = `${fn} (${nn})`;
      else if (fn) childNickname = fn;
      else if (nn) childNickname = nn;
    }
    
    // Fallback if child is somehow not found or has no name
    if (!childNickname && record.child_name_snapshot) {
      childNickname = record.child_name_snapshot.trim();
    }
  }

  return { folderName, parentPhone, childNickname };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const gasWebhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_DRIVE');

  if (!gasWebhookUrl || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required env vars: GOOGLE_APPS_SCRIPT_WEBHOOK_DRIVE is required');
    return new Response('Config error', { status: 500 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;
    
    // Process INSERTs, or UPDATEs where a file was just added
    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response('Ignored', { status: 200 });
    }
    
    if (table === 'slip_uploads') {
      if (type === 'INSERT') {
        return new Response('Ignored - Slips only uploaded upon approval', { status: 200 });
      }
      if (type === 'UPDATE') {
        const justApproved = record.status === 'approved' && old_record?.status !== 'approved';
        if (!justApproved) {
          return new Response('Ignored - Slip status did not change to approved', { status: 200 });
        }
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


    if (table === 'slip_uploads' && record.file_url) {
      const fetchUrl = resolveFetchUrl(record.file_url, supabaseUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Could not fetch file: ${res.status}`);
      
      const blob = await res.blob();
      const ext = record.file_url.split('?')[0].split('.').pop() || 'jpg';
      const createdAt = new Date(record.created_at || new Date());
      const dateStr = getFormattedDateStr(createdAt);
      
      const safePhone = sanitizeForFilename(parentPhone) || 'no_phone';
      const fileName = `slip_${safePhone}_${dateStr}.${ext}`;
      
      await uploadToGasWebhook(blob, fileName, folderName, 'สลิป', parentPhone, gasWebhookUrl);
      console.log(`Synced slip ${record.id} to folder: ${folderName}`);
    } 
    else if (table === 'children') {
      if (record.photo_url) {
        const fetchUrl = resolveFetchUrl(record.photo_url, supabaseUrl);
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = record.photo_url.split('?')[0].split('.').pop() || 'jpg';
          const createdAt = new Date(record.created_at || new Date());
          const dateStr = getFormattedDateStr(createdAt);
          
          const safeFullName = sanitizeForFilename(record.full_name);
          const safeNickname = sanitizeForFilename(record.nickname);
          const namePart = [safeFullName, safeNickname].filter(Boolean).join('_') || 'unknown';
          const fileName = `profile_${namePart}.${ext}`;
          
          await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, gasWebhookUrl);
        }
      }
      
      if (record.parent_photo_url) {
        const fetchUrl = resolveFetchUrl(record.parent_photo_url, supabaseUrl);
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = record.parent_photo_url.split('?')[0].split('.').pop() || 'jpg';
          const createdAt = new Date(record.created_at || new Date());
          const dateStr = getFormattedDateStr(createdAt);
          
          // parent_profile uses parent's name from resolveFolderInfo via query, but we can't easily get it here directly.
          // Wait, folderName is `${parent.name} (${childStr})`. Let's just use parent.name which we can extract, 
          // or we can query parent name if needed.
          // Actually, we can get parent name from folderName by splitting at ' ('.
          const extractedParentName = folderName.split(' (')[0];
          const safeParentName = sanitizeForFilename(extractedParentName) || 'unknown';
          const fileName = `parent_profile_${safeParentName}.${ext}`;
          
          await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, gasWebhookUrl);
        }
      }
      console.log(`Synced child photos for ${record.id} to folder: ${folderName}`);
    }
    else if (table === 'bookings' && record.signature_url) {
      const fetchUrl = resolveFetchUrl(record.signature_url, supabaseUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Could not fetch signature: ${res.status}`);
      
      const blob = await res.blob();
      const ext = record.signature_url.split('?')[0].split('.').pop() || 'png';
      const checkinDate = record.checkin_at ? new Date(record.checkin_at) : new Date();
      const dateStr = getFormattedDateStr(checkinDate);
      
      const safeChildName = sanitizeForFilename(childNickname) || 'unknown';
      const fileName = `signature_${safeChildName}_${dateStr}.${ext}`;
      
      await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, gasWebhookUrl);
      console.log(`Synced signature for booking ${record.id} to folder: ${folderName}`);
    }

    return new Response('Success', { status: 200 });
  } catch (err: any) {
    console.error('Error syncing to drive:', err.message);
    return new Response(err.message, { status: 500 });
  }
});
