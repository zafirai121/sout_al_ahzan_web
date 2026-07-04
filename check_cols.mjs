import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: item, error } = await supabase.from('audio_library').select('*').limit(1).single();
  if (error) console.error(error);
  else console.log(Object.keys(item));
}
check();
