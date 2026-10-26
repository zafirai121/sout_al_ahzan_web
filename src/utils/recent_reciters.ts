"use client";

import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { supabase } from '@/lib/supabase';
import { DbReciter } from '@/types';

/** The reciters of the tracks heard lately, the most recent first, with their pictures (the profile's and the library's) */
export function useRecentReciters(): DbReciter[] {
  const { recentTracks } = usePlayer();
  const ids = [...new Set(recentTracks.map(t => t.reciterId).filter(Boolean).map(String))].slice(0, 12);
  const key = ids.join(',');
  const [reciters, setReciters] = useState<DbReciter[]>([]);
  useEffect(() => {
    if (!key) return setReciters([]);
    let live = true;
    supabase.from('reciters').select('id,name,image_url').in('id', key.split(',')).then(({ data }) => {
      if (!live || !data) return;
      const order = key.split(',');
      setReciters((data as DbReciter[]).filter(r => r.name !== 'مجهول').sort((a, b) => order.indexOf(String(a.id)) - order.indexOf(String(b.id))));
    });
    return () => { live = false; };
  }, [key]);
  return reciters;
}
