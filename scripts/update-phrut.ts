import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Searching for user named 'Phrut'...");
  
  const { data, error } = await supabase
    .from('parents')
    .select('id, name, phone, children(nickname, full_name)');

  if (error) {
    console.error("Error fetching user:", error);
    return;
  }

  const phrut = data?.find(p => p.name?.toLowerCase().includes('phrut') || p.children?.some(c => c.nickname?.toLowerCase().includes('phrut') || c.full_name?.toLowerCase().includes('phrut')));

  if (!phrut) {
    console.log("No user found with name containing 'Phrut'.");
    return;
  }

  console.log(`Found:`, phrut);

  const { error: updateError } = await supabase
    .from('parents')
    .update({ name: 'Chonnipa Panyingyok' })
    .eq('id', phrut.id);

  if (updateError) {
    console.error("Failed to update user:", updateError);
  } else {
    console.log("User updated successfully!");
  }
}

main().catch(console.error);
