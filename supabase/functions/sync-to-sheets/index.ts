import { JWT } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function getGoogleAccessToken(serviceAccountJson: string, scope: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccount.client_email,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const rawKey = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(rawKey), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const jwt = await new JWT(payload).sign(cryptoKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to get Google token: ${await tokenRes.text()}`);
  }
  const data = await tokenRes.json();
  return data.access_token;
}

async function clearSheet(spreadsheetId: string, range: string, token: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error(`Sheet clear failed for ${range}:`, await res.text());
  }
}

async function updateSheetValues(spreadsheetId: string, range: string, values: any[][], token: string) {
  await clearSheet(spreadsheetId, range, token);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) {
    console.error(`Sheet update failed for ${range}:`, await res.text());
  }
}

async function syncAllData() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  const spreadsheetId = Deno.env.get('SPREADSHEET_ID');

  if (!supabaseUrl || !supabaseServiceKey || !serviceAccountJson || !spreadsheetId) {
    console.error('Missing environment variables for sync-to-sheets');
    return { success: false, error: 'Missing environment variables' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = await getGoogleAccessToken(serviceAccountJson, 'https://www.googleapis.com/auth/spreadsheets');

  // 1. Bookings
  const { data: bookings } = await supabase.from('bookings').select('id, session_date, status, created_at, parents(name, phone), children(nickname)').order('created_at', { ascending: false });
  const bookingsValues = [['Booking ID', 'Session Date', 'Status', 'Parent Name', 'Parent Phone', 'Child Nickname', 'Created At']];
  bookings?.forEach((b: any) => {
    bookingsValues.push([
      b.id, b.session_date, b.status, b.parents?.name || '', b.parents?.phone || '', b.children?.nickname || '', b.created_at
    ]);
  });
  await updateSheetValues(spreadsheetId, 'Bookings!A1:Z', bookingsValues, token);

  // 2. Parents
  const { data: parents } = await supabase.from('parents').select('id, name, phone, email, created_at').order('created_at', { ascending: false });
  const parentValues = [['Parent ID', 'Name', 'Phone', 'Email', 'Created At']];
  parents?.forEach((p: any) => {
    parentValues.push([p.id, p.name, p.phone, p.email || '', p.created_at]);
  });
  await updateSheetValues(spreadsheetId, 'Parents!A1:Z', parentValues, token);

  // 3. Children
  const { data: children } = await supabase.from('children').select('id, full_name, nickname, age, food_allergy, special_info, created_at, parents(name)').order('created_at', { ascending: false });
  const childrenValues = [['Child ID', 'Parent Name', 'Full Name', 'Nickname', 'Age', 'Food Allergy', 'Special Info', 'Created At']];
  children?.forEach((c: any) => {
    childrenValues.push([
      c.id, c.parents?.name || '', c.full_name, c.nickname, c.age, c.food_allergy || '', c.special_info || '', c.created_at
    ]);
  });
  await updateSheetValues(spreadsheetId, 'Children!A1:Z', childrenValues, token);

  // 4. Credit Logs
  const { data: logs } = await supabase.from('credit_transactions').select('id, amount, action_type, reason, created_at, parents(name)').order('created_at', { ascending: false });
  const logsValues = [['Log ID', 'Parent Name', 'Amount', 'Action Type', 'Reason', 'Created At']];
  logs?.forEach((l: any) => {
    logsValues.push([
      l.id, l.parents?.name || '', l.amount, l.action_type, l.reason || '', l.created_at
    ]);
  });
  await updateSheetValues(spreadsheetId, 'Credit Logs!A1:Z', logsValues, token);

  console.log('Sheets synced successfully at ' + new Date().toISOString());
  return { success: true };
}

// Register Deno Cron (Executes every 10 minutes)
Deno.cron("Sync to Google Sheets", "*/10 * * * *", async () => {
  await syncAllData();
});

// Provide manual trigger endpoint
Deno.serve(async (req) => {
  if (req.method === 'POST') {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });
    
    const result = await syncAllData();
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
});
