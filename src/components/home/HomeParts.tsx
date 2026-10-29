"use client";

// The homepage's building blocks: shelves of tracks and reciters, the
// categories, and the listener's own recent tracks. Every card is a real link
// (search engines follow it) and covers are asked for at the size they show.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, ChevronLeft, ChevronRight, Droplets, Feather, HandHeart, Landmark, Mic, Music, Pause, Play, Shapes, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getReciterData, getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { CATEGORY_LIST } from '@/utils/categories';
import { countOf, LISTENS } from '@/utils/plural';
import type { NewRelease } from '@/lib/new_releases';
import { supabase } from '@/lib/supabase';
import TrackContextMenu from '@/components/TrackContextMenu';
import { DbAudioTrack, DbReciter, Track } from '@/types';

/** Plays a track (and on through `queue` when given), or pauses it if it is the one playing. */
function usePlayToggle() {
  const { playTrack, playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  return {
    isPlayingNow: (track: Track) => currentTrack?.id == track.id && isPlaying,
    toggle: (track: Track, queue?: Track[]) => {
      const at = queue?.findIndex(t => t.id == track.id) ?? -1;
      if (currentTrack?.id == track.id) togglePlayPause();
      else if (!track.audioUrl) return;
      else if (queue && at >= 0) playQueue(queue, at);
      else playTrack(track);
    },
  };
}

/** A track's square card. `queue`: what plays on after it (the cards around it) */
/** A reciter's new release ("جديد محمد حجيرات"): opens their page on it. */
export function NewReleaseCard({ item }: { item: NewRelease }) {
  return (
    <article className="home-card">
      <div className="home-card-cover">
        <Link href={item.href} prefetch={false} tabIndex={-1} aria-hidden="true">
          <img src={thumb(item.imageUrl, 320)} alt="" width={320} height={320} loading="lazy" decoding="async" />
        </Link>
        <span className="home-card-badge">جديد</span>
      </div>
      <div className="home-card-meta">
        <div className="home-card-text">
          <Link href={item.href} prefetch={false} className="home-card-title">جديد {item.name}</Link>
          <span className="home-card-sub">{item.album || item.title}</span>
        </div>
      </div>
    </article>
  );
}

export function TrackCard({ item, queue }: { item: DbAudioTrack | Track; queue?: Track[] }) {
  const track = getTrackData(item);
  const { isPlayingNow, toggle } = usePlayToggle();
  const playing = isPlayingNow(track);
  return (
    <article className={`home-card${playing ? ' is-playing' : ''}`}>
      <div className="home-card-cover">
        <Link href={`/track?id=${track.id}`} prefetch={false} tabIndex={-1} aria-hidden="true">
          <img src={thumb(track.imageUrl, 320)} alt="" width={320} height={320} loading="lazy" decoding="async" />
        </Link>
        <button
          type="button"
          className="home-card-play"
          onClick={() => toggle(track, queue)}
          disabled={!track.audioUrl}
          aria-label={playing ? `إيقاف ${track.title}` : `تشغيل ${track.title}`}
        >
          {playing ? <Pause size={20} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" strokeWidth={0} />}
        </button>
      </div>
      <div className="home-card-meta">
        <div className="home-card-text">
          <Link href={`/track?id=${track.id}`} prefetch={false} className="home-card-title">{track.title}</Link>
          <span className="home-card-sub">{track.artist}</span>
        </div>
        <TrackContextMenu track={track} />
      </div>
    </article>
  );
}

export function ReciterCard({ item }: { item: DbReciter }) {
  const reciter = getReciterData(item);
  return (
    <Link href={`/reciter?id=${reciter.id}`} prefetch={false} className="home-reciter">
      <img src={thumb(reciter.imageUrl, 320)} alt="" width={320} height={320} loading="lazy" decoding="async" />
      <span className="home-reciter-name">{reciter.name}</span>
    </Link>
  );
}

/** A titled row that scrolls sideways, with buttons for those without a trackpad. */
export function Shelf({ title, subtitle, href, action, wide = false, tiles = false, outlined = false, children }: {
  title: string;
  subtitle?: string;
  href?: string;
  /** Beside its title (the owner's "تعديل الإصدارات") */
  action?: React.ReactNode;
  /** Wider items (the tall cards) */
  wide?: boolean;
  /** Two rows of four (the categories) */
  tiles?: boolean;
  /** Its cards draw a ring outside themselves (the chosen release): room kept for it */
  outlined?: boolean;
  children: React.ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ back: false, forward: false });

  // In right-to-left pages scrollLeft starts at 0 and goes negative towards the end
  const measure = () => {
    const el = row.current;
    if (!el) return;
    const travelled = Math.abs(el.scrollLeft);
    setEdges({ back: travelled > 2, forward: travelled + el.clientWidth < el.scrollWidth - 2 });
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [children]);

  const scroll = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: -direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="home-shelf" aria-label={title}>
      <header className="home-shelf-header">
        <div>
          <div className="home-shelf-title">
            <h2>{title}</h2>
            {action}
          </div>
          {subtitle ? <p className="home-shelf-subtitle">{subtitle}</p> : null}
        </div>
        <div className="home-shelf-actions">
          {href ? <Link href={href} prefetch={false} className="home-show-all">عرض الكل</Link> : null}
          <button type="button" className="home-scroll" onClick={() => scroll(-1)} disabled={!edges.back} aria-label="السابق">
            <ChevronRight size={18} />
          </button>
          <button type="button" className="home-scroll" onClick={() => scroll(1)} disabled={!edges.forward} aria-label="التالي">
            <ChevronLeft size={18} />
          </button>
        </div>
      </header>
      <div className={`home-row${wide ? ' home-row--wide' : ''}${tiles ? ' home-row--tiles' : ''}${outlined ? ' home-row--outlined' : ''}`} ref={row} onScroll={measure}>{children}</div>
    </section>
  );
}

