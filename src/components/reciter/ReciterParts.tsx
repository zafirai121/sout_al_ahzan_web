"use client";

// A reciter's page: who they are and their best known tracks, their seasonal
// releases ("شهر محرم الحرام 1446 هـ"), and every track they have, to search,
// sort and filter. Big reciters have over a thousand, so the list is shown a
// page at a time.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Link2, Pause, Play, Radio, Search, Shuffle } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { CATEGORY_LIST, categoryCode, foldArabic } from '@/utils/categories';
import { countOf, RELEASES, TRACKS } from '@/utils/plural';
import { paletteStyle, usePalette } from '@/utils/palette';
import TrackRows from '@/components/TrackRows';
import { Shelf, TrackCard } from '@/components/home/HomeParts';
import { Track } from '@/types';

export type Entry = {
  track: Track;
  /** Database id: higher was added later */
  id: number;
  listens: number;
  /** The release it belongs to, '' when none */
  album: string;
  /** Category code, '' when unknown */
  category: string;
  /** The title folded, for searching */
  key: string;
};

export type Album = {
  name: string;
  /** Hijri year it is named for, 0 when none */
  year: number;
  /** The name without its year ("شهر محرم الحرام") */
  season: string;
  color: string;
  entries: Entry[];
};

export const toEntry = (row: any): Entry => {
  const track = getTrackData(row);
  return {
    track,
    id: Number(row.id) || 0,
    listens: Number(row.listen_count) || 0,
    album: typeof row.album === 'string' ? row.album.trim() : '',
    category: categoryCode(row.category),
    key: foldArabic(track.title),
  };
};

const byListens = (a: Entry, b: Entry) => b.listens - a.listens || b.id - a.id;
const byNewest = (a: Entry, b: Entry) => b.id - a.id;

// The hijri year a release is named for ("الأيام الفاطمية 1448 هـ")
const YEAR = /\s*(1[34]\d\d)\s*(هـ|ه)?\.?/;

// Releases follow the year's seasons; each wears the colour of its category
// tile (Muharram as the Hussaini poems, Fatimiyya as the elegies...).
// Matched on folded names.
const SEASON_COLORS: [string[], string][] = [
  [['محرم', 'عاشور'], '#7A1F2B'],
  [['فاطمي', 'زهرا'], '#5B2A4E'],
  [['صفر', 'اربعين'], '#8A4B26'],
  [['رمضان'], '#1D5560'],
  [['مواليد', 'مولد', 'ميلاد', 'ولاده', 'افراح', 'فرح'], '#1F6B4F'],
];
const seasonColor = (name: string) => {
  const folded = foldArabic(name);
  return SEASON_COLORS.find(([words]) => words.some(w => folded.includes(w)))?.[1] ?? '#3D4A57';
};

/** The reciter's releases, latest year first; their tracks in the order they were added. */
export function albumsOf(entries: Entry[]): Album[] {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!e.album) continue;
    const list = groups.get(e.album);
    if (list) list.push(e);
    else groups.set(e.album, [e]);
  }
  return [...groups].map(([name, list]) => {
    const year = Number(name.match(YEAR)?.[1] ?? 0);
    return {
      name,
      year,
      season: year ? name.replace(YEAR, ' ').trim() || name : name,
      color: seasonColor(name),
      entries: [...list].sort((a, b) => a.id - b.id),
    };
  }).sort((a, b) => b.year - a.year || b.entries[b.entries.length - 1].id - a.entries[a.entries.length - 1].id);
}

