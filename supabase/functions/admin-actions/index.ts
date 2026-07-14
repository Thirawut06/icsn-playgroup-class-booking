import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function successResponse(data: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

async function sendGoogleChat(message: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (!supabaseUrl.includes('psusuyesaxuhiondxqie')) {
    console.log('Skipping Google Chat notify: Not in production environment.');
    return;
  }
  const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL');
  if (!WEBHOOK_URL) return;
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text: message })
  }).catch(e => console.error("Webhook failed:", e));
}

function isAdminUser(user: { app_metadata?: { role?: unknown } } | null | undefined) {
  return user?.app_metadata?.role === 'admin';
}

async function resolveCreditsFromSlip(supabase: ReturnType<typeof createClient>, slip: { package_id?: string | null; file_url?: string }) {
  let creditsToAdd = 10;
  if (slip.package_id) {
    const { data: byName } = await supabase.from('package_options').select('credits, name').eq('name', slip.package_id).maybeSingle();
    if (byName) return byName.credits;
    
    const { data: byId } = await supabase.from('package_options').select('credits').eq('id', slip.package_id).maybeSingle();
    if (byId) return byId.credits;
  } else if (slip.file_url?.includes('||credits:')) {
    const parts = slip.file_url.split('||credits:');
    if (parts.length > 1) {
      return parseInt(parts[1].split('||')[0]) || 10;
    }
  }
  return creditsToAdd;
}

async function getRemainingCredits(supabase: ReturnType<typeof createClient>, parentId: string) {
  const { data } = await supabase.from('packages').select('credits_remaining').eq('parent_id', parentId).maybeSingle();
  return data?.credits_remaining || 0;
}

async function getFamilyDetails(supabase: ReturnType<typeof createClient>, parentId: string) {
  const { data } = await supabase.from('parents').select('name, children(nickname, full_name)').eq('id', parentId).single();
  const child = data?.children?.[0];
  const childName = child ? (child.full_name && child.nickname ? `${child.full_name} (${child.nickname})` : child.full_name || child.nickname || 'ไม่ระบุ') : 'ไม่ระบุ';
  return { parentName: data?.name || 'ไม่ระบุ', childName };
}

// --- Action Handlers ---

async function handleVerifyPassword() {
  return successResponse();
}

async function handleApproveSlip(payload: any, supabase: ReturnType<typeof createClient>, userClient: ReturnType<typeof createClient>) {
  const { slipId, creditsOverride } = payload;
  const { data: slip, error: sErr } = await supabase.from('slip_uploads').select('id, parent_id, package_id, file_url, non_refundable').eq('id', slipId).single();
  if (sErr) throw sErr;

  const creditsToAdd = typeof creditsOverride === 'number' && creditsOverride > 0 ? creditsOverride : await resolveCreditsFromSlip(supabase, slip);

  const { data: result, error: rpcErr } = await userClient.rpc('approve_slip', { p_slip_id: slipId, p_credits_to_add: creditsToAdd, p_notes: `slip approved: ${slipId}` });
  if (rpcErr) throw rpcErr;

  const { child_nickname } = result as any;
  const creditsRemaining = await getRemainingCredits(supabase, slip.parent_id);
  const family = await getFamilyDetails(supabase, slip.parent_id);
  
  await sendGoogleChat(`✅ *อนุมัติสลิปชำระเงินแล้ว!*\n*ผู้ปกครองของ:* ${family.childName}\n*แพ็กเกจ:* ได้รับ +${creditsToAdd} เครดิต\n⭐ *เครดิตคงเหลือปัจจุบัน:* ${creditsRemaining} เครดิต`);
  return successResponse({ creditsAdded: creditsToAdd, childNickname: child_nickname });
}

async function handleRejectSlip(payload: any, supabase: ReturnType<typeof createClient>) {
  const { slipId } = payload;
  const { data: slip, error: sErr } = await supabase.from('slip_uploads').select('parent_id').eq('id', slipId).single();
  if (sErr) throw sErr;

  const { error } = await supabase.from('slip_uploads').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', slipId);
  if (error) throw error;

  const family = await getFamilyDetails(supabase, slip.parent_id);
  const creditsRemaining = await getRemainingCredits(supabase, slip.parent_id);
  await sendGoogleChat(`❌ *ปฏิเสธสลิปชำระเงิน!*\n*ผู้ปกครอง:* ${family.parentName} (${family.childName})\n⭐ *เครดิตคงเหลือปัจจุบัน:* ${creditsRemaining} เครดิต`);
  return successResponse();
}

