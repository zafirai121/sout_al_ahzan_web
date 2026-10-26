"use client";

// The homepage's lower sections. Each asks the database for its tracks only
// when the visitor scrolls near it, so the top of the page comes first.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pause, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { CATEGORY_VALUES } from '@/utils/categories';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { countOf, TRACKS } from '@/utils/plural';
import { DbAudioTrack, DbReciter, Track } from '@/types';
import { QuickTracks, ReciterCard, Shelf, TrackCard } from './HomeParts';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,duration,listen_count';
const byListens = { ascending: false, nullsFirst: false } as const;

/** True once the element is within a screen's height of being seen. */
function useNear<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    // The page scrolls inside .main-content, not the window
    const root = el.closest('.main-content');
    const seen = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setNear(true);
    }, { root, rootMargin: '0px 0px 900px 0px' });
    seen.observe(el);
    return () => seen.disconnect();
  }, [near]);
  return [ref, near] as const;
}

/** Waits to be near, then fetches; renders nothing until there is something. */
function Lazy<D>({ load, children }: { load: () => Promise<D | null>; children: (data: D) => React.ReactNode }) {
  const [ref, near] = useNear<HTMLDivElement>();
  const [data, setData] = useState<D | null>(null);
  useEffect(() => {
    if (!near) return;
    let live = true;
    load().then(d => { if (live) setData(d); }).catch(e => console.warn('home section:', e));
    return () => { live = false; };
    // `load` is a fresh function each render; what it fetches does not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near]);
  return <div ref={ref} className="home-lazy">{data ? children(data) : null}</div>;
}

const inCategories = (...codes: string[]) => codes.flatMap(c => CATEGORY_VALUES[c] ?? [c]);

/** A shelf of a category's most listened tracks. */
export function CategoryShelf({ title, subtitle, href, codes }: { title: string; subtitle?: string; href: string; codes: string[] }) {
  return (
    <Lazy load={async () => {
      const { data } = await supabase.from('audio_library').select(COLUMNS)
        .in('category', inCategories(...codes))
        .order('listen_count', byListens).order('id', { ascending: false }).limit(20);
      return data && data.length >= 4 ? (data as DbAudioTrack[]) : null;
    }}>
      {tracks => (
        <Shelf title={title} subtitle={subtitle} href={href}>
          {tracks.map(t => <TrackCard key={t.id} item={t} />)}
        </Shelf>
      )}
    </Lazy>
  );
}

/** Reciters who joined most recently. */
export function NewReciters() {
  return (
    <Lazy load={async () => {
      const { data } = await supabase.from('reciters').select('id,name,image_url,created_at')
        .not('image_url', 'is', null).neq('image_url', '')
        .order('created_at', { ascending: false }).limit(12);
      return data && data.length >= 3 ? (data as DbReciter[]) : null;
    }}>
      {reciters => (
        <Shelf title="انضموا حديثاً" subtitle="رواديد أُضيفوا إلى المنصة مؤخراً" href="/search">
          {reciters.map(r => <ReciterCard key={r.id} item={r} />)}
        </Shelf>
      )}
    </Lazy>
  );
}

// ---------- The reciter of the day ----------

type Spotlight = { reciter: DbReciter; tracks: Track[]; total: number };

const DAY_MS = 86_400_000;

/** A different reciter each day, the same for everyone that day. */
export function ReciterOfTheDay() {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  return (
    <Lazy<Spotlight> load={async () => {
      const { data } = await supabase.from('reciters').select('id,name,image_url')
        .not('image_url', 'is', null).neq('image_url', '').neq('name', 'مجهول').order('id');
      const reciters = (data ?? []) as DbReciter[];
      if (!reciters.length) return null;
      // Days since 1970 in the visitor's time zone
      const now = new Date();
      const dayNumber = Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / DAY_MS);
      // The day's reciter, or the next one with enough tracks to show: many
      // have only a few, so ten are counted at once (counts only, no rows)
      const candidates = Array.from({ length: Math.min(10, reciters.length) }, (_, i) => reciters[(dayNumber + i) % reciters.length]);
      const counts = await Promise.all(candidates.map(r =>
        supabase.from('audio_library').select('id', { count: 'exact', head: true }).eq('reciter_id', r.id).then(({ count }) => count ?? 0)));
      const at = counts.findIndex(n => n >= 6);
      if (at < 0) return null;
      const reciter = candidates[at];
      const { data: rows } = await supabase.from('audio_library').select(COLUMNS)
        .eq('reciter_id', reciter.id).order('listen_count', byListens).order('id', { ascending: false }).limit(20);
      const tracks = (rows ?? []).map(getTrackData).filter(t => t.audioUrl);
      return tracks.length >= 5 ? { reciter, tracks, total: counts[at] } : null;
    }}>
      {({ reciter, tracks, total }) => {
        const playingHere = isPlaying && tracks.some(t => t.id == currentTrack?.id);
        return (
          <section className="home-shelf" aria-labelledby="home-spotlight">
            <header className="home-shelf-header">
              <div>
                <h2 id="home-spotlight">رادود اليوم</h2>
                <p className="home-shelf-subtitle">يتغيّر كل يوم بين رواديد المنصة</p>
              </div>
            </header>
            <div className="hero-frame">
            <div className="home-spotlight">
              <div className="home-spotlight-who">
                <img src={thumb(reciter.image_url, 320)} alt="" width={140} height={140} loading="lazy" decoding="async" />
                <div className="home-spotlight-text">
                  <Link href={`/reciter?id=${reciter.id}`} prefetch={false} className="home-spotlight-name">{reciter.name}</Link>
                  <span className="home-spotlight-count">{countOf(total, TRACKS)}</span>
                  <div className="home-spotlight-actions">
                    <button type="button" className="btn-gold" onClick={() => (playingHere ? togglePlayPause() : playQueue(tracks, 0))}>
                      {playingHere ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
                      {playingHere ? 'إيقاف' : 'استمع إليه'}
                    </button>
                    <Link href={`/reciter?id=${reciter.id}`} prefetch={false} className="btn-outline">كل مقاطعه</Link>
                  </div>
                </div>
              </div>
              <QuickTracks tracks={tracks.slice(0, 5)} queue={tracks} label={`أشهر مقاطع ${reciter.name}`} />
            </div>
            </div>
          </section>
        );
      }}
    </Lazy>
  );
}
