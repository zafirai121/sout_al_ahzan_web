"use client";

// A numbered list of tracks, as on the reciter and search pages. A click on a
// row plays it, and play goes on through `queue`; its title opens its page.

import React from 'react';
import Link from 'next/link';
import { Clock3, Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import TrackContextMenu from '@/components/TrackContextMenu';
import { Track } from '@/types';
import './track-rows.css';

export type TrackRow = {
  track: Track;
  /** Under the title */
  sub?: React.ReactNode;
  /** The column between the title and the duration */
  aside?: React.ReactNode;
};

export default function TrackRows({ rows, queue, asideTitle }: { rows: TrackRow[]; queue: Track[]; asideTitle: string }) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const play = (track: Track) => {
    if (track.id == currentTrack?.id) togglePlayPause();
    else if (track.audioUrl) playQueue(queue, Math.max(0, queue.findIndex(t => t.id == track.id)));
  };

  return (
    <>
      <div className="track-rows-head" aria-hidden="true">
        <span>#</span>
        <span className="track-rows-head-title">العنوان</span>
        <span>{asideTitle}</span>
        <span className="track-row-time"><Clock3 size={16} /></span>
        <span />
      </div>
      <ol className="track-rows">
        {rows.map(({ track, sub, aside }, i) => {
          const current = track.id == currentTrack?.id;
          const playing = current && isPlaying;
          return (
            <li
              key={track.id}
              className={`track-row${current ? ' is-current' : ''}`}
              onClick={ev => { if (!(ev.target as HTMLElement).closest('a, button, select')) play(track); }}
            >
              <button
                type="button"
                className="track-row-index"
                onClick={() => play(track)}
                disabled={!track.audioUrl}
                aria-label={playing ? `إيقاف ${track.title}` : `تشغيل ${track.title}`}
              >
                <span className="track-row-number">
                  {playing ? (
                    <span className="audio-visualizer playing"><span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" /></span>
                  ) : i + 1}
                </span>
                <span className="track-row-play" aria-hidden="true">
                  {playing ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" strokeWidth={0} />}
                </span>
              </button>
              <img className="track-row-cover" src={thumb(track.imageUrl, 96)} alt="" width={44} height={44} loading="lazy" decoding="async" />
              <span className="track-row-text">
                <Link href={`/track?id=${track.id}`} prefetch={false} className="track-row-title">{track.title}</Link>
                <span className="track-row-sub">{sub}</span>
              </span>
              <span className="track-row-aside">{aside}</span>
              <span className="track-row-time">{formatDuration(track.duration)}</span>
              <TrackContextMenu track={track} />
            </li>
          );
        })}
      </ol>
    </>
  );
}
