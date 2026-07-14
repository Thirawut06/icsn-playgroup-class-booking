import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDateStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatDateTimeStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function calculateAge(dobStr: string | null): string {
  if (!dobStr) return "";
  try {
    const dob = new Date(dobStr);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += previousMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} ปี ${months} เดือน ${days} วัน`;
  } catch {
    return "";
  }
}

async function sendToGoogleSheets(webhookUrl: string, payload: Record<string, unknown>) {
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
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    if (expectedSecret && req.headers.get('x-webhook-secret') !== expectedSecret) {
      return new Response('Unauthorized', { status: 401 });
    }

    await req.json(); // consume request body
    
    const webhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (supabaseUrl && !supabaseUrl.includes('psusuyesaxuhiondxqie')) {
      console.log('Skipping sync: Not in production environment.');
      return new Response(JSON.stringify({ status: "success", message: "Skipped: Not in production environment" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!webhookUrl || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment configuration in Supabase Secrets');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pre-fetch all packages to filter active parents
    const { data: allPackages } = await supabase.from('packages').select('*').order('created_at', { ascending: false }).limit(10000);
    const latestPackagesMap: Record<string, string> = {};
    if (allPackages) {
      for (const pkg of allPackages) {
        if (!latestPackagesMap[pkg.parent_id]) {
          latestPackagesMap[pkg.parent_id] = pkg.type;
        }
      }
    }
    const activeParentIds = new Set(Object.keys(latestPackagesMap));

    // 1. Fetch Parents & Children
    const { data: parents } = await supabase.from('parents').select('*, children(*)').order('created_at', { ascending: false });
    const parentsData = [];
    if (parents) {
      for (const parent of parents) {
        // Skip REGISTERED parents (no packages)
        if (!activeParentIds.has(parent.id)) continue;

        if (parent.children && parent.children.length > 0) {
          for (const child of parent.children) {
            parentsData.push({
              id: `${parent.id}_${child.id}`,
              values: [
                parent.name,
                parent.phone,
                parent.email,
                child.full_name,
                child.nickname,
                formatDateStr(child.dob),
                calculateAge(child.dob),
                child.food_allergy || '-',
                child.special_info || '-',
                child.media_perm ? '✅ อนุญาต' : '❌ ไม่อนุญาต',
                formatDateTimeStr(parent.created_at),
                parent.google_drive_url ? `=HYPERLINK("${parent.google_drive_url}", "📁 เปิดโฟลเดอร์")` : ''
              ]
            });
          }
        } else {
          parentsData.push({
            id: parent.id,
            values: [
              parent.name,
              parent.phone,
              parent.email,
              '', '', '', '', '', '', '',
              formatDateTimeStr(parent.created_at),
              parent.google_drive_url ? `=HYPERLINK("${parent.google_drive_url}", "📁 เปิดโฟลเดอร์")` : ''
            ]
          });
        }
      }
    }

    // 2. Fetch Credit Transactions (limit to 10000 to avoid pagination issues for now)
    const { data: creditTxs } = await supabase.from('credit_transactions').select('*, parent:parents(*)').order('created_at', { ascending: false }).limit(10000);
    const usageData = [];
    if (creditTxs) {
      for (const tx of creditTxs) {
        usageData.push({
          id: tx.id,
          values: [
            formatDateTimeStr(tx.created_at),
            tx.parent?.name || 'Unknown',
            tx.action_type,
            tx.amount,
            tx.notes || ''
          ]
        });
      }
    }

    // 3. Fetch Bookings
    const { data: bookings } = await supabase.from('bookings').select('*, session:sessions(session_date, time_label), child:children(*), parent:parents(*)').order('created_at', { ascending: false }).limit(10000);
    const bookingData = [];
    if (bookings) {
      for (const booking of bookings) {
        if (!booking.session || !booking.child || !booking.parent) continue;
        bookingData.push({
          id: booking.id,
          values: [
            formatDateStr(booking.session.session_date),
            booking.session.time_label,
            booking.child.nickname,
            booking.child.full_name,
            calculateAge(booking.child.dob),
            booking.parent.name,
            booking.parent.phone,
            booking.child.media_perm ? '✅ อนุญาต' : '❌ ไม่อนุญาต',
            booking.child.food_allergy || '-',
            booking.checkin_at ? formatDateTimeStr(booking.checkin_at) : 'ยังไม่เช็คชื่อ',
            formatDateTimeStr(booking.created_at)
          ]
        });
      }
    }

    // 4. Fetch Balances (Optimized: O(1) queries instead of N+1)
    const balanceData = [];
    if (parents) {
      // Calculate balances in memory
      const balancesMap: Record<string, number> = {};
      if (creditTxs) {
        for (const tx of creditTxs) {
          if (!balancesMap[tx.parent_id]) balancesMap[tx.parent_id] = 0;
          balancesMap[tx.parent_id] += tx.amount;
        }
      }

      for (const parent of parents) {
        // Skip REGISTERED parents (no packages)
        if (!activeParentIds.has(parent.id)) continue;

        const balance = balancesMap[parent.id] || 0;
        const latestPackageType = latestPackagesMap[parent.id] || '';
        
        balanceData.push({
          id: parent.id,
          values: [
            parent.name,
            parent.phone,
            balance,
            latestPackageType,
            formatDateTimeStr(new Date().toISOString())
          ]
        });
      }
    }

    // Send the massive snapshot payload to GAS
    await sendToGoogleSheets(webhookUrl, {
      action: 'snapshot_sync',
      parentsData,
      usageData,
      bookingData,
      balanceData
    });

    return new Response(JSON.stringify({ status: "success" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ status: "error", message: errorMsg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
