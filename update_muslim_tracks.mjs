const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1/audio_library?reciter_name=eq.مسلم الوائلي';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

async function updateMuslimTracks() {
  // Fetch Muslim Al-Waeli tracks
  const res = await fetch(supabaseUrl, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const tracks = await res.json();
  console.log(`Found ${tracks.length} tracks for Muslim Al-Waeli`);

  for (const track of tracks) {
    if (!track.file_name) continue;
    
    // Replace .mp3 with .jpg
    const imageName = track.file_name.replace('.mp3', '.jpg');
    const encodedImageName = encodeURIComponent(imageName);
    // Assuming bucket path structure
    const imageUrl = `https://soutalahzan.com/Muslim_Al_Waeli/${imageName}`;
    
    // Check if the image exists
    try {
      const imgRes = await fetch(`https://soutalahzan.com/Muslim_Al_Waeli/${encodedImageName}`, { method: 'HEAD' });
      if (imgRes.ok) {
        console.log(`[OK] Found image for track ID ${track.id}: ${imageUrl}`);
        // Update database
        const updateRes = await fetch(`https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1/audio_library?id=eq.${track.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_url: imageUrl })
        });
        if (updateRes.ok) {
          console.log(`   -> Successfully updated DB for track ${track.id}`);
        } else {
          console.error(`   -> Failed to update DB for track ${track.id}`);
        }
      } else {
        console.log(`[MISSING] No image found at ${imageUrl}`);
      }
    } catch (err) {
      console.error(`Error checking image for track ${track.id}:`, err);
    }
  }
}

updateMuslimTracks();
