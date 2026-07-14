// Shared Drive Sync Utilities
// Used by both sync-files-to-drive and backfill-drive

export function resolveFetchUrl(fileUrl: string, supabaseUrl: string): string {
  if (!fileUrl) return fileUrl;
  try {
    if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) {
      const urlObj = new URL(fileUrl);
      const supaObj = new URL(supabaseUrl);
      return `${supaObj.origin}${urlObj.pathname}${urlObj.search}`;
    }
  } catch {
    // ignore
  }
  return fileUrl;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

export async function uploadToGasWebhook(
  blob: Blob,
  fileName: string,
  parentFolderName: string,
  subFolderName: string,
  parentPhone: string,
  fileType: string,
  gasWebhookUrl: string
) {
  const base64Data = await blobToBase64(blob);
  const payload = {
    action: 'sync_file',
    parentFolderName,
    childFolderName: subFolderName,
    parentPhone,
    fileName,
    fileType,
    mimeType: blob.type || 'application/octet-stream',
    base64Data
  };

  const res = await fetch(gasWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`GAS Webhook failed: ${await res.text()}`);

  const data = await res.json();
  if (data.error) throw new Error(`GAS Error: ${data.error}`);
  return data;
}

// deno-lint-ignore no-explicit-any
export async function updateGoogleDriveUrl(supabase: any, parentId: string, url: string) {
  if (!url || !parentId) return;
  const { error } = await supabase.from('parents').update({ google_drive_url: url }).eq('id', parentId);
  if (error) console.error(`Failed to update google_drive_url for parent ${parentId}:`, error.message);
  else console.log(`Saved Google Drive URL for parent ${parentId}`);
}

export function sanitizeForFilename(str: string): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, '_').replace(/[()\/\\:*?"<>|]/g, '').replace(/_+/g, '_');
}

export function getFormattedDateStr(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// deno-lint-ignore no-explicit-any
export async function resolveFolderInfo(table: string, record: Record<string, any>, supabase: any) {
  let folderName = 'Unknown Parent';
  let parentPhone = '';
  let childNickname = '';

  if (record.parent_id) {
    const { data: parent } = await supabase.from('parents').select('name, phone, children(nickname)').eq('id', record.parent_id).single();
    if (parent) {
      parentPhone = parent.phone || '';
      const childNicknames = parent.children?.map((c: { nickname?: string }) => c.nickname).filter(Boolean).join(', ');
      const childStr = childNicknames ? ` (${childNicknames})` : '';
      folderName = `${parent.name}${childStr}`.trim();
    }
  }

  if (table === 'children') {
    const fn = record.full_name ? record.full_name.trim() : '';
    const nn = record.nickname ? record.nickname.trim() : '';
    childNickname = (fn && nn) ? `${fn} (${nn})` : (fn || nn);
  } else if (table === 'bookings' && record.child_id) {
    const { data: child } = await supabase.from('children').select('nickname, full_name').eq('id', record.child_id).single();
    if (child) {
      const fn = child.full_name ? child.full_name.trim() : '';
      const nn = child.nickname ? child.nickname.trim() : '';
      childNickname = (fn && nn) ? `${fn} (${nn})` : (fn || nn);
    }
    if (!childNickname && record.child_name_snapshot) childNickname = record.child_name_snapshot.trim();
  }

  return { folderName, parentPhone, childNickname };
}
