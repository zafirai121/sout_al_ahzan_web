"use client";

// The homepage's lower sections. Each asks the database for its tracks only
// when the visitor scrolls near it, so the top of the page comes first.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Ellipsis, Link2, ListEnd, Music2, Pause, Play, Plus, Radio, SquarePlus, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import DropdownMenu, { DropdownMenuItem } from '@/components/DropdownMenu';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
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

/**
 * Waits to be near, then fetches; renders nothing until there is something. A
 * section at the top of the page keeps its place meanwhile (`placeholder`),
 * so what is below it doesn't jump when it comes; it goes if there is nothing.
 */
function Lazy<D>({ load, children, placeholder = null }: {
  load: () => Promise<D | null>;
  children: (data: D) => React.ReactNode;
  placeholder?: React.ReactNode;
}) {
  const [ref, near] = useNear<HTMLDivElement>();
  const [data, setData] = useState<D | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!near) return;
    let live = true;
    load().then(d => { if (live) setData(d); })
      .catch(e => console.warn('home section:', e))
      .finally(() => { if (live) setDone(true); });
    return () => { live = false; };
    // `load` is a fresh function each render; what it fetches does not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near]);
  return <div ref={ref} className="home-lazy">{data ? children(data) : done ? null : placeholder}</div>;
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
/** The reciter of the day's header, the same while it loads and once it has come */
const spotlightHeader = (
  <header className="home-shelf-header">
    <div>
      <h2 id="home-spotlight">رادود اليوم</h2>
      <p className="home-shelf-subtitle">يتغيّر كل يوم بين رواديد المنصة</p>
    </div>
  </header>
);

