// A picture for the reciters who have no photo yet (their page was made by an
// upload): the cover of their most listened track. Asked for together for the
// cards shown at once, and kept for the visit.
import { supabase } from '@/lib/supabase';

const known = new Map<string, Promise<string>>();
let waiting: { id: string; done: (url: string) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function askFor(list: typeof waiting) {
  const ids = [...new Set(list.map(w => w.id))];
  const found = new Map<string, string>();
  try {
    const { data } = await supabase.from('audio_library').select('reciter_id,image_url')
      .in('reciter_id', ids).not('image_url', 'is', null).neq('image_url', '')
      .order('listen_count', { ascending: false, nullsFirst: false }).limit(1000);
    for (const row of data ?? []) {
      const id = String(row.reciter_id);
      if (!found.has(id)) found.set(id, row.image_url);
    }
  } catch {
    // Cards keep their placeholder
  }
  for (const w of list) w.done(found.get(w.id) ?? '');
}

/** The cover of [reciterId]'s most listened track, '' when none has one. */
export function trackPictureOf(reciterId: string): Promise<string> {
  const had = known.get(reciterId);
  if (had) return had;
  const picture = new Promise<string>(done => waiting.push({ id: reciterId, done }));
  known.set(reciterId, picture);
  if (!timer) {
    timer = setTimeout(() => {
      const list = waiting;
      waiting = [];
      timer = null;
      askFor(list);
    }, 30);
  }
  return picture;
}
