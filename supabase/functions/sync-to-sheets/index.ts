import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Interfaces ---
interface Parent {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  children?: { nickname: string }[];
}

interface Child {
  full_name?: string;
  nickname?: string;
  dob?: string;
  age?: string;
  food_allergy?: string;
  special_info?: string;
  no_photo_perm?: boolean;
  created_at?: string;
  parents?: Parent;
}

interface Session {
  session_date: string;
  time_label: string;
}

interface Booking {
  status: string;
  created_at: string;
  checkin_at?: string;
  sessions?: Session;
  children?: Child;
  parents?: Parent;
}

interface Package {
  type: string;
  credits_remaining: number;
  created_at: string;
  parents?: Parent;
}

interface Transaction {
  amount: number;
  action_type: string;
  notes?: string;
  created_at: string;
  parents?: Parent;
}

// --- Helpers ---
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

function formatThaiTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
}

// --- Formatters ---
function formatRosterData(rosterRaw: Booking[] | null): string[][] {
  const rosterData: string[][] = [
    ['วันที่เรียน (Date)', 'เวลาเรียน (Time)', 'ชื่อเล่น', 'ชื่อจริง', 'อายุ', 'ชื่อผู้ปกครอง', 'เบอร์ติดต่อ', 'ห้ามถ่ายรูป (No Photo)', 'แพ้อาหาร / หมายเหตุ', 'เวลาที่เช็คชื่อ (Check-in)', 'เวลาที่จอง']
  ];

  if (!rosterRaw) return rosterData;

  rosterRaw.sort((a, b) => {
    const dateA = new Date(a.sessions?.session_date || 0).getTime();
    const dateB = new Date(b.sessions?.session_date || 0).getTime();
    if (dateA !== dateB) return dateB - dateA;
    const timeA = a.sessions?.time_label || '';
    const timeB = b.sessions?.time_label || '';
    return timeB.localeCompare(timeA);
  });

  let lastClassKey: string | null = null;

  rosterRaw.forEach((b) => {
    const dateVal = b.sessions?.session_date || '';
    const timeVal = b.sessions?.time_label || '';
    const currentClassKey = `${dateVal}-${timeVal}`;
    
    if (lastClassKey && lastClassKey !== currentClassKey) {
      rosterData.push(['', '', '', '', '', '', '', '', '', '', '']); // Spacer
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
      b.checkin_at ? formatThaiTime(b.checkin_at) : 'ยังไม่เช็คชื่อ',
      formatThaiTime(b.created_at)
    ]);
  });

  return rosterData;
}

function formatDirectoryData(directoryRaw: Child[] | null): string[][] {
  const directoryData: string[][] = [
    ['ชื่อผู้ปกครอง', 'เบอร์โทรศัพท์', 'อีเมล', 'ชื่อจริงเด็ก', 'ชื่อเล่นเด็ก', 'วันเกิด (DOB)', 'อายุ', 'แพ้อาหาร', 'ข้อควรระวังพิเศษ', 'ห้ามถ่ายรูป (No Photo)', 'วันที่สมัคร', 'Google Drive Link']
  ];

  if (!directoryRaw) return directoryData;

  directoryRaw.forEach((c) => {
    const childNicknames = c.parents?.children?.map((child) => child.nickname).filter(Boolean).join(', ');
    const childStr = childNicknames ? ` (${childNicknames})` : '';
    const folderName = `${c.parents?.name || ''}${childStr}`.trim();
    const driveLink = folderName ? `https://drive.google.com/drive/search?q=type:folder+title:"${encodeURIComponent(folderName)}"` : '';

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
      formatThaiTime(c.created_at),
      driveLink
    ]);
  });

  return directoryData;
}

function formatBalancesData(packagesRaw: Package[] | null): string[][] {
  const balancesData: string[][] = [
    ['ชื่อผู้ปกครอง', 'เบอร์ติดต่อ', 'ยอดเครดิตปัจจุบัน', 'แพ็กเกจล่าสุด', 'อัปเดตข้อมูลล่าสุดเมื่อ']
  ];

  if (!packagesRaw) return balancesData;

  const parentBalances = new Map<string, any>();
  
  packagesRaw.forEach((p) => {
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

  Array.from(parentBalances.values()).forEach((b) => {
    balancesData.push([
      b.name,
      b.phone,
      b.credits,
      b.latest_package,
      formatThaiTime(b.updated_at)
    ]);
  });

  return balancesData;
}

function formatHistoryData(historyRaw: Transaction[] | null): string[][] {
  const historyData: string[][] = [
    ['วัน/เวลา', 'ชื่อผู้ปกครอง', 'ประเภทรายการ', 'จำนวน', 'หมายเหตุ']
  ];

  if (!historyRaw) return historyData;

  historyRaw.forEach((h) => {
    historyData.push([
      formatThaiTime(h.created_at),
      h.parents?.name || '',
      h.action_type || '',
      h.amount.toString(),
      h.notes || ''
    ]);
  });

  return historyData;
}

// --- Main Orchestrator ---
serve(async (req) => {
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

    console.log("Fetching data from Supabase in parallel...");
    const [rosterRes, directoryRes, packagesRes, historyRes] = await Promise.all([
      supabase.from('bookings').select(`status, created_at, checkin_at, sessions!inner ( session_date, time_label ), children ( full_name, nickname, dob, age, food_allergy, special_info, no_photo_perm ), parents ( name, phone )`).eq('status', 'confirmed'),
      supabase.from('children').select(`full_name, nickname, dob, age, food_allergy, special_info, no_photo_perm, created_at, parents ( name, phone, email, children ( nickname ) )`).order('created_at', { ascending: false }),
      supabase.from('packages').select(`type, credits_remaining, created_at, parents ( id, name, phone )`).order('created_at', { ascending: false }),
      supabase.from('credit_transactions').select(`amount, action_type, notes, created_at, parents ( name )`).order('created_at', { ascending: false }).limit(3000)
    ]);

    if (rosterRes.error) console.error("Roster error:", rosterRes.error);
    if (directoryRes.error) console.error("Directory error:", directoryRes.error);
    if (packagesRes.error) console.error("Packages error:", packagesRes.error);
    if (historyRes.error) console.error("History error:", historyRes.error);

    const payload = {
      rosterData: formatRosterData((rosterRes.data as unknown) as Booking[]),
      directoryData: formatDirectoryData((directoryRes.data as unknown) as Child[]),
      balancesData: formatBalancesData((packagesRes.data as unknown) as Package[]),
      historyData: formatHistoryData((historyRes.data as unknown) as Transaction[])
    };

    console.log("Sending data to Google Sheets Webhook...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Sheets API Error: ${await response.text()}`);
      }

      return new Response(JSON.stringify({ success: true, message: "Synced successfully" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError.name === 'AbortError' ? new Error("Google Sheets Webhook Timeout") : fetchError;
    }

  } catch (error: any) {
    console.error("Error in sync-to-sheets:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
