const { Client } = require('pg');
const DB_URL = "postgresql://postgres.psusuyesaxuhiondxqie:L%7B%3B%26%2B7GSiQnNr3tT@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM public.sessions ORDER BY session_date DESC LIMIT 5`);
    console.table(res.rows);
  } finally {
    await client.end();
  }
}
run();
