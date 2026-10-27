"use client";

// The panel beside the page while something plays: what is playing, and under
// it what the phone app shows under its player (the words, the reciter, the
// credits, more of their work, similar tracks, what plays next); or the queue.
// Opened and closed from the player's buttons.

import React from 'react';
import Link from 'next/link';
import { Heart, Pause, Play, Radio, X } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { thumb } from '@/utils/image';
import { PanelAbout, PanelCredits, PanelExplore, PanelLyrics, PanelSimilar, useExtras } from '@/components/PanelExtras';
import './context-bar.css';

/** Tracks in the queue: a click plays one there, the queue stays as it is. */
function UpNext({ tracks }: { tracks: Track[] }) {
  const { playTrack } = usePlayer();
  return (
    <ol className="panel-tracks">
      {tracks.map((t, i) => (
        <li key={`${t.id}-${i}`}>
          <button type="button" className="panel-track" onClick={() => playTrack(t)}>
            <img src={thumb(t.imageUrl || '/cover-placeholder.svg', 96)} alt="" width={44} height={44} loading="lazy" decoding="async" />
            <span className="panel-track-text">
              <span className="panel-track-title">{t.title}</span>
              <span className="panel-track-sub">{t.artist}</span>
            </span>
            <Play size={14} fill="currentColor" strokeWidth={0} className="panel-track-icon" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function ContextBar() {
  const { currentTrack, activeQueue, isShuffle, isRepeat, isPlaying, togglePlayPause, contextView, toggleNowPlaying, toggleQueue } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  const extras = useExtras(currentTrack);

  // ContextBarWrapper only renders this while a track is loaded
  if (!contextView || !currentTrack) return null;

  const at = activeQueue.findIndex(t => t.id === currentTrack.id);
  const after = at >= 0 ? activeQueue.slice(at + 1) : [];
  const upNext = after.length === 0 && isRepeat ? activeQueue.filter(t => t.id !== currentTrack.id) : after;
  const liked = isLiked(currentTrack.id);
  const trackHref = `/track?id=${currentTrack.id}`;

  if (contextView === 'queue') {
    return (
      <aside className="context-sidebar now-panel" aria-labelledby="panel-title">
        <header className="panel-head">
          <h2 id="panel-title">قائمة الانتظار</h2>
          <button type="button" className="panel-close" onClick={toggleQueue} aria-label="إغلاق قائمة الانتظار" title="إغلاق">
            <X size={20} />
          </button>
        </header>

        <h3 className="panel-label">يُشغَّل الآن</h3>
        <button type="button" className="panel-track is-current" onClick={togglePlayPause}>
          <img src={thumb(currentTrack.imageUrl || '/cover-placeholder.svg', 96)} alt="" width={44} height={44} />
          <span className="panel-track-text">
            <span className="panel-track-title">{currentTrack.title}</span>
            <span className="panel-track-sub">{currentTrack.artist}</span>
          </span>
          {isPlaying
            ? <Pause size={14} fill="currentColor" strokeWidth={0} className="panel-track-icon" aria-label="إيقاف مؤقت" />
            : <Play size={14} fill="currentColor" strokeWidth={0} className="panel-track-icon" aria-label="تشغيل" />}
        </button>

        <h3 className="panel-label">
          التالي{upNext.length ? ` (${upNext.length})` : ''}
          {isShuffle && upNext.length ? <span>بترتيب عشوائي</span> : null}
        </h3>
        {upNext.length > 0 ? (
          <UpNext tracks={upNext} />
        ) : (
          <p className="panel-empty">لا شيء بعد هذا المقطع. أضف مقاطع من زر الخيارات (⋮) بجانب أي مقطع.</p>
        )}
      </aside>
    );
  }

  return (
    <aside className="context-sidebar now-panel" aria-labelledby="panel-title">
      <header className="panel-head">
        <h2 id="panel-title">يُشغَّل الآن</h2>
        <button type="button" className="panel-close" onClick={toggleNowPlaying} aria-label="إغلاق اللوحة" title="إغلاق">
          <X size={20} />
        </button>
      </header>

      <Link href={trackHref} prefetch={false} className="panel-cover" tabIndex={-1} aria-hidden="true">
        <img src={thumb(currentTrack.imageUrl || '/cover-placeholder.svg', 640)} alt="" />
      </Link>

      <div className="panel-now">
        <div className="panel-now-text">
          <Link href={trackHref} prefetch={false} className="panel-now-title">{currentTrack.title}</Link>
          {currentTrack.reciterId
            ? <Link href={`/reciter?id=${currentTrack.reciterId}`} prefetch={false} className="panel-now-artist">{currentTrack.artist}</Link>
            : <span className="panel-now-artist">{currentTrack.artist}</span>}
        </div>
        <button
          type="button"
          className={`panel-like${liked ? ' is-on' : ''}`}
          onClick={() => toggleLike(currentTrack)}
          aria-pressed={liked}
          aria-label={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
          title={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
        >
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {extras ? (
        <>
          {extras.lyrics ? <PanelLyrics track={currentTrack} lyrics={extras.lyrics} /> : null}
          <PanelAbout extras={extras} fallbackImage={currentTrack.imageUrl} />
          <PanelCredits extras={extras} artist={currentTrack.artist} />
          <PanelExplore extras={extras} />
          <PanelSimilar extras={extras} />
        </>
      ) : (
        <div className="panel-card panel-loading" aria-hidden="true" />
      )}

      <section className="panel-card" aria-labelledby="panel-next">
        <header className="panel-card-head">
          <h3 id="panel-next">التالي في قائمة الانتظار</h3>
          {upNext.length > 0 ? <button type="button" onClick={toggleQueue}>عرض الكل</button> : null}
        </header>
        {upNext.length > 0 ? (
          <UpNext tracks={upNext.slice(0, 5)} />
        ) : (
          <p className="panel-empty">لا توجد مقاطع تالية في القائمة.</p>
        )}
        {extras?.reciter ? (
          <Link href={`/radio?ids=${extras.reciter.id}`} prefetch={false} className="panel-chip">
            <Radio size={16} aria-hidden="true" /> شغّل راديو {extras.reciter.name}
          </Link>
        ) : null}
      </section>
    </aside>
  );
}
