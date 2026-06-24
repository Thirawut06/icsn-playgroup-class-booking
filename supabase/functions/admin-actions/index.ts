import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload, password } = await req.json()
    
    // 1. Verify Admin Password
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'admin123'
    if (password !== ADMIN_PASSWORD) {
      throw new Error('รหัสผ่าน Admin ไม่ถูกต้อง (Invalid Admin Password)')
    }

    // 2. Initialize Supabase Client with Service Role (Bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not set')
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Handle Actions
    if (action === 'verify-password') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'approve-slip') {
      const { slipId } = payload
      
      // Fetch slip to get parent_id and file_url
      const { data: slip, error: sErr } = await supabase.from('slip_uploads').select('*').eq('id', slipId).single()
      if (sErr) throw sErr

      let creditsToAdd = 10
      if (slip.package_id) {
        const { data: pkgOption } = await supabase.from('package_options').select('credits').eq('id', slip.package_id).single()
        if (pkgOption) {
          creditsToAdd = pkgOption.credits
        }
      } else if (slip.file_url && slip.file_url.includes('||credits:')) {
        const parts = slip.file_url.split('||credits:')
        if (parts.length > 1) {
          creditsToAdd = parseInt(parts[1].split('||')[0]) || 10
        }
      }
      
      // Update slip status
      const { error: suErr } = await supabase
        .from('slip_uploads')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', slipId)
      if (suErr) throw suErr

      // Add Credits
      const { data: pkgs } = await supabase.from('packages').select('*').eq('parent_id', slip.parent_id).eq('type', 'purchase')
      if (pkgs && pkgs.length > 0) {
        const { error: refundErr } = await supabase
          .from('packages')
          .update({ credits_remaining: pkgs[0].credits_remaining + creditsToAdd })
          .eq('id', pkgs[0].id)
        if (refundErr) throw refundErr
      } else {
        const { error: insErr } = await supabase
          .from('packages')
          .insert([{ parent_id: slip.parent_id, type: 'purchase', credits_remaining: creditsToAdd }])
        if (insErr) throw insErr
      }

      // Trigger Webhook (using our notify function logic natively)
      const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')
      if (WEBHOOK_URL) {
        const { data: child } = await supabase.from('children').select('nickname').eq('parent_id', slip.parent_id).limit(1).maybeSingle()
        const announceMsg = `💰 ชำระเงินแล้ว: น้อง${child ? child.nickname : 'ไม่ระบุ'} — approved (+${creditsToAdd} สิทธิ์)`
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ text: announceMsg })
        }).catch(e => console.error("Webhook failed:", e))
      }

      return new Response(JSON.stringify({ success: true, creditsAdded: creditsToAdd }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'cancel-booking') {
      const { bookingId, cancelReason } = payload
      
      const { data: bk, error: bkErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
      if (bkErr) throw bkErr

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'admin', cancel_reason: cancelReason })
        .eq('id', bookingId)
      if (updateErr) throw updateErr

      // Refund Credit
      const { data: pkgs } = await supabase.from('packages').select('*').eq('parent_id', bk.parent_id).order('created_at', { ascending: true })
      if (pkgs && pkgs.length > 0) {
        await supabase.from('packages').update({ credits_remaining: pkgs[0].credits_remaining + 1 }).eq('id', pkgs[0].id)
      }

      // Decrement Capacity
      const { data: sess } = await supabase.from('sessions').select('*').eq('session_date', bk.session_date).single()
      if (sess && sess.booked_count > 0) {
        await supabase.from('sessions').update({ booked_count: sess.booked_count - 1 }).eq('id', sess.id)
      }

      return new Response(JSON.stringify({ success: true, sessionDate: bk.session_date }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'add-package') {
      const { name, price, credits } = payload
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
      const { packageId, isActive } = payload
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

    throw new Error('Unknown action: ' + action)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
