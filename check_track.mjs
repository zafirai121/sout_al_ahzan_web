const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1/audio_library?id=eq.12139';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

async function check() {
  const res = await fetch(supabaseUrl, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const data = await res.json();
  console.log("Track 12139:", JSON.stringify(data, null, 2));
}

check();
