

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    if (!supabaseUrl.includes('psusuyesaxuhiondxqie')) {
      console.log('Skipping Google Chat notify: Not in production environment.');
      return new Response(JSON.stringify({ success: true, message: "Skipped: Not in production environment" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const WEBHOOK_URL = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL')

    if (!WEBHOOK_URL) {
      throw new Error('Webhook URL not configured in Edge Function Secrets')
    }

    // Send to Google Chat
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text })
    })

    const resultText = await response.text()

    return new Response(JSON.stringify({ success: response.ok, details: resultText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.ok ? 200 : 400
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
