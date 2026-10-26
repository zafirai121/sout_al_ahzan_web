"use client";

// The homepage opens with the hijri calendar, as the phone app does: today's
// occasion and those of the coming two months, one at a time, each drawn in
// its own colours: a mihrab with its name, a lantern for a loss, a star for a
// birth, a crescent for prayer. It moves on every five seconds; it holds
// while the pointer or the keyboard is on it, with its pause button, and for
// visitors who ask for less motion.
// The date is the visitor's, so all of this is worked out in the browser; the
// page built at deploy time keeps the space for it.

import React, { useEffect, useId, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getTrackData } from '@/utils/data_mapper';
import {
  currentOccasion, hijriLabel, inDaysLabel, Occasion, occasionCode, occasionTracks, OccasionNow, upcomingOccasions,
} from '@/lib/occasions';
import { Track } from '@/types';

const MOST = 6;
const EVERY_MS = 5000;
const keyOf = (o: Occasion) => `${o.month}-${o.from}-${o.title}`;

/** Plays the occasion's tracks, fetched the first time it is asked. */
function ListenButton({ occasion, onListen }: { occasion: Occasion; onListen: () => void }) {
  const { playQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'empty'>('idle');
  const playingHere = isPlaying && !!tracks?.some(t => t.id == currentTrack?.id);

  const listen = async () => {
    onListen();
    if (playingHere) return togglePlayPause();
    if (tracks?.length) return playQueue(tracks, 0);
    setState('loading');
    const found = (await occasionTracks(occasion, 20).catch(() => [])).map(getTrackData).filter(t => t.audioUrl);
    setTracks(found);
    setState(found.length ? 'idle' : 'empty');
    if (found.length) playQueue(found, 0);
  };

  return (
    <button type="button" className="btn-gold occasion-play" onClick={listen} disabled={state !== 'idle'}>
      {playingHere ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
      {state === 'loading' ? 'جارٍ التحضير…'
        : state === 'empty' ? 'لم تُرفع مقاطعها بعد'
        : playingHere ? 'إيقاف' : 'استمع إلى المناسبة'}
    </button>
  );
}

/** What hangs in the arch: a lantern for a loss, a star for a birth, a crescent for prayer. */
function Motif({ kind }: { kind: Occasion['kind'] }) {
  if (kind === 'joy') {
    return (
      <g className="occasion-art-motif" transform="translate(180 108)">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="0" y1="-30" x2="0" y2="-44" transform={`rotate(${i * 45 + 22.5})`} />
        ))}
        <rect x="-18" y="-18" width="36" height="36" />
        <rect x="-18" y="-18" width="36" height="36" transform="rotate(45)" />
        <circle r="6" className="occasion-art-light" />
      </g>
    );
  }
  if (kind === 'prayer') {
    return (
      <g className="occasion-art-motif">
        <path d="M194 80 A28 28 0 1 0 194 136 A22 22 0 1 1 194 80 Z" />
        <circle cx="200" cy="92" r="3" className="occasion-art-light" />
      </g>
    );
  }
  return (
    <g className="occasion-art-motif">
      <line x1="180" y1="20" x2="180" y2="74" />
      <path d="M172 74 H188 L184 80 H176 Z" />
      <path d="M168 82 H192 L201 96 V118 L192 132 H168 L159 118 V96 Z" />
      <line x1="180" y1="82" x2="180" y2="132" className="occasion-art-faint" />
      <circle cx="180" cy="107" r="7" className="occasion-art-light" />
    </g>
  );
}

const ARCH = 'M40 320 V150 C40 92 108 48 180 16 C252 48 320 92 320 150 V320';

/**
 * The occasion's own panel: a mihrab standing on the bottom edge, its motif and
 * its name. An occasion with a picture has it filling the mihrab instead of the
 * motif, darker towards the bottom so the name stays clear, the arch drawn over it.
 */
function OccasionArt({ occasion }: { occasion: Occasion }) {
  const name = occasion.words[0];
  const id = useId().replace(/[^\w-]/g, ''); // each slide's own, for url(#...)
  return (
    <svg className="occasion-art" viewBox="0 0 360 320" aria-hidden="true">
      {occasion.image ? (
        <>
          <defs>
            <clipPath id={`${id}-arch`}><path d={`${ARCH} Z`} /></clipPath>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.45" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${id}-arch)`}>
            <image href={occasion.image} x="40" y="16" width="280" height="304" preserveAspectRatio="xMidYMid slice" />
            <rect x="40" y="16" width="280" height="304" fill={`url(#${id}-shade)`} />
          </g>
          <path className="occasion-art-arch is-frame" d={ARCH} />
        </>
      ) : (
        <>
          <path className="occasion-art-arch" d={ARCH} />
          <path className="occasion-art-faint" d="M62 320 V156 C62 106 120 68 180 40 C240 68 298 106 298 156 V320" />
          <Motif kind={occasion.kind} />
        </>
      )}
      <text className="occasion-art-name" x="180" y="250" textAnchor="middle" fontSize={name.length > 6 ? 48 : 60}>
        {name}
      </text>
    </svg>
  );
}

