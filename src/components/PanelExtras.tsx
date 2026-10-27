"use client";

// Under what is playing, in the panel beside the page, as the phone app has
// them under its player: the words, a word about the reciter, the credits,
// more of the reciter's work, similar tracks from others.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Maximize2, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer, Track } from '@/context/PlayerContext';
import { Track as TrackData } from '@/types';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { CATEGORY_VALUES, categoryCode } from '@/utils/categories';
import { usePalette } from '@/utils/palette';
import { countOf, listensOf, TRACKS } from '@/utils/plural';

const COLUMNS = 'id,title,reciter_name,file_url,image_url,category,duration,listen_count,reciter_id';

// Where the database may keep who wrote, set and produced a track, and what
// it says of a reciter (the same columns the phone app reads)
const CREDIT_FIELDS: [string, string[]][] = [
  ['الكلمات', ['poet', 'poet_name', 'lyricist', 'writer']],
  ['الألحان', ['composer', 'composer_name', 'melody']],
  ['الإنتاج', ['producer', 'production', 'studio']],
];
const BIO_FIELDS = ['bio', 'about', 'description'];

const text = (row: Record<string, unknown> | null, key: string) =>
  typeof row?.[key] === 'string' ? (row[key] as string).trim() : '';

export type Extras = {
  lyrics: string;
  /** Role, then name */
  credits: [string, string][];
  reciter: { id: string; name: string; image: string; bio: string } | null;
  /** How many tracks they have, and how many times all were heard (null until counted) */
  total: number;
  listens: number | null;
  /** Their most listened, this one left out */
  works: TrackData[];
  /** The same kind of track from other reciters */
  similar: TrackData[];
};

// Read once a visit: per track, and each reciter's listens (all their tracks)
const known = new Map<string, Extras>();
const reciterListens = new Map<string, Promise<number>>();

/** The listens of all a reciter's tracks: only that column, a thousand rows at a time */
function listensOfReciter(id: string, total: number) {
  if (!reciterListens.has(id)) {
    const pages = Array.from({ length: Math.ceil(total / 1000) }, (_, i) =>
      supabase.from('audio_library').select('listen_count').eq('reciter_id', id).range(i * 1000, i * 1000 + 999)
        .then(({ data }) => (data ?? []).reduce((sum, r) => sum + (Number(r.listen_count) || 0), 0)));
    reciterListens.set(id, Promise.all(pages).then(sums => sums.reduce((a, b) => a + b, 0)));
  }
  return reciterListens.get(id)!;
}

