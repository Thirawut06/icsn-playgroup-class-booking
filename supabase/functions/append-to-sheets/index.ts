import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for date formatting
function formatDateStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateTimeStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
}

function calculateAge(dobStr: string | null): string {
  if (!dobStr) return "";
  try {
    const birthDate = new Date(dobStr);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} ปี ${months} เทือน ${days} วัน`;
  } catch (e) {
    return "";
  }
}

async function sendToGoogleSheets(webhookUrl: string, payload: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.text();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    const webhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!webhookUrl || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment configuration in Supabase Secrets');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { form_type, parentId, transactionId } = payload;

    if (!parentId || !transactionId) {
      throw new Error('parentId and transactionId are required');
    }

    // 1. Fetch Parent
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', parentId)
      .single();

    if (parentError || !parent) throw new Error("Parent not found");

    // 2. Fetch Packages & Balance for Update
    const { data: creditBalance } = await supabase.rpc('get_parent_balance', { p_parent_id: parentId });
    const { data: latestPackage } = await supabase.from('packages').select('*').eq('parent_id', parentId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const packageName = latestPackage ? latestPackage.type : '';
    const currentBalance = creditBalance || 0;
    const nowStr = formatDateTimeStr(new Date().toISOString());

    // Routing Logic
    if (form_type === 'trial' || form_type === 'manual') {
      // EVENT: Parent Registration (Trial / Manual)
      const { data: child } = await supabase.from('children').select('*').eq('parent_id', parentId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const folderLookupName = child ? `${parent.name} - ${child.nickname}` : parent.name;
      
      let rowData = [
        parent.name,
        parent.phone,
        parent.email,
        child ? child.full_name : '',
        child ? child.nickname : '',
        child ? formatDateStr(child.dob) : '',
        child ? calculateAge(child.dob) : '',
        child ? (child.food_allergy || '-') : '',
        child ? (child.special_info || '-') : '',
        child ? (child.media_perm ? '✅ อนุญาต' : '❌ ไม่อนุญาต') : '',
        formatDateTimeStr(parent.created_at),
        '' // Placeholder for Google Drive Link
      ];

      await sendToGoogleSheets(webhookUrl, {
        tab_name: '👥 ฐานข้อมูลผู้ใช้',
        action: 'append_row',
        rowData: rowData,
        lookup_phone: parent.phone
      });

    } else if (form_type === 'payment') {
      // EVENT: Package Topup
      const { data: slip } = await supabase.from('slip_uploads').select('*').eq('id', transactionId).single();
      
      const getPackageAmount = (packageId: string) => {
        if (!packageId) return 0;
        if (packageId.includes('1 Course')) return 5;
        if (packageId.includes('2 Courses')) return 10;
        if (packageId.includes('3 Courses')) return 15;
        if (packageId.includes('4 Courses')) return 20;
        if (packageId.includes('trial')) return 1;
        if (packageId.includes('Drop-in')) return 1;
        return 0;
      };
      const amount = slip && slip.status === 'approved' ? getPackageAmount(slip.package_id) : 0;

      // 1. Insert Usage History
      await sendToGoogleSheets(webhookUrl, {
        tab_name: '📝 ประวัติการใช้เครดิต',
        action: 'append_row',
        rowData: [
          formatDateTimeStr(slip ? (slip.reviewed_at || slip.created_at) : new Date().toISOString()),
          parent.name,
          'topup',
          amount,
          slip ? `slip approved: ${slip.id}` : 'slip approved'
        ]
      });

      // 2. Update Remaining Credits
      await sendToGoogleSheets(webhookUrl, {
        tab_name: '💳 เครดิตคงเหลือ',
        action: 'upsert_credit',
        phone: parent.phone,
        rowData: [
          parent.name,
          parent.phone,
          currentBalance,
          packageName,
          nowStr
        ]
      });

    } else if (form_type === 'booking') {
      // EVENT: Class Booking
      const { data: booking } = await supabase.from('bookings').select('*, session:sessions(session_date, time_label), child:children(*)').eq('id', transactionId).single();

      if (booking && booking.session && booking.child) {
        // 1. Insert Attendance History
        await sendToGoogleSheets(webhookUrl, {
          tab_name: '📅 ประวัติการเข้าเรียนทั้งหมด',
          action: 'append_row',
          rowData: [
            formatDateStr(booking.session.session_date),
            booking.session.time_label,
            booking.child.nickname,
            booking.child.full_name,
            calculateAge(booking.child.dob),
            parent.name,
            parent.phone,
            booking.child.media_perm ? '✅ อนุญาต' : '❌ ไม่อนุญาต',
            booking.child.food_allergy || '-',
            booking.checkin_at ? formatDateTimeStr(booking.checkin_at) : 'ยังไม่เช็คชื่อ',
            formatDateTimeStr(booking.created_at)
          ]
        });

        // 2. Insert Usage History
        await sendToGoogleSheets(webhookUrl, {
          tab_name: '📝 ประวัติการใช้เครดิต',
          action: 'append_row',
          rowData: [
            formatDateTimeStr(booking.created_at),
            parent.name,
            'booking',
            -1,
            `Booked session ${booking.session_id}`
          ]
        });

        // 3. Update Remaining Credits
        await sendToGoogleSheets(webhookUrl, {
          tab_name: '💳 เครดิตคงเหลือ',
          action: 'upsert_credit',
          phone: parent.phone,
          rowData: [
            parent.name,
            parent.phone,
            currentBalance,
            packageName,
            nowStr
          ]
        });
      }
    } else if (form_type === 'credit_transaction') {
      const { data: tx } = await supabase.from('credit_transactions').select('*').eq('id', transactionId).single();
      if (tx) {
        await sendToGoogleSheets(webhookUrl, {
          tab_name: '📝 ประวัติการใช้เครดิต',
          action: 'append_row',
          rowData: [
            formatDateTimeStr(tx.created_at),
            parent.name,
            tx.action_type,
            tx.amount,
            tx.notes || ''
          ]
        });
        
        await sendToGoogleSheets(webhookUrl, {
          tab_name: '💳 เครดิตคงเหลือ',
          action: 'upsert_credit',
          phone: parent.phone,
          rowData: [
            parent.name,
            parent.phone,
            currentBalance,
            packageName,
            nowStr
          ]
        });
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
