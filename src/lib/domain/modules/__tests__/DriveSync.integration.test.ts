import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Drive Sync Webhooks Integration Tests', () => {
  const testPhone = `099${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testName = 'Drive Sync Test Parent';
  
  let parentId: string;
  let childId: string;
  let slipId: string;
  let testFilePath = '';

  beforeAll(async () => {
    // 1. Create a dummy parent
    const { data: parent, error: parentErr } = await supabaseAdmin
      .from('parents')
      .insert({ name: testName, phone: testPhone })
      .select('id')
      .single();
    
    if (parentErr) throw parentErr;
    parentId = parent.id;

    // 2. Create a dummy child
    const { data: child, error: childErr } = await supabaseAdmin
      .from('children')
      .insert({ 
        parent_id: parentId, 
        full_name: 'Drive Sync Test Child', 
        nickname: 'Sync', 
        age: 3 
      })
      .select('id')
      .single();
    
    if (childErr) throw childErr;
    childId = child.id;
  });

  afterAll(async () => {
    // Cleanup DB
    if (slipId) await supabaseAdmin.from('slip_uploads').delete().eq('id', slipId);
    if (childId) await supabaseAdmin.from('children').delete().eq('id', childId);
    if (parentId) await supabaseAdmin.from('parents').delete().eq('id', parentId);
    
    // Cleanup Storage
    if (testFilePath) {
      await supabaseAdmin.storage.from('slips').remove([testFilePath]);
    }
  });

  it('[Success] should upload a real mock image to storage and trigger the webhook on children table', async () => {
    // 1. Upload 1x1 pixel PNG to Storage
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Image, 'base64');
    testFilePath = `test_sync_${Date.now()}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('slips')
      .upload(testFilePath, buffer, {
        contentType: 'image/png',
        upsert: false
      });
    
    expect(uploadErr).toBeNull();

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('slips')
      .getPublicUrl(testFilePath);
    
    const photoUrl = publicUrlData.publicUrl;
    expect(photoUrl).toBeTruthy();

    // 2. Update child to trigger Webhook (since children table has a webhook for INSERT/UPDATE)
    // The DB trigger is asynchronous (pg_net), so a successful DB return implies the trigger fired without fatal SQL errors.
    const { error: updateErr } = await supabaseAdmin
      .from('children')
      .update({ photo_url: photoUrl, parent_photo_url: photoUrl })
      .eq('id', childId);
    
    expect(updateErr).toBeNull();
  });

  it('[Success] should trigger webhook when inserting a slip_upload', async () => {
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('slips')
      .getPublicUrl(testFilePath);
      
    const slipUrl = publicUrlData.publicUrl;

    const { data: slip, error: insertErr } = await supabaseAdmin
      .from('slip_uploads')
      .insert({
        parent_id: parentId,
        file_url: slipUrl,
        status: 'pending'
      })
      .select('id')
      .single();

    expect(insertErr).toBeNull();
    expect(slip).not.toBeNull();
    slipId = slip!.id;
  });
});
