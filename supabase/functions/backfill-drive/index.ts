import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  resolveFetchUrl,
  uploadToGasWebhook,
  updateGoogleDriveUrl,
  sanitizeForFilename,
  getFormattedDateStr,
  resolveFolderInfo,
} from '../_shared/drive-utils.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (supabaseUrl && !supabaseUrl.includes('psusuyesaxuhiondxqie')) {
    return new Response(JSON.stringify({ error: "Skipped: Not in production environment" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
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
    // deno-lint-ignore no-explicit-any
    let records: Record<string, any>[] = [];

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
           
           const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, '', parentPhone, 'slip', gasWebhookUrl);
           if (gasResponse?.url && record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id, gasResponse.url);
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
               
               const safeFullName = sanitizeForFilename(record.full_name);
               const safeNickname = sanitizeForFilename(record.nickname);
               const namePart = [safeFullName, safeNickname].filter(Boolean).join('_') || 'unknown';
               const fileName = `profile_${namePart}.${ext}`;
               
               const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, 'child_photo', gasWebhookUrl);
               if (gasResponse?.url && record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id as string, gasResponse.url);
               syncedPhoto = true;
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
               if (gasResponse?.url && record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id as string, gasResponse.url);
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
              
              const gasResponse = await uploadToGasWebhook(blob, fileName, folderName, childNickname, parentPhone, 'signature', gasWebhookUrl);
              if (gasResponse?.url && record.parent_id) await updateGoogleDriveUrl(supabase, record.parent_id as string, gasResponse.url);
              results.push({ id: record.id, status: 'synced signature' });
              console.log(`Synced signature for booking ${record.id}`);
           } else {
              throw new Error(`Could not fetch signature: ${res.status}`);
           }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed ID ${record.id}: ${errorMsg}`);
        results.push({ id: record.id, status: 'failed', error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ processed: records.length, results }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
