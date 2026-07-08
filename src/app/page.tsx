import { supabase } from '@/lib/supabase';
import { DbAudioTrack, DbReciter } from '@/types';
import HomeClient from '@/components/HomeClient';

export const revalidate = 3600; // Revalidate at most every hour (ISR)

export default async function Home() {
  // Fetch data on the server
  const [recentRes, popularRes, recitersRes, fridayRes] = await Promise.all([
    supabase.from('audio_library').select('*').order('id', { ascending: false }).limit(30),
    supabase.from('audio_library').select('*').order('listen_count', { ascending: false }).limit(20),
    supabase.from('reciters').select('*').limit(20),
    supabase.from('audio_library').select('*').in('category', ['dua', 'quran', 'أدعية ومناجاة', 'قرآن', 'adhkar']).limit(20)
  ]);

  const poems: DbAudioTrack[] = recentRes.data || [];
  const popularPoems: DbAudioTrack[] = popularRes.data || [];
  const reciters: DbReciter[] = recitersRes.data || [];
  const fridayTracks: DbAudioTrack[] = fridayRes.data || [];

  return (
    <HomeClient 
      poems={poems} 
      popularPoems={popularPoems} 
      reciters={reciters} 
      fridayTracks={fridayTracks} 
    />
  );
}