/** The same order every time for the same track, a different one for each */
function seeded<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let s = (seed || 1) % 2147483647;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function load(track: Track): Promise<Extras> {
  const { data: row } = await supabase.from('audio_library').select('*').eq('id', track.id).maybeSingle();
  const reciterId = String(row?.reciter_id ?? track.reciterId ?? '');
  const values = CATEGORY_VALUES[categoryCode(row?.category)] ?? [];

  const [reciterRow, works, similar] = await Promise.all([
    reciterId ? supabase.from('reciters').select('*').eq('id', reciterId).maybeSingle().then(r => r.data) : null,
    reciterId
      ? supabase.from('audio_library').select(COLUMNS, { count: 'exact' }).eq('reciter_id', reciterId)
        .order('listen_count', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(11)
      : null,
    values.length
      ? supabase.from('audio_library').select(COLUMNS).in('category', values).neq('reciter_id', reciterId || '0')
        .order('listen_count', { ascending: false, nullsFirst: false }).limit(40).then(r => r.data ?? [])
      : [],
  ]);

  return {
    lyrics: text(row, 'lyrics'),
    credits: CREDIT_FIELDS.flatMap(([role, keys]) => {
      const name = keys.map(k => text(row, k)).find(Boolean);
      return name ? [[role, name] as [string, string]] : [];
    }),
    reciter: reciterRow ? {
      id: String(reciterRow.id),
      name: reciterRow.name,
      image: reciterRow.image_url || '',
      bio: BIO_FIELDS.map(k => text(reciterRow, k)).find(Boolean) ?? '',
    } : null,
    total: works?.count ?? 0,
    listens: null,
    works: (works?.data ?? []).map(getTrackData).filter(t => t.audioUrl && t.id !== track.id).slice(0, 10),
    similar: seeded(similar.map(getTrackData).filter(t => t.audioUrl), Number(track.id)).slice(0, 8),
  };
}

/** What the panel shows under the track playing: null while it is read */
export function useExtras(track: Track | null): Extras | null {
  const [extras, setExtras] = useState<Extras | null>(() => (track ? known.get(track.id) ?? null : null));
  useEffect(() => {
    if (!track) return setExtras(null);
    let live = true;
    const show = (e: Extras) => { known.set(track.id, e); if (live) setExtras(e); };
    const cached = known.get(track.id);
    setExtras(cached ?? null);
    const ready = cached ? Promise.resolve(cached) : load(track).then(e => { show(e); return e; });
    ready.then(e => {
      if (e.listens != null || !e.reciter || !e.total) return;
      listensOfReciter(e.reciter.id, e.total).then(listens => show({ ...e, listens }));
    }).catch(err => console.warn('Panel extras failed:', err));
    return () => { live = false; };
    // A new track is a new id; the rest of it doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);
  return extras;
}

/** The words: their first lines, in the colour of the cover; all of them on the track's page */
export function PanelLyrics({ track, lyrics }: { track: Track; lyrics: string }) {
  const palette = usePalette(track.imageUrl);
  return (
    <Link href={`/track?id=${track.id}`} prefetch={false} className="panel-card panel-lyrics" style={palette ? { background: palette.main } : undefined}>
      <span className="panel-card-head">
        <h3>الكلمات</h3>
        <Maximize2 size={16} aria-label="عرض الكلمات كاملة" />
      </span>
      <span className="panel-lyrics-text">{lyrics}</span>
    </Link>
  );
}

/** A word about the reciter: their photo, their numbers, what is said of them (or their best known) */
export function PanelAbout({ extras, fallbackImage }: { extras: Extras; fallbackImage?: string }) {
  const { reciter, works, total, listens } = extras;
  if (!reciter) return null;
  const famous = works.slice(0, 3).map(t => `«${t.title}»`).join('، ');
  const about = reciter.bio || (famous ? `أشهر أعماله في صوت الأحزان: ${famous}.` : '');
  return (
    <Link href={`/reciter?id=${reciter.id}`} prefetch={false} className="panel-card panel-about">
      <span className="panel-about-photo">
        <img src={thumb(reciter.image || fallbackImage || '/cover-placeholder.svg', 640)} alt="" loading="lazy" decoding="async" />
        <span className="panel-about-label">لمحة عن الرادود</span>
      </span>
      <span className="panel-about-body">
        <span className="panel-about-name">{reciter.name}</span>
        <span className="panel-about-numbers">
          {countOf(total, TRACKS)}{listens ? ` • ${listensOf(listens)}` : ''}
        </span>
        {about ? <span className="panel-about-text">{about}</span> : null}
      </span>
    </Link>
  );
}

/** Who made it: the reciter, whoever the database names, and where it comes from */
export function PanelCredits({ extras, artist }: { extras: Extras; artist: string }) {
  const rows: [string, string][] = [
    ...(extras.reciter || artist ? [[extras.reciter?.name ?? artist, 'الأداء • رادود رئيسي'] as [string, string]] : []),
    ...extras.credits.map(([role, name]) => [name, role] as [string, string]),
    ['صوت الأحزان', 'المصدر'],
  ];
  return (
    <section className="panel-card" aria-labelledby="panel-credits">
      <header className="panel-card-head"><h3 id="panel-credits">لائحة الشكر</h3></header>
      <ul className="panel-credits">
        {rows.map(([name, role]) => (
          <li key={`${role}-${name}`}>
            <span className="panel-credit-name">{name}</span>
            <span className="panel-credit-role">{role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** More of the reciter's work, tall cards in a row; a click plays them from there */
export function PanelExplore({ extras }: { extras: Extras }) {
  const { playQueue } = usePlayer();
  const { reciter, works } = extras;
  if (!reciter || works.length < 2) return null;
  return (
    <section className="panel-row" aria-labelledby="panel-explore">
      <header className="panel-row-head">
        <h3 id="panel-explore">فلنستكشف الإبداعات: من {reciter.name}</h3>
        <Link href={`/reciter?id=${reciter.id}`} prefetch={false}>عرض الكل</Link>
      </header>
      <div className="panel-strip">
        {works.map((t, i) => (
          <button key={t.id} type="button" className="panel-explore" onClick={() => playQueue(works, i)} aria-label={`تشغيل ${t.title}`}>
            <img src={thumb(t.imageUrl || '/cover-placeholder.svg', 320)} alt="" loading="lazy" decoding="async" />
            <span className="panel-explore-play" aria-hidden="true"><Play size={12} fill="currentColor" strokeWidth={0} /></span>
            <span className="panel-explore-text">
              <span className="panel-explore-title">{t.title}</span>
              <span className="panel-explore-sub">{t.plays ? listensOf(t.plays) : t.artist}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** The same kind of track from other reciters, square covers in a row */
export function PanelSimilar({ extras }: { extras: Extras }) {
  const { playQueue } = usePlayer();
  const { similar } = extras;
  if (!similar.length) return null;
  return (
    <section className="panel-row" aria-labelledby="panel-similar">
      <header className="panel-row-head"><h3 id="panel-similar">مقاطع مشابهة</h3></header>
      <div className="panel-strip">
        {similar.map((t, i) => (
          <button key={t.id} type="button" className="panel-similar" onClick={() => playQueue(similar, i)} aria-label={`تشغيل ${t.title}`}>
            <img src={thumb(t.imageUrl || '/cover-placeholder.svg', 240)} alt="" loading="lazy" decoding="async" />
            <span className="panel-similar-title">{t.title}</span>
            <span className="panel-similar-sub">{t.artist}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
