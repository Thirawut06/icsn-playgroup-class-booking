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

async function uploadToGasWebhook(blob: Blob, fileName: string, parentFolderName: string, gasWebhookUrl: string, driveParentFolderId?: string) {
  const base64Data = await blobToBase64(blob);
  const payload = {
    action: 'sync_file',
    driveParentFolderId: driveParentFolderId || '',
    parentFolderName,
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
    
    // For UPDATEs, only process if the file URL changed OR status changed to approved
    if (type === 'UPDATE') {
      const fileUrlChanged = record.file_url !== old_record?.file_url;
      const justApproved = record.status === 'approved' && old_record?.status !== 'approved';
      
      if (table === 'slip_uploads' && !fileUrlChanged && !justApproved) {
        return new Response('Ignored', { status: 200 });
      }
      
      if (table === 'children' && record.photo_url === old_record?.photo_url && record.parent_photo_url === old_record?.parent_photo_url) {
        return new Response('Ignored', { status: 200 });
      }
      
      if (table === 'bookings' && record.signature_url === old_record?.signature_url) {
        return new Response('Ignored', { status: 200 });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let folderName = 'Unknown Parent';
    if (record.parent_id) {
      const { data: parent } = await supabase
        .from('parents')
        .select('name, phone, children(nickname)')
        .eq('id', record.parent_id)
        .single();
        
      if (parent) {
        const childNicknames = parent.children?.map((c: any) => c.nickname).filter(Boolean).join(', ');
        const childStr = childNicknames ? ` (น้อง${childNicknames})` : '';
        folderName = `${parent.name}${childStr} ${parent.phone || ''}`.trim();
      }
    } else if (table === 'bookings' && record.child_id) {
      // For bookings, we might not have parent_id directly on the record, so fetch via child
      const { data: child } = await supabase
        .from('children')
        .select('nickname, parents(id, name, phone)')
        .eq('id', record.child_id)
        .single();
        
      if (child && child.parents) {
        folderName = `${child.parents.name} (น้อง${child.nickname}) ${child.parents.phone || ''}`.trim();
      }
    }

    const driveParentFolderId = Deno.env.get('DRIVE_PARENT_FOLDER_ID') || undefined;

    if (table === 'slip_uploads' && record.file_url) {
      const fetchUrl = resolveFetchUrl(record.file_url, supabaseUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Could not fetch file: ${res.status}`);
      
      const blob = await res.blob();
      const ext = record.file_url.split('?')[0].split('.').pop() || 'jpg';
      const createdAt = new Date(record.created_at || new Date());
      const dateStr = createdAt.toISOString().split('T')[0];
      const timeStr = createdAt.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
      const fileName = `สลิปโอนเงิน_${dateStr}_${timeStr}.${ext}`;
      
      await uploadToGasWebhook(blob, fileName, folderName, gasWebhookUrl, driveParentFolderId);
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
          const dateStr = createdAt.toISOString().split('T')[0];
          await uploadToGasWebhook(blob, `รูปโปรไฟล์เด็ก_${dateStr}.${ext}`, folderName, gasWebhookUrl, driveParentFolderId);
        }
      }
      
      if (record.parent_photo_url) {
        const fetchUrl = resolveFetchUrl(record.parent_photo_url, supabaseUrl);
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = record.parent_photo_url.split('?')[0].split('.').pop() || 'jpg';
          const createdAt = new Date(record.created_at || new Date());
          const dateStr = createdAt.toISOString().split('T')[0];
          await uploadToGasWebhook(blob, `รูปโปรไฟล์ผู้ปกครอง_${dateStr}.${ext}`, folderName, gasWebhookUrl, driveParentFolderId);
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
      const dateStr = checkinDate.toISOString().split('T')[0];
      const timeStr = checkinDate.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
      const fileName = `ลายเซ็นเช็คอิน_${dateStr}_${timeStr}.${ext}`;
      
      await uploadToGasWebhook(blob, fileName, folderName, gasWebhookUrl, driveParentFolderId);
      console.log(`Synced signature for booking ${record.id} to folder: ${folderName}`);
    }

    return new Response('Success', { status: 200 });
  } catch (err: any) {
    console.error('Error syncing to drive:', err.message);
    return new Response(err.message, { status: 500 });
  }
});