/** Each category's mark, beside its name */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  hussainiya_poems: Feather,
  naei: Droplets,
  muwalid: Sparkles,
  dua: HandHeart,
  ziyarat: Landmark,
  quran: BookOpen,
  nasheed: Music,
  lectures: Mic,
  variety: Shapes,
};

/**
 * The categories, two rows of four, the rest a scroll away. The row fills
 * column by column, so they go in as pairs (the first with the fifth, the
 * second with the sixth...) for the top row to read on from the first.
 */
const TILE_ORDER = (() => {
  const ordered: typeof CATEGORY_LIST = [];
  for (let page = 0; page < CATEGORY_LIST.length; page += 8) {
    for (let i = 0; i < 4; i++) {
      for (const at of [page + i, page + 4 + i]) if (CATEGORY_LIST[at]) ordered.push(CATEGORY_LIST[at]);
    }
  }
  return ordered;
})();

export function CategoryTiles() {
  return (
    <Shelf title="الأقسام" tiles>
      {TILE_ORDER.map(c => {
        const Icon = CATEGORY_ICONS[c.id] ?? Shapes;
        return (
          <Link key={c.id} href={`/category/${c.id}`} prefetch={false} className="home-category" style={{ '--tile': c.color } as React.CSSProperties}>
            <span className="home-category-icon" aria-hidden="true"><Icon size={26} /></span>
            {c.title}
          </Link>
        );
      })}
    </Shelf>
  );
}

const COLUMNS_SHOWN = 15;

/**
 * Tracks in three columns of rows, as the recent and most listened ones show:
 * a click on a row plays it and goes on through the rest; the title opens its
 * page, the reciter theirs. `listens` overrides the counts the tracks carry.
 */
