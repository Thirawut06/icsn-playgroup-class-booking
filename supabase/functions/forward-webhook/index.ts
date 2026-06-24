import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"

// CORS headers for browser fetch requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // Read the secret Google Apps Script URL from env variables
    const webhookUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_URL')
    
    if (!webhookUrl) {
      throw new Error('Missing GOOGLE_APPS_SCRIPT_URL configuration in Supabase Secrets')
    }

    console.log(`Forwarding payload for type: ${payload.form_type} to Google Apps Script`)

    // Forward the JSON payload to Google Apps Script
    // GAS often prefers text/plain to avoid CORS preflight, but since we are doing it server-to-server, it doesn't matter.
    // However, the original code used text/plain, so we will keep it the same to ensure compatibility.
    const gasResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })

    let resultText = await gasResponse.text()
    console.log("Response from Google Apps Script:", resultText)

    // Handle HTML redirect responses from GAS if any
    let resultJson;
    try {
      resultJson = JSON.parse(resultText)
    } catch (e) {
      // Sometimes Google Apps Script returns HTML if there's an error
      resultJson = { success: false, error: "Invalid response from Google Apps Script", raw: resultText }
    }

    return new Response(
      JSON.stringify(resultJson),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error("Webhook forwarding error:", err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
