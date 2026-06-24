const fs = require('fs');

const content = fs.readFileSync('supabase-config.js', 'utf8');
const match = content.match(/const supabaseAnonKey = '([^']+)'/);
if (!match) {
  console.log("No key found");
  process.exit(1);
}
const key = match[1];

fetch('https://psusuyesaxuhiondxqie.supabase.co/auth/v1/signup', {
  method: 'POST',
  headers: {
    'apikey': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'test12345@example.com', password: 'testpassword123' })
})
.then(res => res.text())
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));
