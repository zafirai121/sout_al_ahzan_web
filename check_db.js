const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('audio_library')
    .select('id, title, reciter_name, audioUrl, url, file_url')
    .limit(5);
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
