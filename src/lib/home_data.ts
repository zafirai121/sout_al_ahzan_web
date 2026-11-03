import { supabase } from '@/lib/supabase';
import { DbAudioTrack, DbReciter } from '@/types';
import { NewRelease, newReleasesOf } from '@/lib/new_releases';
import { NEWEST_COLUMNS, newestTracks } from '../../cloudflare/new-releases.js';

export interface HomeData {
  poems: DbAudioTrack[];
  popularPoems: DbAudioTrack[];
  reciters: DbReciter[];
  fridayTracks: DbAudioTrack[];
}

// What a track card shows and plays (not its lyrics or file name)
const CARD = 'id,title,reciter_name,reciter_id,file_url,image_url,category,album,duration,listen_count';

// The homepage is a static export, so this runs once at build time (for the
// HTML search engines see) and again in the browser, so visitors get today's
// newest tracks and listen counts rather than the ones from the last deploy.
export async function fetchHomeData(): Promise<HomeData> {
  const [recentRes, popularRes, recitersRes, fridayRes] = await Promise.all([
    supabase.from('audio_library').select(CARD).order('id', { ascending: false }).limit(30),
    supabase.from('audio_library').select(CARD).order('listen_count', { ascending: false }).limit(20),
    // Reciters with a photo first: the homepage showcases them
    supabase.from('reciters').select('id,name,image_url').not('image_url', 'is', null).neq('image_url', '').order('id').limit(20),
    supabase.from('audio_library').select(CARD).in('category', ['dua', 'quran', 'أدعية ومناجاة', 'قرآن', 'adhkar']).order('listen_count', { ascending: false, nullsFirst: false }).limit(20),
  ]);

  return {
    poems: (recentRes.data as DbAudioTrack[] | null) || [],
    popularPoems: (popularRes.data as DbAudioTrack[] | null) || [],
    reciters: (recitersRes.data as DbReciter[] | null) || [],
    fridayTracks: (fridayRes.data as DbAudioTrack[] | null) || [],
  };
}

/**
 * «أحدث الإصدارات»: in the browser, the cards as the server works them out
 * (functions/api/new-releases.js); at build time, worked out here from the
 * newest tracks for the first HTML. [] when neither can be had.
 */
export async function fetchNewReleases(): Promise<NewRelease[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/new-releases');
    const cards = res.ok ? await res.json() : null;
    return Array.isArray(cards) ? cards : [];
  }
  const tracks = await newestTracks(async (offset: number, limit: number) => {
    const { data } = await supabase.from('audio_library').select(NEWEST_COLUMNS)
      .order('id', { ascending: false }).range(offset, offset + limit - 1);
    return data ?? [];
  });
  return newReleasesOf(tracks, 20);
}
