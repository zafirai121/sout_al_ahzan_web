"use client";

// The homepage's building blocks: shelves of tracks and reciters, the
// categories, and the listener's own recent tracks. Every card is a real link
// (search engines follow it) and covers are asked for at the size they show.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getReciterData, getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { CATEGORY_LIST } from '@/utils/categories';
import TrackContextMenu from '@/components/TrackContextMenu';
import { DbAudioTrack, DbReciter, Track } from '@/types';

/** Plays a track, or pauses it if it is the one playing. */
function usePlayToggle() {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  return {
    isPlayingNow: (track: Track) => currentTrack?.id == track.id && isPlaying,
    toggle: (track: Track) => {
      if (currentTrack?.id == track.id) togglePlayPause();
      else if (track.audioUrl) playTrack(track);
    },
  };
}

export function TrackCard({ item }: { item: DbAudioTrack | Track }) {
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
          onClick={() => toggle(track)}
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
export function Shelf({ title, subtitle, href, children }: {
  title: string;
  subtitle?: string;
  href?: string;
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
          <h2>{title}</h2>
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
      <div className="home-row" ref={row} onScroll={measure}>{children}</div>
    </section>
  );
}

export function CategoryTiles() {
  return (
    <section className="home-shelf" aria-labelledby="home-categories">
      <header className="home-shelf-header"><h2 id="home-categories">الأقسام</h2></header>
      <ul className="home-categories">
        {CATEGORY_LIST.map(c => (
          <li key={c.id}>
            <Link href={`/category/${c.id}`} prefetch={false} className="home-category" style={{ '--tile': c.color } as React.CSSProperties}>
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The listener's own recent tracks (kept in their browser): one click plays. */
export function RecentTracks({ tracks }: { tracks: Track[] }) {
  const { isPlayingNow, toggle } = usePlayToggle();
  return (
    <section className="home-shelf" aria-labelledby="home-recent">
      <header className="home-shelf-header"><h2 id="home-recent">تابع الاستماع</h2></header>
      <ul className="home-recent">
        {tracks.slice(0, 6).map((t, i) => {
          const track = getTrackData(t);
          const playing = isPlayingNow(track);
          return (
            <li key={`${track.id}-${i}`}>
              <button type="button" className={`home-recent-item${playing ? ' is-playing' : ''}`} onClick={() => toggle(track)} disabled={!track.audioUrl}>
                <img src={thumb(track.imageUrl, 96)} alt="" width={56} height={56} loading="lazy" decoding="async" />
                <span className="home-recent-text">
                  <span className="home-recent-title">{track.title}</span>
                  <span className="home-recent-sub">{track.artist}</span>
                </span>
                <span className="home-recent-icon" aria-hidden="true">
                  {playing ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
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
