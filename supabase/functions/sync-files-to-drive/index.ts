import { SignJWT, importPKCS8 } from 'npm:jose';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function getGoogleAccessToken(serviceAccountJson: string, scope: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccount.client_email,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(payload.iss)
    .setAudience(payload.aud)
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .sign(privateKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to get Google token: ${await tokenRes.text()}`);
  }
  const data = await tokenRes.json();
  return data.access_token;
}

async function getOrCreateFolder(folderName: string, token: string, parentFolderId?: string): Promise<string> {
  let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  const createData = await createRes.json();
  return createData.id;
}

async function uploadFileToDrive(fileBlob: Blob, fileName: string, folderId: string, token: string) {
  const metadata = { name: fileName, parents: [folderId] };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${await res.text()}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceAccountJson || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required env vars');
    return new Response('Config error', { status: 500 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;
    
    // Process INSERTs, or UPDATEs where a file was just added
    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response('Ignored', { status: 200 });
    }
    
    // For UPDATEs, only process if the file URL changed (e.g. admin uploaded a slip later)
    if (type === 'UPDATE') {
      if (table === 'slip_uploads' && record.file_url === old_record?.file_url) return new Response('Ignored', { status: 200 });
      if (table === 'children' && record.photo_url === old_record?.photo_url && record.parent_photo_url === old_record?.parent_photo_url) return new Response('Ignored', { status: 200 });
    }

    const token = await getGoogleAccessToken(serviceAccountJson, 'https://www.googleapis.com/auth/drive.file');
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
    }

    const driveParentFolderId = Deno.env.get('DRIVE_PARENT_FOLDER_ID') || undefined;
    const folderId = await getOrCreateFolder(folderName, token, driveParentFolderId);

    if (table === 'slip_uploads' && record.file_url) {
      const res = await fetch(record.file_url);
      if (!res.ok) throw new Error('Could not fetch file from Supabase Storage');
      
      const blob = await res.blob();
      const ext = record.file_url.split('.').pop() || 'jpg';
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
      const fileName = `สลิปโอนเงิน_${dateStr}_${timeStr}.${ext}`;
      await uploadFileToDrive(blob, fileName, folderId, token);
      console.log(`Synced slip ${record.id} to folder: ${folderName}`);
    } 
    else if (table === 'children') {
      if (record.photo_url) {
        const res = await fetch(record.photo_url);
        if (res.ok) {
          const blob = await res.blob();
          const ext = record.photo_url.split('.').pop() || 'jpg';
          const dateStr = new Date().toISOString().split('T')[0];
          await uploadFileToDrive(blob, `รูปโปรไฟล์เด็ก_${dateStr}.${ext}`, folderId, token);
        }
      }
      
      if (record.parent_photo_url) {
        const res = await fetch(record.parent_photo_url);
        if (res.ok) {
          const blob = await res.blob();
          const ext = record.parent_photo_url.split('.').pop() || 'jpg';
          const dateStr = new Date().toISOString().split('T')[0];
          await uploadFileToDrive(blob, `รูปโปรไฟล์ผู้ปกครอง_${dateStr}.${ext}`, folderId, token);
        }
      }
      console.log(`Synced child photos for ${record.id} to folder: ${folderName}`);
    }

    return new Response('Success', { status: 200 });
  } catch (err: any) {
    console.error('Error syncing to drive:', err.message);
    return new Response(err.message, { status: 500 });
  }
});
