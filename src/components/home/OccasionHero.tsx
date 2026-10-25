"use client";

// The homepage opens with the hijri year's occasion, as the phone app does:
// today's (or one coming within ten days), its words, and the tracks it plays.
// The date is the visitor's, so all of this is worked out in the browser; the
// page built at deploy time keeps the space for it.

import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { currentOccasion, hijriLabel, occasionTracks, OccasionNow } from '@/lib/occasions';
import { Track } from '@/types';
import { QuickTracks } from './HomeParts';

type State =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; now: OccasionNow; tracks: Track[] };

const inDaysLabel = (n: number) => (n === 1 ? 'غداً' : n === 2 ? 'بعد يومين' : `بعد ${n} أيام`);

export default function OccasionHero() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  useEffect(() => {
    const now = currentOccasion();
    if (!now) {
      setState({ status: 'none' });
      return;
    }
    occasionTracks(now.occasion)
      .then(rows => setState({ status: 'ready', now, tracks: rows.map(getTrackData).filter(t => t.audioUrl) }))
      .catch(() => setState({ status: 'ready', now, tracks: [] }));
  }, []);

  if (state.status === 'none') return null;
  if (state.status === 'loading') return <div className="hero-frame"><section className="occasion occasion--loading" aria-hidden="true" /></div>;

  const { now, tracks } = state;
  const { occasion, date, inDays } = now;
  const playingHere = isPlaying && tracks.some(t => t.id == currentTrack?.id);
  const playAll = () => (playingHere ? togglePlayPause() : playQueue(tracks, 0));

  return (
    <div className="hero-frame">
    <section className={`occasion occasion--${occasion.kind}`} aria-labelledby="occasion-title">
      {tracks[0] ? <img className="occasion-backdrop" src={thumb(tracks[0].imageUrl, 640)} alt="" aria-hidden="true" /> : null}
      <div className="occasion-text">
        <p className="occasion-date">
          {inDays === 0 ? hijriLabel(date) : `${hijriLabel(date)}، ${inDaysLabel(inDays)}`}
        </p>
        <h2 id="occasion-title" className="occasion-title">
          {occasion.title}
          {occasion.honor ? <span className="occasion-honor"> {occasion.honor}</span> : null}
        </h2>
        <p className="occasion-line">
          {occasion.line.split('\n').map((part, i) => <React.Fragment key={i}>{i > 0 ? <br /> : null}{part}</React.Fragment>)}
        </p>
        {tracks.length > 0 ? (
          <button type="button" className="btn-gold occasion-play" onClick={playAll}>
            {playingHere ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
            {playingHere ? 'إيقاف' : 'استمع إلى المناسبة'}
          </button>
        ) : null}
      </div>
      {tracks.length > 0 ? (
        <QuickTracks tracks={tracks.slice(0, 5)} queue={tracks} label={`مقاطع ${occasion.title}`} />
      ) : null}
    </section>
    </div>
  );
}
