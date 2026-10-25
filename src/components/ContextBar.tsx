"use client";

// The panel beside the page while something plays: what is playing and who
// recites it, or the queue. Opened and closed from the player's buttons.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Pause, Play, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer, Track } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { thumb } from '@/utils/image';
import { countOf, TRACKS } from '@/utils/plural';
import './context-bar.css';

type Reciter = { id: string; name: string; image: string; count: number | null };

/** The reciter of the track playing: photo, name and how many tracks they have. */
function useReciter(reciterId?: string): Reciter | null {
  const [reciter, setReciter] = useState<Reciter | null>(null);
  useEffect(() => {
    setReciter(null);
    if (!reciterId) return;
    let live = true;
    Promise.all([
      supabase.from('reciters').select('id,name,image_url').eq('id', reciterId).maybeSingle(),
      supabase.from('audio_library').select('id', { count: 'exact', head: true }).eq('reciter_id', reciterId),
    ]).then(([r, c]) => {
      if (live && r.data) setReciter({ id: String(r.data.id), name: r.data.name, image: r.data.image_url || '', count: c.count ?? null });
    });
    return () => { live = false; };
  }, [reciterId]);
  return reciter;
}

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
  const reciter = useReciter(currentTrack?.reciterId);

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

      {reciter ? (
        <Link href={`/reciter?id=${reciter.id}`} prefetch={false} className="panel-card panel-reciter">
          <img src={thumb(reciter.image || currentTrack.imageUrl || '/cover-placeholder.svg', 160)} alt="" width={64} height={64} />
          <span className="panel-reciter-text">
            <span className="panel-reciter-name">{reciter.name}</span>
            <span className="panel-reciter-sub">
              {reciter.count != null ? `${countOf(reciter.count, TRACKS)} على المنصة` : 'صفحة الرادود'}
            </span>
          </span>
        </Link>
      ) : null}

      {upNext.length > 0 ? (
        <section className="panel-card" aria-labelledby="panel-next">
          <header className="panel-card-head">
            <h3 id="panel-next">التالي</h3>
            <button type="button" onClick={toggleQueue}>قائمة الانتظار</button>
          </header>
          <UpNext tracks={upNext.slice(0, 3)} />
        </section>
      ) : null}
    </aside>
  );
}
