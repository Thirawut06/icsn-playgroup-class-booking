import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, cancelReason, parentId } = await req.json()

    if (!bookingId || !parentId) throw new Error("Missing required fields")

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized: Missing auth header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars missing')
    if (!supabaseAnonKey) throw new Error('Supabase anon key missing')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) throw new Error('Unauthorized: Invalid token')
    if (user.id !== parentId) throw new Error('Unauthorized to cancel this booking')

    // Verify booking belongs to parent
    const { data: bk, error: bkErr } = await supabase.from('bookings').select('parent_id, status, session_date').eq('id', bookingId).single()
    if (bkErr) throw bkErr
    if (bk.parent_id !== parentId) throw new Error("Unauthorized to cancel this booking")
    if (bk.status === 'cancelled') throw new Error("Booking is already cancelled")

    // Check cutoff time dynamically from settings table
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cutoff_hour')
      .maybeSingle()
    
    const cutoffHour = settingsData ? parseInt(settingsData.value, 10) : 7

    const sessionDateStr = bk.session_date // 'YYYY-MM-DD'
    const [year, month, day] = sessionDateStr.split('-').map(Number)
    
    // Create Date for Session at cutoffHour AM (Thailand Time = UTC+7)
    // UTC time for cutoffHour BKK is (cutoffHour - 7) UTC.
    const cutoffDateUTC = new Date(Date.UTC(year, month - 1, day, cutoffHour - 7, 0, 0))
    
    // Add timezone adjustment if we check locally. Let's just compare Date.now() with cutoffDateUTC
    if (Date.now() > cutoffDateUTC.getTime()) {
      const displayTime = `${String(cutoffHour).padStart(2, '0')}:00 น.`
      throw new Error(`หมดเวลายกเลิกคลาสแล้วค่ะ (เลยเวลา ${displayTime} ของวันเรียน) หากมีเหตุจำเป็นต้องลาป่วยกระทันหัน รบกวนทักแจ้งแอดมินนะคะ`)
    }

    // Process Cancellation
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'parent', cancel_reason: cancelReason })
      .eq('id', bookingId)
    if (updateErr) throw updateErr

    // Refund Credit
    const { data: pkgs } = await supabase.from('packages').select('id, credits_remaining').eq('parent_id', parentId).order('created_at', { ascending: true })
    if (pkgs && pkgs.length > 0) {
      await supabase.from('packages').update({ credits_remaining: pkgs[0].credits_remaining + 1 }).eq('id', pkgs[0].id)
    }

    // Decrement Capacity
    const { data: sess } = await supabase.from('sessions').select('id, booked_count').eq('session_date', bk.session_date).single()
    if (sess && sess.booked_count > 0) {
      await supabase.from('sessions').update({ booked_count: sess.booked_count - 1 }).eq('id', sess.id)
    }

    // Trigger Webhook Notification
    const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')
    if (WEBHOOK_URL) {
      const { data: child } = await supabase.from('children').select('nickname').eq('parent_id', parentId).limit(1).maybeSingle()
      const dateParts = bk.session_date.split("-")
      const displayDate = `${dateParts[2]}/${dateParts[1]}`
      const cancelMsg = `❌ ผู้ปกครองกดยกเลิกคลาสน้อง${child ? child.nickname : 'ไม่ระบุ'} วันที่ ${displayDate} (สาเหตุ: ${cancelReason})`
      
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ text: cancelMsg })
      }).catch(e => console.error("Webhook failed:", e))
    }

    return new Response(JSON.stringify({ success: true, refunded: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