const playable = (entries: Entry[]) => entries.map(e => e.track).filter(t => t.audioUrl);

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function ReciterHero({ id, name, imageUrl, entries, albums }: {
  id: string;
  name: string;
  imageUrl: string;
  entries: Entry[];
  albums: Album[];
}) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const [copied, setCopied] = useState(false);
  // The header in their photo's colours, from the photo itself
  const palette = usePalette(imageUrl);

  const popular = useMemo(() => [...entries].sort(byListens), [entries]);
  const queue = useMemo(() => playable(popular), [popular]);

  const playingHere = isPlaying && entries.some(e => e.track.id == currentTrack?.id);
  const playAll = () => (playingHere ? togglePlayPause() : playQueue(queue, 0));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="hero-frame">
    <section className="reciter-hero" aria-labelledby="reciter-name" style={paletteStyle(palette)}>
      <div className="reciter-hero-main">
        <img className="reciter-portrait" src={thumb(imageUrl, 400)} alt={name} width={176} height={176} />
        <div className="reciter-hero-text">
          <h1 id="reciter-name" className="reciter-name">{name}</h1>
          <p className="reciter-facts">
            <span>{countOf(entries.length, TRACKS)}</span>
            {albums.length > 0 ? <span>{countOf(albums.length, RELEASES)}</span> : null}
          </p>
        </div>
        {queue.length > 0 ? (
          <div className="reciter-actions">
            <button type="button" className="btn-gold" onClick={playAll}>
              {playingHere ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
              {playingHere ? 'إيقاف' : 'تشغيل الكل'}
            </button>
            <button type="button" className="reciter-icon-btn" onClick={() => playQueue(shuffled(queue), 0)} aria-label={`تشغيل مقاطع ${name} عشوائياً`} title="تشغيل عشوائي">
              <Shuffle size={28} />
            </button>
            <Link href={`/radio?ids=${id}`} prefetch={false} className="reciter-icon-btn" aria-label={`راديو ${name}`} title="راديو الرادود">
              <Radio size={28} />
            </Link>
            <button type="button" className="reciter-icon-btn" onClick={copyLink} aria-label="نسخ رابط الصفحة" title="نسخ رابط الصفحة">
              <Link2 size={28} />
            </button>
            <span className="reciter-copied" role="status">{copied ? 'نُسخ رابط الصفحة' : ''}</span>
          </div>
        ) : null}
      </div>
    </section>
    </div>
  );
}

/**
 * Their most listened tracks as square cards, down the page above the other
 * reciters. Until anyone has listened, "most listened" would be an arbitrary
 * pick: then the newest.
 */
export function ReciterTop({ name, entries }: { name: string; entries: Entry[] }) {
  const { heard, tracks } = useMemo(() => {
    const popular = [...entries].sort(byListens);
    const heard = (popular[0]?.listens ?? 0) > 0;
    const picked = (heard ? popular : [...entries].sort(byNewest)).filter(e => e.track.audioUrl).slice(0, 10);
    return { heard, tracks: picked.map(e => e.track) };
  }, [entries]);
  if (tracks.length === 0) return null;
  return (
    <Shelf title={heard ? 'الأكثر استماعاً' : 'أُضيف حديثاً'} subtitle={heard ? `أشهر مقاطع ${name}` : `أحدث ما أُضيف من ${name}`}>
      {tracks.map(t => <TrackCard key={t.id} item={t} />)}
    </Shelf>
  );
}

// Most tracks of a release carry the reciter's own photo as their cover, so the
// card shows what tells releases apart: the season and its hijri year.
export function AlbumCard({ album, active, onOpen }: { album: Album; active: boolean; onOpen: (name: string) => void }) {
  return (
    <button type="button" className={`reciter-album${active ? ' is-active' : ''}`} onClick={() => onOpen(album.name)} aria-pressed={active}>
      <span className="reciter-album-tile" style={{ '--season': album.color } as React.CSSProperties} aria-hidden="true">
        <span className="reciter-album-season">{album.season}</span>
        {album.year ? (
          <span className="reciter-album-year">{album.year}<small>هـ</small></span>
        ) : null}
      </span>
      {/* The tile says it; screen readers get the full name */}
      <span className="sr-only">{album.name}</span>
      <span className="reciter-album-sub">{countOf(album.entries.length, TRACKS)}</span>
    </button>
  );
}

type Sort = 'order' | 'recent' | 'popular' | 'title';
// Ten at first, twenty more with each «عرض المزيد»
const FIRST = 10;
const PAGE = 20;
const CATEGORY_TITLE = new Map(CATEGORY_LIST.map(c => [c.id, c.title]));

