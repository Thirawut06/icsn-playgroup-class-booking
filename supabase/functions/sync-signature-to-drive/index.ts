
import { JWT } from 'https://deno.land/x/djwt@v2.8/mod.ts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SyncPayload {
  bookingId: string;
  signatureUrl: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  sessionDate: string;  // 'YYYY-MM-DD'
  sessionLabel: string; // '9.00 - 10.30'
}

// ─── Google Drive helpers ────────────────────────────────────────────────────
async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
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

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function findOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string | null,
): Promise<string> {
  const escapedName = folderName.replace(/'/g, "\\'");
  const query = parentFolderId
    ? `name='${escapedName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${escapedName}' and 'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createBody: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) createBody.parents = [parentFolderId];

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });
  const createData = await createRes.json();
  if (!createData.id) {
    throw new Error(`Failed to create Drive folder: ${JSON.stringify(createData)}`);
  }
  return createData.id;
}

async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  fileBuffer: ArrayBuffer,
  parentFolderId: string,
): Promise<string> {
  const metadata = {
    name: fileName,
    parents: [parentFolderId],
  };

  const boundary = '-------ICSN_BOUNDARY';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataStr = delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata);
  const mediaStr = delimiter +
    'Content-Type: image/png\r\n\r\n';
  const closeStr = closeDelimiter;

  const encoder = new TextEncoder();
  const parts = [
    encoder.encode(metadataStr),
    encoder.encode(mediaStr),
    new Uint8Array(fileBuffer),
    encoder.encode(closeStr),
  ];
  const totalLength = parts.reduce((acc, p) => acc + p.byteLength, 0);
  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.byteLength;
  }

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Content-Length': String(totalLength),
      },
      body,
    },
  );
  const uploadData = await uploadRes.json();
  if (!uploadData.id) {
    throw new Error(`Failed to upload file to Drive: ${JSON.stringify(uploadData)}`);
  }
  return uploadData.id;
}

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Only admin-originated calls (validated via Supabase anon-key + caller check at API route level)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload: SyncPayload = await req.json();
    const { bookingId, signatureUrl, parentName, parentPhone, childName, sessionDate, sessionLabel } = payload;

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const driveParentFolderId = Deno.env.get('DRIVE_PARENT_FOLDER_ID') || null;

    if (!serviceAccountJson) {
      console.error('[drive-sync] GOOGLE_SERVICE_ACCOUNT_JSON is not set');
      return new Response(JSON.stringify({ error: 'Service account not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Download signature image from Supabase Storage
    const imgRes = await fetch(signatureUrl);
    if (!imgRes.ok) throw new Error(`Failed to download signature: ${imgRes.status}`);
    const fileBuffer = await imgRes.arrayBuffer();

    // 2. Authenticate with Google
    const accessToken = await getGoogleAccessToken(serviceAccountJson);

    // 3. Build folder structure: ParentName (น้องChildName) Phone / ChildName_Date.png
    const isGuest = parentName.startsWith('Walk-in');
    
    let parentFolderName = isGuest ? `Guest_${parentPhone}` : parentName;
    if (!isGuest) {
      const childStr = childName ? ` (น้อง${childName})` : '';
      parentFolderName = `${parentName}${childStr} ${parentPhone || ''}`.trim();
    }
    
    const parentFolderId = await findOrCreateFolder(accessToken, parentFolderName, driveParentFolderId);

    // 4. Upload file with descriptive name
    const safeSession = sessionLabel.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '-');
    const fileName = `ลายเซ็นเข้าเรียน_${sessionDate}_${safeSession}.png`;
    const fileId = await uploadFileToDrive(accessToken, fileName, fileBuffer, parentFolderId);

    console.log(`[drive-sync] ✅ Uploaded ${fileName} (bookingId: ${bookingId}, driveFileId: ${fileId})`);

    return new Response(JSON.stringify({ success: true, fileId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[drive-sync] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
