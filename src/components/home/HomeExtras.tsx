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

// ---------- Tall cards: more from a reciter, mixes, stations ----------

export type Seed = { id: string; name: string };

/** "X" / "X وY" / "X وY وZ" */
const andJoin = (names: string[]) => names.join(' و');

/** A reciter's best known tracks that can be played. */
async function bestOf(reciterId: string, limit: number): Promise<Track[]> {
  const { data } = await supabase.from('audio_library').select(COLUMNS)
    .eq('reciter_id', reciterId).order('listen_count', byListens).order('id', { ascending: false }).limit(limit);
  return (data ?? []).map(getTrackData).filter(t => t.audioUrl);
}

/** The reciters' photos, by id. */
async function photosOf(ids: string[]): Promise<Map<string, string>> {
  const { data } = await supabase.from('reciters').select('id,image_url').in('id', ids);
  return new Map((data ?? []).filter(r => r.image_url).map(r => [String(r.id), r.image_url as string]));
}

/** The seed's tracks with one of the guests' after every three, the guests taking turns. */
function blend(own: Track[], guests: Track[][]): Track[] {
  const pool: Track[] = [];
  const most = Math.max(0, ...guests.map(g => g.length));
  for (let k = 0; k < most; k++) for (const g of guests) if (g[k]) pool.push(g[k]);
  const out: Track[] = [];
  own.forEach((t, k) => {
    out.push(t);
    if (k % 3 === 2 && pool.length) out.push(pool.shift()!);
  });
  return out;
}

/** The other reciters a list brings in (ids come as numbers from the database, as text in the seeds). */
const guestNames = (tracks: Track[], seed: Seed) =>
  [...new Set(tracks.filter(t => String(t.reciterId) !== seed.id).map(t => t.artist))].slice(0, 3);

/** A tall card, its picture filling it: a label above, the title and a line at the bottom, a play button. */
function TallCard({ label, labelHref, cover, badge, title, titleHref, sub, queue, start = 0, playName }: {
  label: string;
  labelHref?: string;
  cover: string;
  badge?: string;
  title: string;
  titleHref: string;
  sub: string;
  queue: Track[];
  start?: number;
  /** What the play button says it plays */
  playName: string;
}) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const here = queue.some(t => t.id == currentTrack?.id);
  const playing = here && isPlaying;
  return (
    <article className="more-card">
      {labelHref
        ? <Link href={labelHref} prefetch={false} className="more-card-label">{label}</Link>
        : <span className="more-card-label">{label}</span>}
      <div className={`more-card-body${here ? ' is-current' : ''}`}>
        <img src={thumb(cover, 640)} alt="" loading="lazy" decoding="async" />
        {badge ? <span className="more-card-badge">{badge}</span> : null}
        <div className="more-card-info">
          <Link href={titleHref} prefetch={false} className="more-card-title">{title}</Link>
          <span className="more-card-sub">{sub}</span>
        </div>
        <button
          type="button"
          className="more-card-play"
          onClick={() => (here ? togglePlayPause() : playQueue(queue, start))}
          aria-label={playing ? `إيقاف ${playName}` : `تشغيل ${playName}`}
        >
          {playing ? <Pause size={20} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" strokeWidth={0} />}
        </button>
      </div>
    </article>
  );
}

type MoreCard = { seed: Seed; tracks: Track[]; featured: number };

/**
 * A card for each reciter the listener has been hearing (then the most
 * listened ones): one of their tracks the listener has not played lately.
 * Play goes on through more of that reciter's best known.
 */
export function MoreFromReciters({ seeds, heard, fromRecent }: {
  seeds: Seed[];
  heard: string[];
  /** The seeds start with the listener's own reciters (else the most listened) */
  fromRecent: boolean;
}) {
  const played = new Set(heard);
  return (
    <Lazy<MoreCard[]> load={async () => {
      const cards = await Promise.all(seeds.map(async seed => {
        const tracks = await bestOf(seed.id, 8);
        const featured = tracks.findIndex(t => !played.has(t.id));
        return featured >= 0 ? { seed, tracks, featured } : null;
      }));
      const found = cards.filter((c): c is MoreCard => c !== null);
      return found.length >= 2 ? found : null;
    }}>
      {cards => (
        <Shelf
          title={fromRecent ? 'المزيد من رواديدك' : 'المزيد من الرواديد'}
          subtitle={fromRecent ? 'مقاطع لم تسمعها مؤخراً، من الرواديد الذين تستمع إليهم' : 'من أكثر الرواديد استماعاً على المنصة'}
          wide
        >
          {cards.map(({ seed, tracks, featured }) => (
            <TallCard
              key={seed.id}
              label={`المزيد من ${seed.name}`}
              labelHref={`/reciter?id=${seed.id}`}
              cover={tracks[featured].imageUrl || ''}
              title={tracks[featured].title}
              titleHref={`/track?id=${tracks[featured].id}`}
              sub={seed.name}
              queue={tracks}
              start={featured}
              playName={tracks[featured].title}
            />
          ))}
        </Shelf>
      )}
    </Lazy>
  );
}

