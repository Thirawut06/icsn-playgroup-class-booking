import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDateStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    // Force UTC parsing per AGENTS.md timezone rule
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00Z');
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateTimeStr(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    // Use UTC methods for consistency across environments
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
}

function calculateAge(dobStr: string | null): string {
  if (!dobStr) return "";
  try {
    // Force UTC parsing per AGENTS.md timezone rule
    const dob = new Date(dobStr.includes('T') ? dobStr : dobStr + 'T00:00:00Z');
    const today = new Date();
    let years = today.getUTCFullYear() - dob.getUTCFullYear();
    let months = today.getUTCMonth() - dob.getUTCMonth();
    let days = today.getUTCDate() - dob.getUTCDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
      days += previousMonth.getUTCDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} ปี ${months} เดือน ${days} วัน`;
  } catch (e) {
    return "";
  }
}

async function sendToGoogleSheets(webhookUrl: string, payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GAS returned ${response.status}: ${text}`);
  }
  // Parse GAS response to check for application-level errors
  try {
    const result = JSON.parse(text);
    if (result.success === false) {
      throw new Error(`GAS error: ${result.error || 'Unknown'}`);
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      // GAS returned non-JSON (likely HTML redirect), treat as success
      console.warn('GAS returned non-JSON response:', text.substring(0, 200));
    } else {
      throw e;
    }
  }
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

    const payload = await req.json();
    
    const webhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!webhookUrl || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment configuration in Supabase Secrets');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Parents & Children
    const { data: parents } = await supabase.from('parents').select('id, name, phone, email, created_at, google_drive_url, children(full_name, nickname, dob, food_allergy, special_info, media_perm)').order('created_at', { ascending: false });
    const parentsData = [];
    if (parents) {
      for (const parent of parents) {
        if (parent.children && parent.children.length > 0) {
          for (const child of parent.children) {
            parentsData.push([
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
              parent.google_drive_url || ''
            ]);
          }
        } else {
          parentsData.push([
            parent.name,
            parent.phone,
            parent.email,
            '', '', '', '', '', '', '',
            formatDateTimeStr(parent.created_at),
            parent.google_drive_url || ''
          ]);
        }
      }
    }

    // 2. Fetch Credit Transactions (limit to 10000 to avoid pagination issues for now)
    const { data: creditTxs } = await supabase.from('credit_transactions').select('parent_id, action_type, amount, notes, created_at, parent:parents(name)').order('created_at', { ascending: false }).limit(10000);
    const usageData = [];
    if (creditTxs) {
      for (const tx of creditTxs) {
        usageData.push([
          formatDateTimeStr(tx.created_at),
          tx.parent?.name || 'Unknown',
          tx.action_type,
          tx.amount,
          tx.notes || ''
        ]);
      }
    }

    // 3. Fetch Bookings
    const { data: bookings } = await supabase.from('bookings').select('checkin_at, created_at, session:sessions(session_date, time_label), child:children(nickname, full_name, dob, media_perm, food_allergy), parent:parents(name, phone)').order('created_at', { ascending: false });
    const bookingData = [];
    if (bookings) {
      for (const booking of bookings) {
        if (!booking.session || !booking.child || !booking.parent) continue;
        bookingData.push([
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
        ]);
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

      // Pre-fetch all packages
      const { data: allPackages } = await supabase.from('packages').select('parent_id, type, created_at').order('created_at', { ascending: false }).limit(10000);
      const latestPackagesMap: Record<string, string> = {};
      if (allPackages) {
        for (const pkg of allPackages) {
          if (!latestPackagesMap[pkg.parent_id]) {
            latestPackagesMap[pkg.parent_id] = pkg.type;
          }
        }
      }

      for (const parent of parents) {
        const balance = balancesMap[parent.id] || 0;
        const latestPackageType = latestPackagesMap[parent.id] || '';
        
        balanceData.push([
          parent.name,
          parent.phone,
          balance,
          latestPackageType,
          formatDateTimeStr(new Date().toISOString())
        ]);
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

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
