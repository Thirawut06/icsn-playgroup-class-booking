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
    return new Response('Config error', { status: 500 });
  }

  try {
    const payload = await req.json();
    const { table, limit = 10, offset = 0 } = payload;
    
    if (!table) {
       return new Response('Please provide table (slip_uploads, children, bookings), limit, offset', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let records: any[] = [];

    if (table === 'slip_uploads') {
       const { data, error } = await supabase.from('slip_uploads')
           .select('*')
           .eq('status', 'approved')
           .not('file_url', 'is', null)
           .range(offset, offset + limit - 1)
           .order('created_at', { ascending: true });
       if (error) throw error;
       records = data || [];
    } else if (table === 'children') {
       const { data, error } = await supabase.from('children')
           .select('*')
           .or('photo_url.not.is.null,parent_photo_url.not.is.null')
           .range(offset, offset + limit - 1)
           .order('created_at', { ascending: true });
       if (error) throw error;
       records = data || [];
    } else if (table === 'bookings') {
       const { data, error } = await supabase.from('bookings')
           .select('*')
           .not('signature_url', 'is', null)
           .range(offset, offset + limit - 1)
           .order('created_at', { ascending: true });
       if (error) throw error;
       records = data || [];
    }
    
    const results = [];

    for (const record of records) {
      const { folderName, parentPhone, childNickname } = await resolveFolderInfo(table, record, supabase);
      
      try {
        if (table === 'slip_uploads') {
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
           results.push({ id: record.id, status: 'synced slip' });
           console.log(`Synced slip ${record.id}`);
        } 
        else if (table === 'children') {
           let syncedPhoto = false;
           let syncedParent = false;
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
               syncedPhoto = true;
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
               
               const extractedParentName = folderName.split(' (')[0];
               const safeParentName = sanitizeForFilename(extractedParentName) || 'unknown';
               const fileName = `parent_profile_${safeParentName}.${ext}`;
               
               await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, gasWebhookUrl);
               syncedParent = true;
             }
           }
           results.push({ id: record.id, status: `synced child: ${syncedPhoto}, parent: ${syncedParent}` });
           console.log(`Synced child ${record.id}`);
        } 
        else if (table === 'bookings') {
           const fetchUrl = resolveFetchUrl(record.signature_url, supabaseUrl);
           const res = await fetch(fetchUrl);
           if (res.ok) {
              const blob = await res.blob();
              const ext = record.signature_url.split('?')[0].split('.').pop() || 'png';
              const checkinDate = record.checkin_at ? new Date(record.checkin_at) : new Date();
              const dateStr = getFormattedDateStr(checkinDate);
              
              const safeChildName = sanitizeForFilename(childNickname) || 'unknown';
              const fileName = `signature_${safeChildName}_${dateStr}.${ext}`;
              
              await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, gasWebhookUrl);
              results.push({ id: record.id, status: 'synced signature' });
              console.log(`Synced signature for booking ${record.id}`);
           } else {
              throw new Error(`Could not fetch signature: ${res.status}`);
           }
        }
      } catch (err: any) {
        console.error(`Failed ID ${record.id}: ${err.message}`);
        results.push({ id: record.id, status: 'failed', error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: records.length, results }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