type Blend = { seed: Seed; cover: string; tracks: Track[]; guests: string[] };

/**
 * A mix for each reciter the listener has been hearing: their best known
 * tracks the listener has not played lately, with some from the other
 * reciters they hear between them. Made from this listener's own history (kept
 * in their browser), so there is none for someone who has heard nothing yet.
 */
export function MadeForYou({ seeds, heard }: { seeds: Seed[]; heard: string[] }) {
  const played = new Set(heard);
  return (
    <Lazy<Blend[]> load={async () => {
      const [lists, photo] = await Promise.all([
        Promise.all(seeds.map(async seed => (await bestOf(seed.id, 12)).filter(t => !played.has(t.id)))),
        photosOf(seeds.map(s => s.id)),
      ]);
      const mixes = seeds.map((seed, i): Blend | null => {
        const own = lists[i].slice(0, 9);
        if (own.length < 3) return null;
        const tracks = blend(own, lists.filter((_, j) => j !== i).map(l => l.slice(0, 2)));
        return { seed, cover: photo.get(seed.id) || own[0].imageUrl || '', tracks, guests: guestNames(tracks, seed) };
      });
      const found = mixes.filter((m): m is Blend => m !== null);
      return found.length ? found : null;
    }}>
      {mixes => (
        <Shelf title="مصممة من أجلك" subtitle="ميكسات من الرواديد الذين تستمع إليهم، تتجدد مع استماعك" wide>
          {mixes.map(({ seed, cover, tracks, guests }) => (
            <TallCard
              key={seed.id}
              label="مصممة من أجلك"
              cover={cover}
              badge="ميكس"
              title={`ميكس ${seed.name}`}
              titleHref={`/reciter?id=${seed.id}`}
              sub={guests.length ? `مع ${andJoin(guests)}` : countOf(tracks.length, TRACKS)}
              queue={tracks}
              playName={`ميكس ${seed.name}، ${countOf(tracks.length, TRACKS)}`}
            />
          ))}
        </Shelf>
      )}
    </Lazy>
  );
}

/**
 * For the fans of each of the most listened reciters: a station of their best
 * known tracks, with the next most listened reciters between them. The same
 * for everyone; its page is the radio of those reciters.
 */
export function FansOf({ seeds }: { seeds: Seed[] }) {
  return (
    <Lazy<Blend[]> load={async () => {
      const [lists, photo] = await Promise.all([
        Promise.all(seeds.map(seed => bestOf(seed.id, 12))),
        photosOf(seeds.map(s => s.id)),
      ]);
      const stations = seeds.map((seed, i): Blend | null => {
        const own = lists[i].slice(0, 9);
        if (own.length < 3) return null;
        // The two most listened reciters after this one
        const others = seeds.map((_, j) => j).filter(j => j !== i).slice(0, 2);
        const tracks = blend(own, others.map(j => lists[j].slice(0, 3)));
        return { seed, cover: photo.get(seed.id) || own[0].imageUrl || '', tracks, guests: guestNames(tracks, seed) };
      });
      const found = stations.filter((s): s is Blend => s !== null);
      return found.length >= 2 ? found : null;
    }}>
      {stations => (
        <Shelf title="لمحبي الرواديد" subtitle="محطة لكل رادود: أشهر مقاطعه، ومعه أكثر الرواديد استماعاً" wide>
          {stations.map(({ seed, cover, tracks, guests }) => {
            const ids = [seed.id, ...seeds.filter(s => s.id !== seed.id && guests.includes(s.name)).map(s => s.id)];
            return (
              <TallCard
                key={seed.id}
                label={`لمحبي ${seed.name}`}
                labelHref={`/reciter?id=${seed.id}`}
                cover={cover}
                badge="راديو"
                title={`راديو ${seed.name}`}
                titleHref={`/radio?ids=${ids.join(',')}`}
                sub={guests.length ? `مع ${andJoin(guests)}` : countOf(tracks.length, TRACKS)}
                queue={tracks}
                playName={`راديو ${seed.name}، ${countOf(tracks.length, TRACKS)}`}
              />
            );
          })}
        </Shelf>
      )}
    </Lazy>
  );
}
