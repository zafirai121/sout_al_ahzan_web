import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: tables, error: tErr } = await supabase.rpc('get_tables'); // Or just try standard ones
  
  console.log("Checking poems table...");
  const { data: poems, error: pErr } = await supabase.from('poems').select('*').limit(1);
  if (pErr) console.error("Error fetching poems:", pErr);
  else console.log("Poems count:", poems.length, poems[0] ? poems[0].title : '');

  console.log("Checking user_poems table...");
  const { data: up, error: uErr } = await supabase.from('user_poems').select('*').limit(1);
  if (uErr) console.error("Error fetching user_poems:", uErr);
  else console.log("UserPoems count:", up.length);

  console.log("Checking all reciters...");
  const { data: reciters, error: rErr } = await supabase.from('reciters').select('*').limit(1);
  if (rErr) console.error("Error fetching reciters:", rErr);
  else console.log("Reciters count:", reciters.length, reciters[0] ? reciters[0].name : '');
}

check();
