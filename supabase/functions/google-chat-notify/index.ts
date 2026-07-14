import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendGoogleChat(message: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (!supabaseUrl.includes('psusuyesaxuhiondxqie')) {
    console.log('Skipping Google Chat notify: Not in production environment.');
    return true; // Skip sending, return success
  }

  const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')
  if (!WEBHOOK_URL) {
    console.error('Webhook URL not configured in Edge Function Secrets')
    return false
  }
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text: message })
  })
  
  if (!response.ok) {
    console.error('Failed to send to Google Chat:', await response.text())
    return false
  }
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload
    
    // Create Supabase client for fetching related data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    let message = ''

    // 1 & 2. New Parent & New Child (Triggered when a child is added)
    if (table === 'children' && type === 'INSERT') {
      const { parent_id, nickname, full_name } = record
      const childName = (full_name && nickname) ? `${full_name} (${nickname})` : (full_name || nickname || 'ไม่ระบุ')
      
      // Fetch parent info
      const { data: parent } = await supabase
        .from('parents')
        .select('name, phone, created_at')
        .eq('id', parent_id)
        .single()
        
      if (parent) {
        // Check if parent was created in the last 5 minutes (New Registration)
        const parentCreatedMs = new Date(parent.created_at).getTime()
        const childCreatedMs = new Date(record.created_at || Date.now()).getTime()
        const isNewFamily = Math.abs(childCreatedMs - parentCreatedMs) < 5 * 60 * 1000

        if (isNewFamily) {
          message = `🎉 *มีใบสมัครใหม่เข้าสู่ระบบ!*\n*ชื่อผู้ปกครอง:* ${parent.name}\n*เบอร์โทร:* ${parent.phone || 'ไม่ระบุ'}\n*ชื่อเด็ก:* ${childName}`
        } else {
          message = `👶 *ลูกค้าเดิมเพิ่มข้อมูลเด็กใหม่!*\n*ผู้ปกครอง:* ${parent.name}\n*ชื่อเด็กที่เพิ่ม:* ${childName}`
        }
      }
    }

    // 3. Payment Slip Uploaded
    if (table === 'slip_uploads' && type === 'INSERT') {
      const { parent_id, package_id } = record
      
      const { data: parent } = await supabase.from('parents').select('name').eq('id', parent_id).single()
      const { data: pkg } = await supabase.from('package_options').select('name').eq('id', package_id).single()
      
      const parentName = parent?.name || 'ไม่ระบุ'
      const packageName = pkg?.name || package_id || 'ไม่ระบุ'
      
      message = `💳 *มีการแนบสลิปชำระเงินใหม่! (รอการอนุมัติ)*\n*ผู้ปกครอง:* ${parentName}\n*แพ็กเกจ:* ${packageName}`
    }

    // 5. New Class Booking
    if (table === 'bookings' && type === 'INSERT') {
      if (record.status === 'confirmed') {
        const { session_id, child_id } = record
        
        const { data: session } = await supabase.from('sessions').select('session_date, time_label').eq('id', session_id).single()
        const { data: child } = await supabase.from('children').select('nickname, full_name').eq('id', child_id).single()
        
        const childName = child ? (child.full_name && child.nickname ? `${child.full_name} (${child.nickname})` : child.full_name || child.nickname || 'ไม่ระบุ') : 'ไม่ระบุ'
        let displayDate = 'ไม่ระบุ'
        if (session) {
          const dateParts = session.session_date.split('-')
          const formattedDate = `${dateParts[2]}/${dateParts[1]}`
          displayDate = `วันที่ ${formattedDate} เวลา ${session.time_label}`
        }
        
        message = `📅 *มีการจองคลาสเรียนใหม่!*\n*ชื่อเด็ก:* ${childName}\n*รอบเรียน:* ${displayDate}`
      }
    }

    // 6. Class Cancellation (Triggered by user cancelling)
    if (table === 'bookings' && type === 'UPDATE') {
      if (old_record.status === 'confirmed' && record.status === 'cancelled') {
        if (record.cancelled_by !== 'admin') {
          const { session_id, child_id } = record
          
          const { data: session } = await supabase.from('sessions').select('session_date, time_label').eq('id', session_id).single()
          const { data: child } = await supabase.from('children').select('nickname, full_name').eq('id', child_id).single()
          
          const childName = child ? (child.full_name && child.nickname ? `${child.full_name} (${child.nickname})` : child.full_name || child.nickname || 'ไม่ระบุ') : 'ไม่ระบุ'
          let displayDate = 'ไม่ระบุ'
          if (session) {
            const dateParts = session.session_date.split('-')
            const formattedDate = `${dateParts[2]}/${dateParts[1]}`
            displayDate = `วันที่ ${formattedDate} (${session.time_label})`
          }
          
          message = `🚫 *มีการยกเลิกคลาสเรียน (โดยผู้ปกครอง)*\n*ชื่อเด็ก:* ${childName}\n*รอบเรียน:* ${displayDate}`
        }
      }
    }

    // 7. Parent Name/Phone Changed
    if (table === 'parents' && type === 'UPDATE') {
      if (old_record.name !== record.name || old_record.phone !== record.phone) {
        message = `📝 *มีการแก้ไขข้อมูลบัญชีผู้ใช้งาน*\n*ชื่อ:* ${record.name || 'ไม่ระบุ'} (เดิม: ${old_record.name || 'ไม่ระบุ'})\n*เบอร์โทร:* ${record.phone || 'ไม่ระบุ'} (เดิม: ${old_record.phone || 'ไม่ระบุ'})`
      }
    }

    // 8. Child Name Changed
    if (table === 'children' && type === 'UPDATE') {
      if (old_record.full_name !== record.full_name || old_record.nickname !== record.nickname) {
        const { data: parent } = await supabase.from('parents').select('name, phone').eq('id', record.parent_id).single()
        const parentName = parent?.name || 'ไม่ระบุ'
        const parentPhone = parent?.phone || 'ไม่ระบุ'
        
        const oldName = (old_record.full_name && old_record.nickname) ? `${old_record.full_name} (${old_record.nickname})` : (old_record.full_name || old_record.nickname || 'ไม่ระบุ')
        const newName = (record.full_name && record.nickname) ? `${record.full_name} (${record.nickname})` : (record.full_name || record.nickname || 'ไม่ระบุ')
        
        message = `📝 *มีการแก้ไขชื่อเด็ก*\n*ผู้ปกครอง:* ${parentName} (${parentPhone})\n*ชื่อเดิม:* ${oldName}\n*ชื่อใหม่:* ${newName}`
      }
    }

    if (message) {
      await sendGoogleChat(message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Error in google-chat-notify:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