function Slide({ item, active, position, total, onListen }: {
  item: OccasionNow;
  active: boolean;
  position: number;
  total: number;
  onListen: () => void;
}) {
  const { occasion, date, inDays } = item;
  return (
    <div
      className={`occasion-slide occasion-slide--${occasion.kind}${active ? ' is-active' : ''}`}
      role="group"
      aria-roledescription="شريحة"
      aria-label={`${position} من ${total}: ${occasion.title}`}
      aria-hidden={!active}
      inert={!active}
    >
      <span className="occasion-pattern" aria-hidden="true" />
      <OccasionArt occasion={occasion} />
      <div className="occasion-slide-text">
        <p className="occasion-date">
          {inDays === 0 ? hijriLabel(date) : `${hijriLabel(date)}، ${inDaysLabel(inDays)}`}
        </p>
        <h2 className="occasion-title">
          {occasion.title}
          {occasion.honor ? <span className="occasion-honor"> {occasion.honor}</span> : null}
        </h2>
        <p className="occasion-line">
          {occasion.line.split('\n').map((part, i) => <React.Fragment key={i}>{i > 0 ? <br /> : null}{part}</React.Fragment>)}
        </p>
        <ListenButton occasion={occasion} onListen={onListen} />
      </div>
    </div>
  );
}

export default function OccasionBanner() {
  const [items, setItems] = useState<OccasionNow[] | null>(null);
  const [index, setIndex] = useState(0);
  // Held while the pointer or the keyboard is on it; stopped by its button,
  // by listening, or from the start for visitors who ask for less motion
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const now = currentOccasion();
    const coming = upcomingOccasions().filter(o => o.occasion !== now?.occasion);
    let list = [...(now ? [now] : []), ...coming].slice(0, MOST);
    // "/?occasion=11-29" (hijri month-day) shows that occasion first, held,
    // whenever it falls: to see how it looks before its season
    const asked = new URLSearchParams(window.location.search).get('occasion');
    const preview = asked ? upcomingOccasions(new Date(), 366).find(o => occasionCode(o.occasion) === asked) : undefined;
    if (preview) list = [preview, ...list.filter(o => o.occasion !== preview.occasion)].slice(0, MOST);
    setItems(list);
    if (preview || window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStopped(true);
  }, []);

  // Restarted on every change of slide, so a chosen one also gets its five seconds
  useEffect(() => {
    if (!items || items.length < 2 || held || stopped) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % items.length), EVERY_MS);
    return () => window.clearTimeout(timer);
  }, [items, index, held, stopped]);

  if (!items) return <div className="hero-frame"><section className="occasions occasions--loading" aria-hidden="true" /></div>;
  if (items.length === 0) return null;

  return (
    <div className="hero-frame">
      <section
        className="occasions"
        aria-roledescription="عرض متتابع"
        aria-label="المناسبات"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false); }}
      >
        {items.map((item, i) => (
          <Slide
            key={keyOf(item.occasion)}
            item={item}
            active={i === index}
            position={i + 1}
            total={items.length}
            onListen={() => setStopped(true)}
          />
        ))}

        {items.length > 1 ? (
          <div className="occasions-controls">
            <button
              type="button"
              className="occasions-pause"
              onClick={() => setStopped(s => !s)}
              aria-label={stopped ? 'تشغيل التبديل التلقائي' : 'إيقاف التبديل التلقائي'}
              title={stopped ? 'تشغيل التبديل التلقائي' : 'إيقاف التبديل التلقائي'}
            >
              {stopped ? <Play size={14} fill="currentColor" strokeWidth={0} /> : <Pause size={14} fill="currentColor" strokeWidth={0} />}
            </button>
            <div className="occasions-dots">
              {items.map((item, i) => (
                <button
                  key={keyOf(item.occasion)}
                  type="button"
                  className="occasions-dot"
                  aria-current={i === index ? 'true' : undefined}
                  aria-label={`${item.occasion.title}، ${item.inDays === 0 ? 'اليوم' : inDaysLabel(item.inDays)}`}
                  title={item.occasion.title}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