export function ReciterOfTheDay() {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  return (
    <Lazy<Spotlight>
      placeholder={
        <section className="home-shelf" aria-hidden="true">
          {spotlightHeader}
          <div className="hero-frame"><div className="home-spotlight home-spotlight--loading" /></div>
        </section>
      }
      load={async () => {
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
            {spotlightHeader}
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

/** One track (more from a reciter), or a list played whole (a mix, a station) */
type TallKind = 'track' | 'mix' | 'radio';

/**
 * The player's list is this one (with what was added to it since). A track
 * being in the list is not enough: the stations share their reciters' best
 * known, so every card would light up at once.
 */
const isPlayingList = (playing: Track[], list: Track[]) =>
  list.length > 0 && playing.length >= list.length && list.every((t, i) => playing[i]?.id == t.id);

/** Going through the tracks a card holds, one shown at a time */
type Pager = { at: number; go: (i: number) => void; warm: () => void };

/**
 * The grains that fly from add when something is kept: all around the button,
 * some further out than others, a little after one another. The furthest stay
 * clear of the card's bottom edge, which is further from the button's middle.
 */
const GRAINS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
  const far = [44, 34, 28][i % 3];
  return {
    '--x': `${Math.round(Math.cos(angle) * far)}px`,
    '--y': `${Math.round(Math.sin(angle) * far)}px`,
    '--turn': `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`,
    animationDelay: `${(i % 4) * 25}ms`,
  } as React.CSSProperties;
});

/**
 * A tall card, its picture filling it: a label above, the title and a line at
 * the bottom. Pointing at it (or tabbing to it) shows play with add and the
 * menu beside it, and on a card holding several tracks the arrows between
 * them. Add keeps a track in the likes, and a mix or a station whole, as one
 * of the listener's playlists.
 */
function TallCard({ kind, reciterId, label, labelHref, cover, badge, title, titleHref, sub, queue, start = 0, playName, pager }: {
  kind: TallKind;
  reciterId: string;
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
  pager?: Pager;
}) {
  const { queue: playerQueue, playQueue, currentTrack, isPlaying, togglePlayPause, addToQueue } = usePlayer();
  const { playlists, saveList, deletePlaylist, isLiked, toggleLike } = usePlaylists();
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const track = queue[start];
  // The card's list is playing; on a card of tracks, play is for the one shown
  const mine = isPlayingList(playerQueue, queue);
  const here = mine && (kind !== 'track' || track.id == currentTrack?.id);
  const playing = here && isPlaying;
  const from = `${kind}-${reciterId}`;
  const savedList = kind === 'track' ? undefined : playlists.find(p => p.from === from);
  const kept = kind === 'track' ? isLiked(track.id) : savedList !== undefined;
  const keepLabel = kind === 'track'
    ? (kept ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات')
    : (kept ? 'إزالة من مكتبتك' : 'أضف إلى مكتبتك');
  // Keeping something sets off the grains, for that one only (not the next track shown)
  const [pop, setPop] = useState<{ n: number; of: string } | null>(null);
  const keptId = kind === 'track' ? track.id : from;
  const popping = kept && pop?.of === keptId;
  const keep = () => {
    if (!kept) setPop(p => ({ n: (p?.n ?? 0) + 1, of: keptId }));
    if (kind === 'track') toggleLike(track);
    else if (savedList) deletePlaylist(savedList.id);
    else saveList(title, queue, from);
  };

  const items: DropdownMenuItem[] = [kind === 'track'
    ? { label: 'أضف إلى قائمة الانتظار', onClick: () => addToQueue(track), rightIcon: <ListEnd size={18} /> }
    : { label: `أضف ${countOf(queue.length, TRACKS)} إلى قائمة الانتظار`, onClick: () => queue.forEach(addToQueue), rightIcon: <ListEnd size={18} /> }];
  if (kind === 'track') items.push({ label: 'أضف إلى قائمة تشغيل', onClick: () => setPicking(true), rightIcon: <SquarePlus size={18} /> });
  items.push({ label: keepLabel, onClick: keep, rightIcon: kept ? <Check size={18} /> : <Plus size={18} /> });
  items.push({ type: 'divider' });
  if (kind === 'track') items.push({ label: 'صفحة المقطع', onClick: () => router.push(titleHref), rightIcon: <Music2 size={18} /> });
  if (kind === 'radio') items.push({ label: 'صفحة الراديو', onClick: () => router.push(titleHref), rightIcon: <Radio size={18} /> });
  items.push({ label: 'صفحة الرادود', onClick: () => router.push(`/reciter?id=${reciterId}`), rightIcon: <UserRound size={18} /> });
  // A mix is made from this listener's history, so it has no page to share
  if (kind !== 'mix') items.push({
    label: copied ? 'نُسخ الرابط' : 'نسخ الرابط',
    preventCloseOnClick: true,
    onClick: () => { navigator.clipboard?.writeText(new URL(titleHref, location.origin).href).then(() => setCopied(true), () => {}); },
    rightIcon: <Link2 size={18} />,
  });

  return (
    <article className="more-card">
      {labelHref
        ? <Link href={labelHref} prefetch={false} className="more-card-label">{label}</Link>
        : <span className="more-card-label">{label}</span>}
      <div className={`more-card-body${mine ? ' is-current' : ''}`} onMouseEnter={pager?.warm}>
        {/* Keyed by the picture, so the next track's fades in */}
        <img key={cover} src={thumb(cover, 640)} alt="" loading="lazy" decoding="async" />
        {badge ? <span className="more-card-badge">{badge}</span> : null}
        {pager && queue.length > 1 ? (
          <>
            <span className="more-card-dots" aria-hidden="true">
              {queue.map((t, i) => <i key={t.id} className={i === pager.at ? 'is-on' : undefined} />)}
            </span>
            <button
              type="button"
              className="more-card-step is-prev"
              onClick={() => pager.go(pager.at - 1)}
              disabled={pager.at === 0}
              aria-label={`المقطع السابق، ${label}`}
            >
              <ChevronRight size={24} />
            </button>
            <button
              type="button"
              className="more-card-step is-next"
              onClick={() => pager.go(pager.at + 1)}
              disabled={pager.at === queue.length - 1}
              aria-label={`المقطع التالي، ${label}`}
            >
              <ChevronLeft size={24} />
            </button>
          </>
        ) : null}
        <div className="more-card-info">
          <Link href={titleHref} prefetch={false} className="more-card-title">{title}</Link>
          <div className="more-card-bar">
            <span className="more-card-sub">{sub}</span>
            {/* The menu, add, then play at the card's edge. The menu opens
                upwards from the row, so it stays inside the card */}
            <div className="more-card-actions">
              <DropdownMenu
                buttonContent={<span className="more-card-tool" title="المزيد"><Ellipsis size={20} strokeWidth={2.5} /></span>}
                items={items}
                label={`خيارات ${title}`}
                style={{ position: 'static' }}
                menuStyle={{ minWidth: '230px', top: 'auto', bottom: '100%', marginTop: 0, marginBottom: '10px' }}
              />
              <span className="more-card-keep">
                <button
                  type="button"
                  className={`more-card-tool is-add${kept ? ' is-kept' : ''}`}
                  onClick={keep}
                  aria-label={`${keepLabel}: ${title}`}
                  title={keepLabel}
                >
                  {kept
                    ? <Check key={popping ? pop.n : 0} className={popping ? 'is-drawn' : undefined} size={20} strokeWidth={2.75} />
                    : <Plus size={20} strokeWidth={2.5} />}
                </button>
                {popping ? (
                  <span key={pop.n} className="more-card-burst" aria-hidden="true">
                    {GRAINS.map((style, i) => <i key={i} style={style} />)}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                className="more-card-play"
                onClick={() => (here ? togglePlayPause() : playQueue(queue, start))}
                aria-label={playing ? `إيقاف ${playName}` : `تشغيل ${playName}`}
              >
                {playing ? <Pause size={26} fill="currentColor" strokeWidth={0} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {picking ? <AddToPlaylistModal track={track} onClose={() => setPicking(false)} /> : null}
    </article>
  );
}

type MoreCard = { seed: Seed; tracks: Track[] };

/** How many of a reciter's tracks their card holds */
const STACK = 5;

/**
 * A reciter's card holding several of their tracks, one shown at a time; the
 * arrows on it go through them. Play starts at the one shown and goes on
 * through the rest. While its list plays, it shows the track playing.
 */
function TrackStack({ seed, tracks }: MoreCard) {
  const { queue, currentTrack } = usePlayer();
  const [at, setAt] = useState(0);
  const playingAt = isPlayingList(queue, tracks) ? tracks.findIndex(t => t.id == currentTrack?.id) : -1;
  useEffect(() => { if (playingAt >= 0) setAt(playingAt); }, [playingAt]);
  // The pictures on either side, asked for before the arrow is pressed
  const warm = (i: number) => [i - 1, i + 1].forEach(k => {
    const src = thumb(tracks[k]?.imageUrl, 640);
    if (src) new Image().src = src;
  });
  const shown = tracks[at];
  return (
    <TallCard
      kind="track"
      reciterId={seed.id}
      label={`المزيد من ${seed.name}`}
      labelHref={`/reciter?id=${seed.id}`}
      cover={shown.imageUrl || ''}
      title={shown.title}
      titleHref={`/track?id=${shown.id}`}
      sub={seed.name}
      queue={tracks}
      start={at}
      playName={shown.title}
      pager={{ at, go: i => { setAt(i); warm(i); }, warm: () => warm(at) }}
    />
  );
}

/**
 * A card for each reciter the listener has been hearing (then the most
 * listened ones), holding their best known tracks the listener has not played
 * lately.
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
        const tracks = (await bestOf(seed.id, 15)).filter(t => !played.has(t.id)).slice(0, STACK);
        return tracks.length ? { seed, tracks } : null;
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
          {cards.map(card => <TrackStack key={card.seed.id} {...card} />)}
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
              kind="mix"
              reciterId={seed.id}
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
                kind="radio"
                reciterId={seed.id}
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
