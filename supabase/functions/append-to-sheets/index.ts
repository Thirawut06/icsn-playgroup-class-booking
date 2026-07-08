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

    if (parentError || !parent) throw new Error('Parent not found');

    // 2. Fetch Children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    const childrenList = children || [];
    const childNames = childrenList.map((c: any) => c.full_name).filter(Boolean).join(', ');
    const childNicknames = childrenList.map((c: any) => c.nickname).filter(Boolean).join(', ');
    const childDobs = childrenList.map((c: any) => formatDateStr(c.dob)).filter(Boolean).join(', ');
    const childAllergies = childrenList.map((c: any) => c.food_allergy).filter(Boolean).join(', ');
    const childInfos = childrenList.map((c: any) => c.special_info).filter(Boolean).join(', ');
    
    // We will leave child photo blank in the payload, Drive webhook will late update it using transactionId (which is parent_id for trials)
    // Same for parent photo and slip

    console.log(`Formatting payload for Google Sheets Append: ${transactionId}`);

    // Prepare 36 column row data (0 to 35)
    const rowData = new Array(36).fill("");

    // 1: Timestamp
    let txDate = new Date();
    if (form_type === 'trial') {
      txDate = new Date(parent.created_at || new Date());
    } else if (transactionId) {
      const { data: slip } = await supabase.from('slip_uploads').select('created_at').eq('id', transactionId).single();
      if (slip && slip.created_at) txDate = new Date(slip.created_at);
    }
    rowData[0] = txDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    
    // 2: Status
    rowData[1] = ""; 
    
    // 3: Email
    rowData[2] = parent.email || ""; 
    
    // 4: Path
    rowData[3] = form_type === 'trial' ? "A free trial class / ทดลองเรียนฟรีครั้งแรก" : "Make a Payment / ชำระเงิน";

    const childMediaPerm = childrenList.length > 0 && childrenList[0].media_perm ? "Yes" : "";
    const childNoPhotoPerm = childrenList.length > 0 && childrenList[0].no_photo_perm ? "Yes" : "";

    if (form_type === 'trial') {
      // 5-15: Trial Section (E to P)
      rowData[4] = ""; // Trial Date (leave blank for now)
      rowData[5] = parent.name || "";
      rowData[6] = parent.phone || "";
      rowData[7] = ""; // Parent Photo (Late Update)
      rowData[8] = childNames;
      rowData[9] = childNicknames;
      rowData[10] = childDobs;
      rowData[11] = ""; // Child Photo (Late Update)
      rowData[12] = childAllergies;
      rowData[13] = childInfos;
      rowData[14] = childMediaPerm;
      rowData[15] = childNoPhotoPerm;
    } else if (form_type === 'payment') {
      // 16-25: Payment Section (Q to Z)
      rowData[16] = parent.name || "";
      rowData[17] = parent.phone || "";
      rowData[18] = childNames;
      rowData[19] = childNicknames;
      rowData[20] = childDobs;
      
      let packageType = "";
      if (transactionId) {
        const { data: slip } = await supabase
          .from('slip_uploads')
          .select('*')
          .eq('id', transactionId)
          .single();
        if (slip) {
          packageType = slip.package_id || ""; 
        }
      }
      
      rowData[21] = packageType;
      rowData[22] = ""; // Payment Slip (Late Update - W)
      rowData[23] = ""; // X (เว้นว่างให้บัญชี)
      rowData[24] = ""; // Y (เว้นว่างให้บัญชี)
      rowData[25] = "Yes"; // Z: By checking this box, you agree that this payment is non-refundable.
      rowData[26] = childMediaPerm; // AA: I give permission...
      rowData[27] = childNoPhotoPerm; // AB: I agree not to take pictures...
    }
    
    // 36 (Index 35): Transaction ID for Late Update
    rowData[35] = transactionId;

    // Forward the JSON payload to Google Apps Script
    const gasResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: 'append_row', rowData: rowData })
    });

    const resultText = await gasResponse.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch (e) {
      resultJson = { success: false, error: "Invalid response from Google Apps Script", raw: resultText };
    }

    return new Response(
      JSON.stringify(resultJson),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error("Append to sheets error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
