"use client";

// The homepage opens with the hijri calendar, as the phone app does: today's
// occasion (or the nearest coming one), its words and its tracks; along the
// bottom, the occasions of the coming two months, and choosing one shows it.
// The date is the visitor's, so all of this is worked out in the browser; the
// page built at deploy time keeps the space for it.

import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import {
  currentOccasion, hijriLabel, hijriMonthName, inDaysLabel, Occasion, occasionTracks, OccasionNow, upcomingOccasions,
} from '@/lib/occasions';
import { Track } from '@/types';
import { QuickTracks } from './HomeParts';

const MOST = 6;
const keyOf = (o: Occasion) => `${o.month}-${o.from}-${o.title}`;

export default function OccasionBanner() {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const [items, setItems] = useState<OccasionNow[] | null>(null);
  const [chosen, setChosen] = useState(0);
  // Each occasion's tracks, fetched the first time it is shown
  const [tracks, setTracks] = useState<Record<string, Track[] | 'loading'>>({});

  useEffect(() => {
    const now = currentOccasion();
    const coming = upcomingOccasions().filter(o => o.occasion !== now?.occasion);
    setItems([...(now ? [now] : []), ...coming].slice(0, MOST));
  }, []);

  const item = items?.[chosen];
  const key = item ? keyOf(item.occasion) : '';
  useEffect(() => {
    if (!item || tracks[key]) return;
    setTracks(t => ({ ...t, [key]: 'loading' }));
    occasionTracks(item.occasion)
      .then(rows => rows.map(getTrackData).filter(t => t.audioUrl))
      .catch(() => [] as Track[])
      .then(list => setTracks(t => ({ ...t, [key]: list })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!items) return <div className="hero-frame"><section className="occasion occasion--loading" aria-hidden="true" /></div>;
  if (!item) return null;

  const { occasion, date, inDays } = item;
  const found = tracks[key];
  const list = Array.isArray(found) ? found : [];
  const playingHere = isPlaying && list.some(t => t.id == currentTrack?.id);
  const playAll = () => (playingHere ? togglePlayPause() : playQueue(list, 0));

  return (
    <div className="hero-frame">
      <section className={`occasion occasion--${occasion.kind}`} aria-labelledby="occasion-title">
        {list[0] ? <img className="occasion-backdrop" src={thumb(list[0].imageUrl, 640)} alt="" aria-hidden="true" /> : null}

        <div className="occasion-main" aria-live="polite">
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
            {found === 'loading' || found === undefined ? null : list.length > 0 ? (
              <button type="button" className="btn-gold occasion-play" onClick={playAll}>
                {playingHere ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
                {playingHere ? 'إيقاف' : 'استمع إلى المناسبة'}
              </button>
            ) : (
              <p className="occasion-none">لم تُرفع مقاطع لهذه المناسبة بعد.</p>
            )}
          </div>
          {found === 'loading' || found === undefined ? (
            <div className="occasion-tracks-loading" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => <span key={i} />)}
            </div>
          ) : list.length > 0 ? (
            <QuickTracks tracks={list.slice(0, 5)} queue={list} label={`مقاطع ${occasion.title}`} />
          ) : null}
        </div>

        {items.length > 1 ? (
          <div className="occasion-tabs" role="group" aria-label="المناسبات القادمة">
            {items.map((o, i) => (
              <button
                key={keyOf(o.occasion)}
                type="button"
                className={`occasion-tab occasion-tab--${o.occasion.kind}`}
                aria-pressed={i === chosen}
                onClick={() => setChosen(i)}
              >
                <span className="occasion-tab-date">
                  <span className="occasion-tab-day">{o.date.day}</span>
                  <span className="occasion-tab-month">{hijriMonthName(o.date.month)}</span>
                </span>
                <span className="occasion-tab-title">{o.occasion.title}</span>
                <span className="occasion-tab-when">{o.inDays === 0 ? 'اليوم' : inDaysLabel(o.inDays)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