async function handleCancelBooking(payload: any, supabase: ReturnType<typeof createClient>, userClient: ReturnType<typeof createClient>) {
  const { bookingId, cancelReason } = payload;
  const { data, error } = await userClient.rpc('cancel_booking', {
    p_booking_id: bookingId, p_package_id: null, p_cancelled_by: 'admin', p_cancel_reason: cancelReason || 'Admin cancelled'
  });
  if (error) throw error;

  const result = data as any;
  const dateParts = result.session_date.split('-');
  const displayDate = `${dateParts[2]}/${dateParts[1]}`;
  
  let childName = result.child_nickname;
  // Fallback resolving
  const { data: bk } = await supabase.from('bookings').select('child_id').eq('id', bookingId).single();
  if (bk) {
    const { data: child } = await supabase.from('children').select('full_name, nickname').eq('id', bk.child_id).single();
    if (child) childName = (child.full_name && child.nickname) ? `${child.full_name} (${child.nickname})` : (child.full_name || child.nickname || 'ไม่ระบุ');
  }

  await sendGoogleChat(`🚫 *มีการยกเลิกคลาสเรียน (โดยแอดมิน)*\n*ชื่อเด็ก:* ${childName}\n*รอบเรียน:* วันที่ ${displayDate}\n*สาเหตุ:* ${cancelReason || 'ไม่ระบุ'}`);
  return successResponse(result);
}

async function handleAdjustCredits(payload: any, supabase: ReturnType<typeof createClient>, userClient: ReturnType<typeof createClient>) {
  const { parentId, amount, reason } = payload;
  const { data, error } = await userClient.rpc('adjust_credits', { p_parent_id: parentId, p_amount: amount, p_reason: reason });
  if (error) throw error;
  
  const family = await getFamilyDetails(supabase, parentId);
  const sign = amount >= 0 ? '+' : '';
  await sendGoogleChat(`💰 *แอดมินปรับยอดเครดิต (Manual)*\n*ผู้ปกครองของ:* ${family.childName}\n*จำนวน:* ${sign}${amount} เครดิต\n*เหตุผล:* ${reason || 'ไม่ระบุ'}\n⭐ *เครดิตคงเหลือปัจจุบัน:* ${data} เครดิต`);

  return successResponse({ creditsRemaining: data });
}

async function handleAddPackage(payload: any, supabase: ReturnType<typeof createClient>) {
  const { name, price, credits } = payload;
  const { data, error } = await supabase.from('package_options').insert([{ name, price, credits, is_active: true }]).select().single();
  if (error) throw error;
  return successResponse({ package: data });
}

async function handleTogglePackage(payload: any, supabase: ReturnType<typeof createClient>) {
  const { packageId, isActive } = payload;
  const { error } = await supabase.from('package_options').update({ is_active: isActive }).eq('id', packageId);
  if (error) throw error;
  return successResponse();
}

async function handleUpdateSession(payload: any, supabase: ReturnType<typeof createClient>) {
  const { sessionId, totalCapacity, trialCapacity, isActive } = payload;
  const updates: Record<string, unknown> = {};
  if (typeof totalCapacity === 'number') updates.total_capacity = totalCapacity;
  if (typeof trialCapacity === 'number') updates.trial_capacity = trialCapacity;
  if (typeof isActive === 'boolean') updates.is_active = isActive;

  const { data, error } = await supabase.from('sessions').update(updates).eq('id', sessionId).select().single();
  if (error) throw error;
  return successResponse({ session: data });
}

async function handleUpdatePackage(payload: any, supabase: ReturnType<typeof createClient>) {
  const { packageId, name, price, credits } = payload;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (typeof price === 'number') updates.price = price;
  if (typeof credits === 'number') updates.credits = credits;

  const { data, error } = await supabase.from('package_options').update(updates).eq('id', packageId).select().single();
  if (error) throw error;
  return successResponse({ package: data });
}

async function handleDeletePackage(payload: any, supabase: ReturnType<typeof createClient>) {
  const { packageId } = payload;
  const { error } = await supabase.from('package_options').delete().eq('id', packageId);
  if (error) throw error;
  return successResponse();
}

// --- Main Router ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, payload = {} } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized: Missing auth header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase environment variables not set');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized: Invalid token');
    if (!isAdminUser(user)) throw new Error('Unauthorized: Admin access required');

    switch (action) {
      case 'verify-password': return await handleVerifyPassword();
      case 'approve-slip': return await handleApproveSlip(payload, supabase, userClient);
      case 'reject-slip': return await handleRejectSlip(payload, supabase);
      case 'cancel-booking': return await handleCancelBooking(payload, supabase, userClient);
      case 'adjust-credits': return await handleAdjustCredits(payload, supabase, userClient);
      case 'add-package': return await handleAddPackage(payload, supabase);
      case 'toggle-package': return await handleTogglePackage(payload, supabase);
      case 'update-session': return await handleUpdateSession(payload, supabase);
      case 'update-package': return await handleUpdatePackage(payload, supabase);
      case 'delete-package': return await handleDeletePackage(payload, supabase);
      default: throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error));
  }
});
