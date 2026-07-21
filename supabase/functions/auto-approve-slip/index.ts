import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function successResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
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
  const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')
  if (!WEBHOOK_URL) return
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text: message })
  }).catch(e => console.error("Webhook failed:", e))
}

export function isWithinWindow(start: string, end: string, current: string): boolean {
  if (start < end) {
      return current >= start && current <= end;
  } else {
      // crosses midnight
      return current >= start || current <= end;
  }
}

async function checkEligibility(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data: settingsData } = await supabaseAdmin.from('system_settings').select('key, value');
  const settings: Record<string, string> = {};
  if (settingsData) {
    settingsData.forEach(s => { settings[s.key] = s.value });
  }

  const isEnabled = settings['auto_approve_slip_enabled'] === 'true';
  const startTimeStr = settings['auto_approve_slip_start'] || '17:00';
  const endTimeStr = settings['auto_approve_slip_end'] || '07:00';

  let fullDays: { date: string, is_active: boolean }[] = [];
  if (settings['auto_approve_full_days']) {
    try { fullDays = JSON.parse(settings['auto_approve_full_days']); } catch (e) { /* ignore */ }
  }

  const bkkDateObj = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const bkkDateStr = bkkDateObj.toLocaleDateString('en-CA');
  const bkkTimeStr = bkkDateObj.toLocaleTimeString('en-GB', { hour12: false });
  
  const isFullDayHoliday = fullDays.some(day => day.date === bkkDateStr && day.is_active);

  if (!isEnabled && !isFullDayHoliday) {
    return { eligible: false, reason: 'Auto-approve is disabled' };
  }

  if (!isFullDayHoliday && !isWithinWindow(startTimeStr, endTimeStr, bkkTimeStr)) {
    return { eligible: false, reason: 'Outside auto-approve window' };
  }

  return { eligible: true };
}

async function executeAutoApproval(supabaseAdmin: ReturnType<typeof createClient>, slip: any) {
  // A. Atomic Claim: Update Slip Status ONLY if it is still 'pending'
  const { data: updatedSlip, error: updateErr } = await supabaseAdmin
    .from('slip_uploads')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', slip.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (updateErr || !updatedSlip) {
    throw new Error('Race condition or slip not pending. Aborting auto-approval.');
  }

  try {
    // B. Calculate Credits
    let creditsToAdd = 10; // Default fallback ONLY if no package_id was provided
    if (slip.package_id) {
      const { data: pkgOption, error: pkgOptErr } = await supabaseAdmin.from('package_options').select('credits').eq('name', slip.package_id).maybeSingle();
      if (pkgOptErr) {
        throw new Error(`Database error fetching package option: ${pkgOptErr.message}`);
      }
      if (!pkgOption) {
        // Critical: Do NOT guess credits if the package doesn't exist. Abort so admin can manually review.
        throw new Error(`Package option '${slip.package_id}' not found. Cannot determine credits.`);
      }
      creditsToAdd = pkgOption.credits;
    }

    // C. Create new package
    const { data: newPackage, error: pkgErr } = await supabaseAdmin.from('packages').insert([{
      parent_id: slip.parent_id,
      type: slip.package_id || 'purchase',
      credits_remaining: creditsToAdd,
      non_refundable: slip.non_refundable ?? false
    }]).select('id, credits_remaining').single();
    
    if (pkgErr) throw pkgErr;

    // D. Record Transaction
    const { error: txErr } = await supabaseAdmin.from('credit_transactions').insert([{
      parent_id: slip.parent_id,
      package_id: newPackage.id,
      action_type: 'topup',
      amount: creditsToAdd,
      notes: `auto-approved slip: ${slip.id}`
    }]);

    if (txErr) console.error('Failed to insert credit_transaction (non-fatal):', txErr);

    // E. Send Notification
    const { data: parentInfo } = await supabaseAdmin.from('parents').select('name, children(nickname, full_name)').eq('id', slip.parent_id).single();
    const child = parentInfo?.children?.[0];
    const childName = child ? (child.full_name && child.nickname ? `${child.full_name} (${child.nickname})` : child.full_name || child.nickname || 'ไม่ระบุ') : 'ไม่ระบุ';
    
    const { data: totalCreditsData } = await supabaseAdmin.from('packages').select('credits_remaining').eq('parent_id', slip.parent_id).gt('credits_remaining', 0);
    const totalCredits = (totalCreditsData || []).reduce((acc, curr) => acc + curr.credits_remaining, 0);

    await sendGoogleChat(`🤖 *อนุมัติสลิปอัตโนมัติยามวิกาล!*\n*ผู้ปกครองของ:* ${childName}\n*แพ็กเกจ:* ได้รับ +${creditsToAdd} เครดิต\n⭐ *เครดิตคงเหลือปัจจุบัน:* ${totalCredits} เครดิต`);

    return creditsToAdd;
  } catch (err) {
    // F. Rollback on critical failure (if package insertion fails)
    console.error('Critical failure during auto-approval. Rolling back slip status...', err);
    await supabaseAdmin.from('slip_uploads').update({ status: 'pending', reviewed_at: null }).eq('id', slip.id);
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { slipId } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized: Missing auth header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase environment variables not set');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized: Invalid token');

    const { data: slip, error: slipErr } = await supabaseAdmin.from('slip_uploads').select('*').eq('id', slipId).eq('status', 'pending').single();
    if (slipErr || !slip) throw new Error('Slip not found or not pending');
    if (slip.parent_id !== user.id) throw new Error('Unauthorized: Slip belongs to another user');

    const eligibility = await checkEligibility(supabaseAdmin);
    if (!eligibility.eligible) {
      return successResponse({ success: false, reason: eligibility.reason });
    }

    const creditsAdded = await executeAutoApproval(supabaseAdmin, slip);
    return successResponse({ success: true, autoApproved: true, creditsAdded });

  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error));
  }
});
