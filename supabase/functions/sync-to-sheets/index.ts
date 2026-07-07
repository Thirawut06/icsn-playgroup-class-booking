import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateExactAge(dobString: string | null | undefined): string {
  if (!dobString) return '';
  const dob = new Date(dobString + 'T00:00:00Z');
  const now = new Date();
  
  let years = now.getUTCFullYear() - dob.getUTCFullYear();
  let months = now.getUTCMonth() - dob.getUTCMonth();
  let days = now.getUTCDate() - dob.getUTCDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 0);
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  let result = [];
  if (years > 0) result.push(`${years} ปี`);
  if (months > 0) result.push(`${months} เดือน`);
  if (days > 0) result.push(`${days} วัน`);
  
  return result.join(' ') || '0 วัน';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');

    if (!supabaseUrl || !supabaseServiceKey || !webhookUrl) {
      throw new Error('Missing environment variables for sync-to-sheets');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 📅 ประวัติการเข้าเรียนทั้งหมด (All Classes Attendance)
    const { data: rosterRaw, error: rosterError } = await supabase
      .from('bookings')
      .select(`
        status,
        created_at,
        sessions!inner ( date, time_label ),
        children ( full_name, nickname, dob, age, food_allergy, special_info, no_photo_perm ),
        parents ( name, phone )
      `)
      .eq('status', 'confirmed');

    if (rosterError) console.error("Roster error:", rosterError);

    rosterRaw?.sort((a: any, b: any) => {
      const dateA = new Date(a.sessions?.date || 0).getTime();
      const dateB = new Date(b.sessions?.date || 0).getTime();
      if (dateA !== dateB) return dateB - dateA; // Descending Date
      const timeA = a.sessions?.time_label || '';
      const timeB = b.sessions?.time_label || '';
      return timeB.localeCompare(timeA); // Descending Time
    });

    const rosterData = [
      ['วันที่เรียน (Date)', 'เวลาเรียน (Time)', 'ชื่อเล่น', 'ชื่อจริง', 'อายุ', 'ชื่อผู้ปกครอง', 'เบอร์ติดต่อ', 'ห้ามถ่ายรูป (No Photo)', 'แพ้อาหาร / หมายเหตุ', 'เวลาที่จอง']
    ];
    
    let lastClassKey: string | null = null;

    rosterRaw?.forEach((b: any) => {
      const dateVal = b.sessions?.date || '';
      const timeVal = b.sessions?.time_label || '';
      const currentClassKey = `${dateVal}-${timeVal}`;
      
      if (lastClassKey && lastClassKey !== currentClassKey) {
        // Add an empty row for visual separation between classes
        rosterData.push(['', '', '', '', '', '', '', '', '', '']);
      }
      lastClassKey = currentClassKey;

      rosterData.push([
        dateVal,
        timeVal,
        b.children?.nickname || '',
        b.children?.full_name || '',
        calculateExactAge(b.children?.dob) || b.children?.age || '',
        b.parents?.name || '',
        b.parents?.phone || '',
        b.children?.no_photo_perm ? '❌ ห้ามถ่าย' : '✅ ถ่ายได้',
        [b.children?.food_allergy, b.children?.special_info].filter(Boolean).join(' | '),
        new Date(b.created_at).toLocaleString('th-TH')
      ]);
    });

    // 2. 👥 ฐานข้อมูลนักเรียน (Master Directory)
    const { data: directoryRaw, error: dirError } = await supabase
      .from('children')
      .select(`
        full_name, nickname, dob, age, food_allergy, special_info, no_photo_perm, created_at,
        parents ( name, phone, email )
      `)
      .order('created_at', { ascending: false });

    if (dirError) console.error("Directory error:", dirError);

    const directoryData = [
      ['ชื่อผู้ปกครอง', 'เบอร์โทรศัพท์', 'อีเมล', 'ชื่อจริงเด็ก', 'ชื่อเล่นเด็ก', 'วันเกิด (DOB)', 'อายุ', 'แพ้อาหาร', 'ข้อควรระวังพิเศษ', 'ห้ามถ่ายรูป (No Photo)', 'วันที่สมัคร']
    ];
    directoryRaw?.forEach((c: any) => {
      directoryData.push([
        c.parents?.name || '',
        c.parents?.phone || '',
        c.parents?.email || '',
        c.full_name || '',
        c.nickname || '',
        c.dob || '',
        calculateExactAge(c.dob) || c.age || '',
        c.food_allergy || '',
        c.special_info || '',
        c.no_photo_perm ? '❌ ห้ามถ่าย' : '✅ ถ่ายได้',
        new Date(c.created_at).toLocaleString('th-TH')
      ]);
    });

    // 3. 💳 เครดิตคงเหลือ (Credit Balances)
    const { data: packagesRaw, error: pkgError } = await supabase
      .from('packages')
      .select(`
        type, credits_remaining, created_at,
        parents ( id, name, phone )
      `)
      .order('created_at', { ascending: false });

    if (pkgError) console.error("Packages error:", pkgError);

    const parentBalances = new Map();
    packagesRaw?.forEach((p: any) => {
      const parentId = p.parents?.id;
      if (!parentId) return;
      if (!parentBalances.has(parentId)) {
        parentBalances.set(parentId, {
          name: p.parents?.name || '',
          phone: p.parents?.phone || '',
          credits: p.credits_remaining,
          latest_package: p.type,
          updated_at: p.created_at
        });
      } else {
        const existing = parentBalances.get(parentId);
        existing.credits += p.credits_remaining;
      }
    });

    const balancesData = [
      ['ชื่อผู้ปกครอง', 'เบอร์ติดต่อ', 'ยอดเครดิตปัจจุบัน', 'แพ็กเกจล่าสุด', 'อัปเดตข้อมูลล่าสุดเมื่อ']
    ];
    Array.from(parentBalances.values()).forEach((b: any) => {
      balancesData.push([
        b.name,
        b.phone,
        b.credits,
        b.latest_package,
        new Date(b.updated_at).toLocaleString('th-TH')
      ]);
    });

    // 4. 📝 ประวัติการใช้เครดิต (Transaction History)
    const { data: historyRaw, error: histError } = await supabase
      .from('credit_transactions')
      .select(`
        amount, action_type, notes, created_at,
        parents ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(3000);

    if (histError) console.error("History error:", histError);

    const historyData = [
      ['วัน/เวลา', 'ชื่อผู้ปกครอง', 'ประเภทรายการ', 'จำนวน', 'หมายเหตุ']
    ];
    historyRaw?.forEach((h: any) => {
      historyData.push([
        new Date(h.created_at).toLocaleString('th-TH'),
        h.parents?.name || '',
        h.action_type || '',
        h.amount,
        h.notes || ''
      ]);
    });

    const payload = {
      rosterData,
      directoryData,
      balancesData,
      historyData
    };

    console.log("Sending data to Google Sheets Webhook...");
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to push to Google Sheets:", errorText);
      throw new Error(`Google Sheets API Error: ${errorText}`);
    }

    const responseJson = await response.json();
    console.log("Google Sheets response:", responseJson);

    return new Response(JSON.stringify({ success: true, message: "Synced successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in sync-to-sheets:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
