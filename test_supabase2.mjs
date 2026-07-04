import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const query = 'باسم ورد';
  const words = query.split(' ').filter(w => w.trim());
  let q = supabase.from('audio_library').select('*');
  words.forEach(word => {
    q = q.or(`title.ilike.%${word}%,reciter_name.ilike.%${word}%`);
  });
  
  const { data, error } = await q.limit(5);
  if (error) console.error(error);
  else {
    console.log('Results:', data.length);
    data.forEach(d => console.log(d.title, '-', d.reciter_name));
  }
}
test();