export function TrackColumns({ id, title, href, tracks, listens = {} }: {
  id: string;
  title: string;
  href?: string;
  tracks: (DbAudioTrack | Track)[];
  listens?: Record<string, number>;
}) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const shown = tracks.slice(0, COLUMNS_SHOWN).map(t => getTrackData(t));
  const queue = shown.filter(t => t.audioUrl);

  const play = (track: Track) => {
    if (currentTrack?.id == track.id) togglePlayPause();
    else if (track.audioUrl) playQueue(queue, Math.max(0, queue.findIndex(t => t.id == track.id)));
  };

  return (
    <section className="home-shelf" aria-labelledby={id}>
      <header className="home-shelf-header">
        <h2 id={id}>{title}</h2>
        {href ? <Link href={href} prefetch={false} className="home-show-all">عرض الكل</Link> : null}
      </header>
      <ol className="home-recent">
        {shown.map((track, i) => {
          const current = currentTrack?.id == track.id;
          const playing = current && isPlaying;
          const count = listens[track.id] ?? track.plays;
          return (
            <li
              key={`${track.id}-${i}`}
              className={`home-recent-item${current ? ' is-current' : ''}`}
              onClick={e => { if (!(e.target as HTMLElement).closest('a, button')) play(track); }}
            >
              <button
                type="button"
                className="home-recent-cover"
                onClick={() => play(track)}
                disabled={!track.audioUrl}
                aria-label={playing ? `إيقاف ${track.title}` : `تشغيل ${track.title}`}
              >
                <img src={thumb(track.imageUrl, 96)} alt="" width={48} height={48} loading="lazy" decoding="async" />
                <span className="home-recent-play" aria-hidden="true">
                  {playing ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" strokeWidth={0} />}
                </span>
              </button>
              <span className="home-recent-text">
                <Link href={`/track?id=${track.id}`} prefetch={false} className="home-recent-title">{track.title}</Link>
                {track.reciterId
                  ? <Link href={`/reciter?id=${track.reciterId}`} prefetch={false} className="home-recent-sub">{track.artist}</Link>
                  : <span className="home-recent-sub">{track.artist}</span>}
              </span>
              <span className="home-recent-count">{count != null ? countOf(count, LISTENS) : ''}</span>
              <TrackContextMenu track={track} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * The listener's own recent tracks (kept in their browser). Their listen
 * counts are asked for afresh: the ones kept are from when they were played.
 */
export function RecentTracks({ tracks }: { tracks: Track[] }) {
  const ids = tracks.slice(0, COLUMNS_SHOWN).map(t => String(t.id)).join(',');
  const [listens, setListens] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!ids) return;
    let live = true;
    supabase.from('audio_library').select('id,listen_count').in('id', ids.split(','))
      .then(({ data }) => {
        if (live && data) setListens(Object.fromEntries(data.map(r => [String(r.id), Number(r.listen_count) || 0])));
      });
    return () => { live = false; };
  }, [ids]);

  return <TrackColumns id="home-recent" title="تم الاستماع إليه مؤخراً" tracks={tracks} listens={listens} />;
}

/** A short list of tracks, each one click from playing; play goes on through `queue`. */
export function QuickTracks({ tracks, queue = tracks, label }: { tracks: Track[]; queue?: Track[]; label: string }) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  return (
    <ol className="quick-tracks" aria-label={label}>
      {tracks.map(t => {
        const current = t.id == currentTrack?.id;
        const play = () => (current ? togglePlayPause() : playQueue(queue, Math.max(0, queue.findIndex(q => q.id == t.id))));
        return (
          <li key={t.id}>
            <button type="button" className={`quick-track${current ? ' is-current' : ''}`} onClick={play}>
              <img src={thumb(t.imageUrl, 96)} alt="" width={44} height={44} loading="lazy" decoding="async" />
              <span className="quick-track-text">
                <span className="quick-track-title">{t.title}</span>
                <span className="quick-track-sub">{t.artist}</span>
              </span>
              <span className="quick-track-icon" aria-hidden="true">
                {current && isPlaying ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" strokeWidth={0} />}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
