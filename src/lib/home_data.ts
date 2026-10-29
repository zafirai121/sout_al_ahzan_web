import { supabase } from '@/lib/supabase';
import { DbAudioTrack, DbReciter } from '@/types';

export interface HomeData {
  poems: DbAudioTrack[];
  /** The newest tracks in short, for a card per reciter ("أحدث الإصدارات", see new_releases) */
  latest: DbAudioTrack[];
  popularPoems: DbAudioTrack[];
  reciters: DbReciter[];
  fridayTracks: DbAudioTrack[];
}

// The homepage is a static export, so this runs once at build time (for the
// HTML search engines see) and again in the browser, so visitors get today's
// newest tracks and listen counts rather than the ones from the last deploy.
export async function fetchHomeData(): Promise<HomeData> {
  const [recentRes, latestRes, popularRes, recitersRes, fridayRes] = await Promise.all([
    supabase.from('audio_library').select('*').order('id', { ascending: false }).limit(30),
    // Enough of them for twenty reciters even after a reciter's whole release is uploaded at once
    supabase.from('audio_library').select('id,title,reciter_name,reciter_id,image_url,album').order('id', { ascending: false }).limit(1000),
    supabase.from('audio_library').select('*').order('listen_count', { ascending: false }).limit(20),
    // Reciters with a photo first: the homepage showcases them
    supabase.from('reciters').select('*').not('image_url', 'is', null).neq('image_url', '').order('id').limit(20),
    supabase.from('audio_library').select('*').in('category', ['dua', 'quran', 'أدعية ومناجاة', 'قرآن', 'adhkar']).order('listen_count', { ascending: false, nullsFirst: false }).limit(20),
  ]);

  return {
    poems: recentRes.data || [],
    latest: (latestRes.data as DbAudioTrack[] | null) || [],
    popularPoems: popularRes.data || [],
    reciters: recitersRes.data || [],
    fridayTracks: fridayRes.data || [],
  };
}
