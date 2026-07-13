import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const gasWebhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS');

  if (!supabaseUrl || !supabaseServiceKey || !gasWebhookUrl) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = await req.json();
    const { form_type, parentId, transactionId } = payload;

    if (!form_type || !parentId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch parent data
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', parentId)
      .single();
      
    if (parentError || !parent) {
      throw new Error(`Parent not found: ${parentError?.message}`);
    }

    // Fetch child data (latest)
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Initialize 37-column array with empty strings
    const rowData = Array(37).fill('');
    
    // Format timestamp
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-US', { 
      month: 'numeric', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true 
    });

    // Populate common fields
    rowData[0] = formattedTimestamp; // Timestamp
    rowData[1] = ''; // Status
    rowData[2] = parent.email || ''; // Email Address

    if (form_type === 'trial') {
      rowData[3] = 'A free trial class / ทดลองเรียนฟรีครั้งแรก';
      rowData[4] = ''; // Trial date (used to be in form, now usually set in booking)
      rowData[5] = parent.name || ''; // Parent's full name
      rowData[6] = parent.phone || ''; // Parent's telephone number
      rowData[7] = ''; // Individual Parent's Photo (async)
      
      if (child) {
        rowData[8] = child.full_name || '';
        rowData[9] = child.nickname || '';
        rowData[10] = child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString('en-GB') : '';
        rowData[11] = ''; // Individual Child's Photo (async)
        rowData[12] = child.allergy || '-';
        rowData[13] = child.info || '-';
        rowData[14] = child.media_permission ? 'Yes' : 'No';
        rowData[15] = child.no_photo_permission ? 'Yes' : 'No';
      }
      
      rowData[35] = transactionId || parentId; // Column AJ (Transaction ID)

    } else if (form_type === 'payment' || form_type === 'manual') {
      rowData[3] = 'Make a Payment / ชำระเงิน';
      rowData[16] = parent.name || '';
      rowData[17] = parent.phone || '';
      
      if (child) {
        rowData[18] = child.full_name || '';
        rowData[19] = child.nickname || '';
        rowData[20] = child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString('en-GB') : '';
      }

      // Fetch package for payment
      if (transactionId) {
        const { data: pkg } = await supabase
          .from('packages')
          .select('type')
          .eq('id', transactionId)
          .maybeSingle();
          
        if (pkg) {
          if (pkg.type === 'manual_adjustment') {
            console.log('Skipping Google Sheets append for manual_adjustment package');
            return new Response(JSON.stringify({ success: true, message: 'Skipped manual adjustment' }), { 
              status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }
          rowData[21] = pkg.type;
        }
      }

      rowData[22] = ''; // Payment Method (async)
      // rowData[23] = เลขที่ใบเสร็จ (Admin fills this)
      // rowData[24] = จำนวนเงิน (Admin fills this)
      rowData[25] = 'Yes'; // Non-refundable agreement
      
      if (child) {
        rowData[26] = child.media_permission ? 'Yes' : 'No';
        rowData[27] = child.no_photo_permission ? 'Yes' : 'No';
      }
      
      rowData[35] = transactionId || parentId; // Column AJ (Transaction ID)
    }

    // Send payload to Google Apps Script Webhook
    const gasPayload = {
      action: 'append_row',
      rowData: rowData
    };

    const gasResponse = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gasPayload)
    });

    if (!gasResponse.ok) {
      const errorText = await gasResponse.text();
      throw new Error(`Google Apps Script responded with ${gasResponse.status}: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Error appending to sheets:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
