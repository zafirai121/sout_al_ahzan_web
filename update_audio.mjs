const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1/audio_library?id=eq.12139';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

async function updateTrack() {
  const res = await fetch(supabaseUrl, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Basim_al-Karbalaei_in_Ahwaz_%2829_June_2025%29.jpg/330px-Basim_al-Karbalaei_in_Ahwaz_%2829_June_2025%29.jpg'
    })
  });
  const data = await res.json();
  console.log("Updated Track:", JSON.stringify(data, null, 2));
}

updateTrack();
