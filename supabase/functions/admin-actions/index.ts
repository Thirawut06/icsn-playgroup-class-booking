
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendGoogleChat(message: string) {
  const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')
  if (!WEBHOOK_URL) return
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text: message })
  }).catch(e => console.error("Webhook failed:", e))
}

function isAdminUser(user: { app_metadata?: { role?: unknown } } | null | undefined) {
  return user?.app_metadata?.role === 'admin'
}

async function resolveCreditsFromSlip(supabase: ReturnType<typeof createClient>, slip: { package_id?: string | null; file_url?: string }) {
  let creditsToAdd = 10
  if (slip.package_id) {
    const { data: byName } = await supabase
      .from('package_options')
      .select('credits, name')
      .eq('name', slip.package_id)
      .maybeSingle()
    if (byName) {
      creditsToAdd = byName.credits
    } else {
      const { data: byId } = await supabase
        .from('package_options')
        .select('credits')
        .eq('id', slip.package_id)
        .maybeSingle()
      if (byId) creditsToAdd = byId.credits
    }
  } else if (slip.file_url && slip.file_url.includes('||credits:')) {
    const parts = slip.file_url.split('||credits:')
    if (parts.length > 1) {
      creditsToAdd = parseInt(parts[1].split('||')[0]) || 10
    }
  }
  return creditsToAdd
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload = {} } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Unauthorized: Missing auth header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not set')
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
       throw new Error('Unauthorized: Invalid token')
    }
    
    if (!isAdminUser(user)) {
       throw new Error('Unauthorized: Admin access required')
    }

    if (action === 'verify-password') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'approve-slip') {
      const { slipId, creditsOverride } = payload as { slipId: string; creditsOverride?: number }

      const { data: slip, error: sErr } = await supabase.from('slip_uploads').select('id, parent_id, package_id, file_url, non_refundable').eq('id', slipId).single()
      if (sErr) throw sErr

      const creditsToAdd = typeof creditsOverride === 'number' && creditsOverride > 0
        ? creditsOverride
        : await resolveCreditsFromSlip(supabase, slip)

      const { error: suErr } = await supabase
        .from('slip_uploads')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', slipId)
      if (suErr) throw suErr

      const packageType = slip.package_id || 'purchase'
      const { data: pkgs } = await supabase
        .from('packages')
        .select('id, credits_remaining')
        .eq('parent_id', slip.parent_id)
        .order('created_at', { ascending: false })
        .limit(1)

      let pkgId: string | null = null
      if (pkgs && pkgs.length > 0) {
        pkgId = pkgs[0].id
        const { error: refundErr } = await supabase
          .from('packages')
          .update({ credits_remaining: pkgs[0].credits_remaining + creditsToAdd })
          .eq('id', pkgs[0].id)
        if (refundErr) throw refundErr
      } else {
        const { data: newPkg, error: insErr } = await supabase
          .from('packages')
          .insert([{ parent_id: slip.parent_id, type: packageType, credits_remaining: creditsToAdd }])
          .select('id')
          .single()
        if (insErr) throw insErr
        pkgId = newPkg.id
      }

      await supabase.from('credit_transactions').insert([{
        parent_id: slip.parent_id,
        package_id: pkgId,
        action_type: 'topup',
        amount: creditsToAdd,
        notes: `slip approved: ${slipId}`
      }])

      const { data: child } = await supabase.from('children').select('nickname').eq('parent_id', slip.parent_id).limit(1).maybeSingle()
      const childNickname = child?.nickname || 'ไม่ระบุ'
      await sendGoogleChat(`💰 ชำระเงินแล้ว: น้อง${childNickname} — approved (+${creditsToAdd} สิทธิ์)`)

      return new Response(JSON.stringify({ success: true, creditsAdded: creditsToAdd, childNickname }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'reject-slip') {
      const { slipId } = payload as { slipId: string }
      const { error } = await supabase
        .from('slip_uploads')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', slipId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'cancel-booking') {
      const { bookingId, cancelReason } = payload as { bookingId: string; cancelReason?: string }

      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_package_id: null,
        p_cancelled_by: 'admin',
        p_cancel_reason: cancelReason || 'Admin cancelled'
      })
      if (error) throw error

      const result = data as { session_date: string; child_nickname: string }
      const dateParts = result.session_date.split('-')
      const displayDate = `${dateParts[2]}/${dateParts[1]}`
      await sendGoogleChat(`❌ แอดมินยกเลิกสิทธิ์ส่งน้อง${result.child_nickname} วันที่ ${displayDate} (สาเหตุ: ${cancelReason || 'ไม่ระบุ'})`)

      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'adjust-credits') {
      const { parentId, amount, reason } = payload as { parentId: string; amount: number; reason: string }
      const { data, error } = await supabase.rpc('adjust_credits', {
        p_parent_id: parentId,
        p_amount: amount,
        p_reason: reason
      })
      if (error) throw error

      return new Response(JSON.stringify({ success: true, creditsRemaining: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'add-package') {
      const { name, price, credits } = payload as { name: string; price: number; credits: number }
      const { data, error } = await supabase
        .from('package_options')
        .insert([{ name, price, credits, is_active: true }])
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ success: true, package: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'toggle-package') {
      const { packageId, isActive } = payload as { packageId: string; isActive: boolean }
      const { error } = await supabase
        .from('package_options')
        .update({ is_active: isActive })
        .eq('id', packageId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'update-session') {
      const { sessionId, totalCapacity, isActive } = payload as {
        sessionId: string
        totalCapacity?: number
        isActive?: boolean
      }
      const updates: Record<string, unknown> = {}
      if (typeof totalCapacity === 'number') updates.total_capacity = totalCapacity
      if (typeof isActive === 'boolean') updates.is_active = isActive

      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()
      if (error) throw error

      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'update-package') {
      const { packageId, name, price, credits } = payload as {
        packageId: string; name: string; price: number; credits: number
      }
      const updates: Record<string, unknown> = {}
      if (name) updates.name = name
      if (typeof price === 'number') updates.price = price
      if (typeof credits === 'number') updates.credits = credits

      const { data, error } = await supabase
        .from('package_options')
        .update(updates)
        .eq('id', packageId)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ success: true, package: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'delete-package') {
      const { packageId } = payload as { packageId: string }
      const { error } = await supabase
        .from('package_options')
        .delete()
        .eq('id', packageId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    throw new Error('Unknown action: ' + action)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