export function ReciterTracks({ name, entries, albums, album, onAlbum }: {
  name: string;
  entries: Entry[];
  albums: Album[];
  album: string;
  onAlbum: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>(album ? 'order' : 'recent');
  const [shown, setShown] = useState(FIRST);

  // A release plays in its own order; leaving it goes back to the newest first
  useEffect(() => {
    setSort(s => (album ? 'order' : s === 'order' ? 'recent' : s));
  }, [album]);
  useEffect(() => setShown(FIRST), [album, category, query, sort]);

  const categories = useMemo(
    () => CATEGORY_LIST
      .map(c => ({ ...c, count: entries.filter(e => e.category === c.id).length }))
      .filter(c => c.count > 0),
    [entries],
  );

  const list = useMemo(() => {
    const words = foldArabic(query.trim()).split(/\s+/).filter(Boolean);
    const picked = entries.filter(e =>
      (!album || e.album === album) && (!category || e.category === category) && words.every(w => e.key.includes(w)));
    const order = {
      order: (a: Entry, b: Entry) => a.id - b.id,
      recent: byNewest,
      popular: byListens,
      title: (a: Entry, b: Entry) => a.track.title.localeCompare(b.track.title, 'ar'),
    }[sort];
    return picked.sort(order);
  }, [entries, album, category, query, sort]);

  const queue = useMemo(() => playable(list), [list]);

  const filtered = Boolean(album || category || query.trim());
  const clear = () => {
    setQuery('');
    setCategory('');
    if (album) onAlbum('');
  };

  if (entries.length === 0) {
    return <p className="reciter-empty">لم تُرفع مقاطع لهذا الرادود بعد.</p>;
  }

  return (
    <>
      <div className="reciter-toolbar">
        <label className="reciter-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`ابحث في مقاطع ${name}`}
            aria-label={`ابحث في مقاطع ${name}`}
          />
        </label>
        {albums.length > 0 ? (
          <select className="reciter-select" value={album} onChange={e => onAlbum(e.target.value)} aria-label="الإصدار">
            <option value="">كل الإصدارات</option>
            {albums.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
          </select>
        ) : null}
        <select className="reciter-select" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="الترتيب">
          {album ? <option value="order">ترتيب الإصدار</option> : null}
          <option value="recent">المضاف حديثاً</option>
          <option value="popular">الأكثر استماعاً</option>
          <option value="title">حسب العنوان</option>
        </select>
      </div>

      {categories.length > 1 ? (
        <div className="reciter-chips" role="group" aria-label="القسم">
          <button type="button" className="reciter-chip" aria-pressed={!category} onClick={() => setCategory('')}>
            الكل <span>{entries.length}</span>
          </button>
          {categories.map(c => (
            <button key={c.id} type="button" className="reciter-chip" aria-pressed={category === c.id} onClick={() => setCategory(category === c.id ? '' : c.id)}>
              {c.title} <span>{c.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="reciter-result" role="status">{filtered ? countOf(list.length, TRACKS) : ''}</p>

      {list.length === 0 ? (
        <div className="reciter-empty">
          <p>لا توجد مقاطع تطابق ما اخترت.</p>
          <button type="button" className="btn-outline" onClick={clear}>عرض كل المقاطع</button>
        </div>
      ) : (
        <>
          <TrackRows
            queue={queue}
            asideTitle="الإصدار"
            rows={list.slice(0, shown).map(e => ({
              track: e.track,
              sub: CATEGORY_TITLE.get(e.category) ?? '',
              aside: e.album && e.album !== album
                ? <button type="button" onClick={() => onAlbum(e.album)} title={`عرض ${e.album}`}>{e.album}</button>
                : e.album,
            }))}
          />
          {list.length > shown ? (
            <div className="reciter-more">
              <button type="button" className="btn-outline" onClick={() => setShown(s => s + PAGE)}>عرض المزيد</button>
              <span>بقي {countOf(list.length - shown, TRACKS)}</span>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
