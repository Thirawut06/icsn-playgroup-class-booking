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

    // Verify booking belongs to parent — also fetch session_id and child_id for later use
    const { data: bk, error: bkErr } = await supabase
      .from('bookings')
      .select('parent_id, status, session_date, session_id, child_id')
      .eq('id', bookingId)
      .single()
    if (bkErr) throw bkErr
    if (bk.parent_id !== parentId) throw new Error("Unauthorized to cancel this booking")
    if (bk.status === 'cancelled') throw new Error("Booking is already cancelled")

    // Check cutoff time dynamically from system_settings table (FIX #2: was 'settings')
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'cutoff_hour')
      .maybeSingle()
    
    const cutoffHour = settingsData ? parseInt(settingsData.value, 10) : 7

    const sessionDateStr = bk.session_date // 'YYYY-MM-DD'
    const [year, month, day] = sessionDateStr.split('-').map(Number)
    
    // Create Date for Session at cutoffHour AM (Thailand Time = UTC+7)
    // UTC time for cutoffHour BKK is (cutoffHour - 7) UTC.
    const cutoffDateUTC = new Date(Date.UTC(year, month - 1, day, cutoffHour - 7, 0, 0))
    
    if (Date.now() > cutoffDateUTC.getTime()) {
      const displayTime = `${String(cutoffHour).padStart(2, '0')}:00 น.`
      throw new Error(`หมดเวลายกเลิกคลาสแล้วค่ะ (เลยเวลา ${displayTime} ของวันเรียน) หากมีเหตุจำเป็นต้องลาป่วยกระทันหัน รบกวนทักแจ้งแอดมินนะคะ`)
    }

    // FIX #6: Use cancel_booking RPC for atomic cancellation (handles status update,
    // credit refund, booked_count decrement, and credit_transactions log in one transaction)
    // This eliminates race conditions (#3, #4) and missing audit log (#11)
    const { data: result, error: cancelErr } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_package_id: null,
      p_cancelled_by: 'parent',
      p_cancel_reason: cancelReason || 'Cancelled by parent via web UI'
    })
    if (cancelErr) throw cancelErr



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

