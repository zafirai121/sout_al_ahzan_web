"use client";

// Which categories the library has tracks in, asked once in a while (read
// only: one track's id each, as the category's own page asks), kept for this
// tab a few minutes. The tiles and the search box leave an empty category out,
// and show it again by themselves once it has tracks. A category not answered
// (offline, an error) counts as having tracks: nothing is hidden on a guess.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORY_LIST, CATEGORY_VALUES } from '@/utils/categories';

const KEY = 'sout_categories_with_tracks';
const FRESH_MS = 10 * 60 * 1000;

type Presence = Record<string, boolean>;
let asking: Promise<Presence> | null = null;

function kept(): Presence | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (saved && typeof saved.has === 'object' && Date.now() - Number(saved.at) < FRESH_MS) return saved.has as Presence;
  } catch {
    // Unreadable, or no storage: asked again
  }
  return null;
}

async function ask(): Promise<Presence> {
  let complete = true;
  const answers = await Promise.all(CATEGORY_LIST.map(async (c) => {
    const { data, error } = await supabase.from('audio_library').select('id').in('category', CATEGORY_VALUES[c.id] ?? [c.id]).limit(1);
    if (error) complete = false;
    return [c.id, error ? true : (data?.length ?? 0) > 0] as const;
  }));
  const has = Object.fromEntries(answers);
  if (complete) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), has })); } catch { /* not kept */ }
  }
  return has;
}

/** Category id → whether it has tracks; null until known (everything is shown meanwhile). */
export function useCategoriesWithTracks(): Presence | null {
  const [has, setHas] = useState<Presence | null>(null);
  useEffect(() => {
    let live = true;
    const saved = kept();
    const answer = saved ? Promise.resolve(saved) : (asking ??= ask().finally(() => { asking = null; }));
    answer.then((result) => { if (live) setHas(result); }, () => {});
    return () => { live = false; };
  }, []);
  return has;
}
