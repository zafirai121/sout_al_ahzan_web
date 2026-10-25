"use client";

// The player along the bottom of every page: what is playing (its title and
// reciter open their pages), the controls and the time, and on the far side
// download, the side panels and the volume. The keyboard's space bar and the
// computer's own media keys and controls work it too.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CircleArrowDown, Heart, ListMusic, LoaderCircle, Pause, Play, Repeat, Shuffle,
  SkipBack, SkipForward, SquarePlay, Volume1, Volume2, VolumeX,
} from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { downloadTrack } from '@/utils/download';
import { thumb } from '@/utils/image';
import { countOf, MINUTES, SECONDS } from '@/utils/plural';
import './player.css';

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

// The time for screen readers: "3 دقائق و12 ثانية"
const spoken = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (!m) return countOf(s, SECONDS);
  return rest ? `${countOf(m, MINUTES)} و${countOf(rest, SECONDS)}` : countOf(m, MINUTES);
};

/** A native slider (keyboard and screen readers work), filled from the left. */
function Slider({ value, max, label, valueText, onInput, onCommit, className = '' }: {
  value: number;
  max: number;
  label: string;
  valueText?: string;
  onInput: (value: number) => void;
  onCommit?: () => void;
  className?: string;
}) {
  const fill = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <input
      type="range"
      className={`player-range ${className}`}
      min={0}
      max={max || 1}
      step="any"
      value={Math.min(value, max || 1)}
      onChange={e => onInput(Number(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      aria-label={label}
      aria-valuetext={valueText}
      style={{ '--fill': `${fill}%` } as React.CSSProperties}
    />
  );
}

export default function PlayerBar() {
  const player = usePlayer();
  const {
    currentTrack, isPlaying, togglePlayPause, setPlaying, toggleShuffle, isShuffle,
    playPrevious, playNext, activeQueue, toggleRepeat, isRepeat, contextView,
    toggleNowPlaying, toggleQueue, duration, audioRef, volume, isMuted, seekTo, setVolume, setIsMuted,
  } = player;
  const { toggleLike, isLiked } = usePlaylists();

  const [time, setTime] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState('');

  // The audio element tells the time a few times a second: enough for a bar
  // this wide, and the page is not redrawn 60 times a second for it
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => setTime(audio.currentTime);
    const start = () => { setFailed(false); setBuffering(true); setTime(0); };
    const wait = () => setBuffering(true);
    const ready = () => setBuffering(false);
    const fail = () => { if (audio.getAttribute('src')) { setBuffering(false); setFailed(true); } };
    const events: [string, () => void][] = [
      ['timeupdate', tick], ['seeked', tick], ['loadstart', start], ['waiting', wait],
      ['playing', ready], ['canplay', ready], ['pause', ready], ['error', fail],
    ];
    events.forEach(([name, fn]) => audio.addEventListener(name, fn));
    tick();
    return () => events.forEach(([name, fn]) => audio.removeEventListener(name, fn));
    // The element is made by the provider, after this component's first effects
  }, [audioRef, currentTrack?.id]);

  // The computer's own media keys and the system's "now playing" controls
  const latest = useRef(player);
  latest.current = player;
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    const art = currentTrack.imageUrl ? thumb(currentTrack.imageUrl, 512) : undefined;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: 'صوت الأحزان',
      artwork: art ? [{ src: art, sizes: '512x512' }] : [],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => latest.current.setPlaying(true)],
      ['pause', () => latest.current.setPlaying(false)],
      ['previoustrack', () => latest.current.playPrevious()],
      ['nexttrack', () => latest.current.playNext()],
      ['seekto', d => { if (d.seekTime != null) latest.current.seekTo(d.seekTime); }],
    ];
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* not offered here */ }
    }
  }, [currentTrack]);
  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = currentTrack ? (isPlaying ? 'playing' : 'paused') : 'none';
  }, [isPlaying, currentTrack]);

  // Space plays and pauses, unless typing or on a control that space presses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"], [role="slider"]')) return;
      if (!latest.current.currentTrack) return;
      e.preventDefault();
      latest.current.togglePlayPause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote(n => (n === text ? '' : n)), 4000);
  };

  if (!currentTrack) {
    return (
      <footer className="player player--empty">
        <p>اختر قصيدة لتبدأ الاستماع</p>
      </footer>
    );
  }

  const shown = scrub ?? time;
  const liked = isLiked(currentTrack.id);
  const at = activeQueue.findIndex(t => t.id === currentTrack.id);
  const hasNext = isRepeat ? activeQueue.length > 1 : at >= 0 && at < activeQueue.length - 1;
  const hasPrevious = activeQueue.length > 1;
  const level = isMuted ? 0 : volume;
  const reciterHref = currentTrack.reciterId
    ? `/reciter?id=${currentTrack.reciterId}`
    : `/search?q=${encodeURIComponent(currentTrack.artist)}`;

  const commitScrub = () => {
    if (scrub == null) return;
    seekTo(scrub);
    setTime(scrub);
    setScrub(null);
  };
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    setNote('جارٍ التنزيل…');
    const result = await downloadTrack(currentTrack.audioUrl, `${currentTrack.title} - ${currentTrack.artist}`);
    setDownloading(false);
    say(result === 'SUCCESS' ? 'نُزّل المقطع' : 'فُتح المقطع في نافذة جديدة لتنزيله منها');
  };

  return (
    <footer className="player" aria-label="المشغّل">
      <div className="player-now">
        <Link href={`/track?id=${currentTrack.id}`} prefetch={false} className="player-cover" tabIndex={-1} aria-hidden="true">
          <img src={thumb(currentTrack.imageUrl || '/cover-placeholder.svg', 112)} alt="" width={56} height={56} />
        </Link>
        <div className="player-text">
          <Link href={`/track?id=${currentTrack.id}`} prefetch={false} className="player-title">{currentTrack.title}</Link>
          <Link href={reciterHref} prefetch={false} className="player-artist">{currentTrack.artist}</Link>
        </div>
        <button
          type="button"
          className={`player-btn${liked ? ' is-on' : ''}`}
          onClick={() => toggleLike(currentTrack)}
          aria-pressed={liked}
          aria-label={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
          title={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="player-center">
        {/* Left to right, as in every music player (and the phone app) */}
        <div className="player-controls" dir="ltr">
          <button type="button" className={`player-btn${isShuffle ? ' is-on' : ''}`} onClick={toggleShuffle} aria-pressed={isShuffle} aria-label="تشغيل عشوائي" title="تشغيل عشوائي">
            <Shuffle size={18} />
          </button>
          <button type="button" className="player-btn" onClick={playPrevious} disabled={!hasPrevious} aria-label="السابق" title="السابق">
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            type="button"
            className={`player-play${buffering && isPlaying ? ' is-buffering' : ''}`}
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            title={isPlaying ? 'إيقاف مؤقت (مسافة)' : 'تشغيل (مسافة)'}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
          </button>
          <button type="button" className="player-btn" onClick={playNext} disabled={!hasNext} aria-label="التالي" title="التالي">
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button type="button" className={`player-btn${isRepeat ? ' is-on' : ''}`} onClick={toggleRepeat} aria-pressed={isRepeat} aria-label="تكرار القائمة" title="تكرار القائمة">
            <Repeat size={18} />
          </button>
        </div>
        <div className="player-progress" dir="ltr">
          <span className="player-time">{clock(shown)}</span>
          <Slider
            className="player-seek"
            value={shown}
            max={duration}
            label="موضع التشغيل"
            valueText={`${spoken(shown)} من ${spoken(duration)}`}
            onInput={v => setScrub(v)}
            onCommit={commitScrub}
          />
          <span className="player-time">{clock(duration)}</span>
        </div>
        <p className="player-status" role="status">
          {failed ? 'تعذّر تشغيل هذا المقطع. جرّب مقطعاً آخر أو أعد المحاولة لاحقاً.' : note}
        </p>
      </div>

      <div className="player-extras">
        <button type="button" className="player-btn" onClick={download} disabled={downloading} aria-label="تنزيل المقطع" title="تنزيل المقطع">
          {downloading ? <LoaderCircle size={18} className="player-spin" /> : <CircleArrowDown size={18} />}
        </button>
        <button type="button" className={`player-btn${contextView === 'now-playing' ? ' is-on' : ''}`} onClick={toggleNowPlaying} aria-pressed={contextView === 'now-playing'} aria-label="لوحة المقطع الحالي" title="لوحة المقطع الحالي">
          <SquarePlay size={18} />
        </button>
        <button type="button" className={`player-btn${contextView === 'queue' ? ' is-on' : ''}`} onClick={toggleQueue} aria-pressed={contextView === 'queue'} aria-label="قائمة الانتظار" title="قائمة الانتظار">
          <ListMusic size={18} />
        </button>
        <div className="player-volume" dir="ltr">
          <button type="button" className="player-btn" onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'} title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}>
            {level === 0 ? <VolumeX size={18} /> : level < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
          </button>
          <Slider
            className="player-level"
            value={level}
            max={1}
            label="مستوى الصوت"
            valueText={`${Math.round(level * 100)}٪`}
            onInput={v => { setVolume(v); if (v > 0 && isMuted) setIsMuted(false); }}
          />
        </div>
      </div>
    </footer>
  );
}
