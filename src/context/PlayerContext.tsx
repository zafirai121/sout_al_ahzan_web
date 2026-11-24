"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MAX_ATTEMPTS, retryDelay, shouldRetry, STALL_MS } from '@/lib/audio_recovery';

// Same counter the Flutter app bumps (Supabase RPC increment_listens)
const recordListen = (trackId: string) => {
  const rowId = Number(trackId);
  if (!Number.isInteger(rowId)) return;
  supabase.rpc('increment_listens', { row_id: rowId }).then(({ error }) => {
    if (error) console.warn('increment_listens failed:', error.message);
  });
};

export interface Track {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl: string;
  reciterId?: string;
}

// The database gives ids as numbers, the pages as text: one form, so the same
// track is never two (twice in the recent list, or "not playing" while it plays)
const asTrack = (t: Track): Track => ({ ...t, id: String(t.id) });

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  recentTracks: Track[];
  /** The recent tracks have been read from the browser (there may be none) */
  recentLoaded: boolean;
  /** Forgets what the listener heard (this browser's history) */
  clearRecent: () => void;
  activeQueue: Track[];
  isShuffle: boolean;
  isRepeat: boolean;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  isMuted: boolean;
  playTrack: (track: Track) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setPlaying: (playing: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  contextView: 'now-playing' | 'queue' | null;
  toggleNowPlaying: () => void;
  toggleQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([]);
  const [contextView, setContextView] = useState<'now-playing' | 'queue' | null>('now-playing');

  // Audio state — lives in context so it survives navigation
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Load recent tracks from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sout_recent_tracks');
      // Older visits kept some ids as numbers, and some tracks without their
      // sound (they can't be played again): one of each, the ones that play
      if (stored) {
        const seen = new Set<string>();
        setRecentTracks((JSON.parse(stored) as Track[]).map(asTrack).filter(t => {
          if (!t.audioUrl || seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        }));
      }
    } catch (e) {}
    setRecentLoaded(true);
  }, []);

  const addToRecent = (track: Track) => {
    setRecentTracks(prev => {
      const filtered = prev.filter(t => String(t.id) !== track.id);
      const newRecent = [track, ...filtered].slice(0, 30); // Keep last 30
      try {
        localStorage.setItem('sout_recent_tracks', JSON.stringify(newRecent));
      } catch (e) {}
      return newRecent;
    });
  };

  const clearRecent = () => {
    setRecentTracks([]);
    try {
      localStorage.removeItem('sout_recent_tracks');
    } catch (e) {}
  };

  // Store the latest playNext function
  const playNextRef = useRef<(() => void) | null>(null);

  // A listen is counted once per track, the first time its audio actually
  // starts playing (pause/resume of the same track doesn't count again)
  const currentTrackRef = useRef<Track | null>(null);
  const countedTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    countedTrackIdRef.current = null;
  }, [currentTrack]);

  // A track whose connection dropped before its end (lib/audio_recovery.ts): where
  // it was, whether it must be asked for again, and the tries so far. Asking again
  // is the same track, so its listen is not counted twice (countedTrackIdRef)
  const isPlayingRef = useRef(false);
  const recovery = useRef({
    position: 0, // seconds reached (kept while the element is reloaded)
    resumeAt: null as number | null, // where to go back to once the file is read again
    started: false, // it played at all (a file that never could is not asked for again)
    broken: false, // stopped by the connection: play and seek read the file again
    attempts: 0,
    retryTimer: 0,
    stallTimer: 0,
    reload: null as (() => void) | null,
  });
  const clearRecoveryTimers = () => {
    const r = recovery.current;
    window.clearTimeout(r.retryTimer);
    window.clearTimeout(r.stallTimer);
    r.retryTimer = 0;
    r.stallTimer = 0;
  };

  // Create the audio element once and keep it for the app lifetime
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;
    const r = recovery.current;

    // The same file asked for again (a new connection), from where it was
    const reload = () => {
      const track = currentTrackRef.current;
      if (!track) return;
      clearRecoveryTimers();
      r.broken = false;
      r.resumeAt = r.position;
      audio.src = track.audioUrl;
      audio.load();
      if (isPlayingRef.current) audio.play().catch(() => {});
    };
    r.reload = reload;

    // Stopped by the connection: tried again after a growing wait while they
    // still want it playing; paused, it is read again when they press play
    const recover = () => {
      clearRecoveryTimers();
      r.broken = true;
      if (!isPlayingRef.current) return;
      if (r.attempts >= MAX_ATTEMPTS) {
        setIsPlaying(false); // the play button again, to try once more
        return;
      }
      r.retryTimer = window.setTimeout(() => {
        r.retryTimer = 0;
        // Offline: tried as soon as the connection is back (below)
        if (navigator.onLine !== false) reload();
      }, retryDelay(r.attempts++));
    };

    audio.addEventListener('ended', () => {
      // Auto play next
      if (playNextRef.current) playNextRef.current();
    });

    audio.addEventListener('playing', () => {
      // Playing again: the connection is fine
      r.started = true;
      r.broken = false;
      r.attempts = 0;
      clearRecoveryTimers();
      const track = currentTrackRef.current;
      if (!track || countedTrackIdRef.current === track.id) return;
      countedTrackIdRef.current = track.id;
      recordListen(track.id);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
      // Read again after a dropped connection: back to where it was
      if (r.resumeAt != null) {
        const at = r.resumeAt;
        r.resumeAt = null;
        if (at > 0 && !(audio.duration && at >= audio.duration)) audio.currentTime = at;
      }
    });

    audio.addEventListener('durationchange', () => {
      setDuration(audio.duration || 0);
    });

    // Where it is (not while it is being read again, when the element says 0)
    const keepPosition = () => {
      if (r.resumeAt == null && !audio.seeking && audio.readyState > 0) r.position = audio.currentTime;
    };
    audio.addEventListener('timeupdate', keepPosition);
    audio.addEventListener('seeked', keepPosition);
    // Moved elsewhere in it (from any control): that is where it is, even while
    // the data for it is still on its way (or never comes)
    audio.addEventListener('seeking', () => {
      if (r.resumeAt == null) r.position = audio.currentTime;
    });

    // The connection failed (Chrome says so once its own tries are over)
    audio.addEventListener('error', () => {
      if (!audio.getAttribute('src') || !currentTrackRef.current) return;
      if (shouldRetry(audio.error?.code, r.started)) recover();
    });

    // Waiting for data that doesn't come, without an error: some browsers wait
    // for good on a connection that is gone. The sign: a track that was playing
    // stands still, and no data at all has come in for a while (a slow
    // connection that still brings some is left to go on)
    let lastData = 0;
    audio.addEventListener('progress', () => { lastData = Date.now(); });
    const watchStall = () => {
      if (!isPlayingRef.current || !r.started || r.stallTimer || r.broken) return;
      const at = audio.currentTime;
      const check = () => {
        r.stallTimer = 0;
        if (!isPlayingRef.current || audio.paused || Math.abs(audio.currentTime - at) >= 0.5) return;
        if (Date.now() - lastData < STALL_MS) {
          r.stallTimer = window.setTimeout(check, STALL_MS);
          return;
        }
        recover();
      };
      r.stallTimer = window.setTimeout(check, STALL_MS);
    };
    audio.addEventListener('waiting', watchStall);
    audio.addEventListener('stalled', watchStall);

    // Back online: what stopped for the connection goes on at once
    const onOnline = () => {
      if (!r.broken || !isPlayingRef.current) return;
      r.attempts = 0;
      reload();
    };
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
      clearRecoveryTimers();
      r.reload = null;
      audio.pause();
      audio.src = '';
    };
  }, []);

  // When track changes, update audio src
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    
    addToRecent(currentTrack);

    // Another track: nothing of the last one's dropped connection
    clearRecoveryTimers();
    Object.assign(recovery.current, { position: 0, resumeAt: null, started: false, broken: false, attempts: 0 });
    audio.src = currentTrack.audioUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(e => console.log('Audio play error:', e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current;
    isPlayingRef.current = isPlaying;
    if (!audio || !currentTrack) return;
    const r = recovery.current;
    if (isPlaying) {
      // Stopped by a dropped connection: an element in that state doesn't play
      // again by itself, so the file is read again, from where it was
      if (r.broken || (audio.error && r.started)) {
        r.attempts = 0;
        r.reload?.();
      } else {
        audio.play().catch(e => console.log('Audio play error:', e));
      }
    } else {
      window.clearTimeout(r.retryTimer);
      r.retryTimer = 0;
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Volume/mute control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // When shuffle toggles or the queue changes, shuffle once: the current track
  // first, the rest in a random order that then stays (re-shuffling on every
  // track change made "next" a different track each time it was looked at)
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  useEffect(() => {
    if (isShuffle && queue.length > 0) {
      const at = currentIndexRef.current;
      const shuffled = queue.filter((_, i) => i !== at);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledQueue(at >= 0 ? [queue[at], ...shuffled] : shuffled);
    } else {
      setShuffledQueue([]);
    }
  }, [isShuffle, queue]);

  const activeQueue = isShuffle && shuffledQueue.length > 0 ? shuffledQueue : queue;
  const activeIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);

  const playTrack = (given: Track) => {
    const track = asTrack(given);
    setCurrentTrack(track);
    setIsPlaying(true);
    if (!queue.find(t => t.id === track.id)) {
      setQueue([track]);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(queue.findIndex(t => t.id === track.id));
    }
  };

  const playQueue = (given: Track[], startIndex: number = 0) => {
    const tracks = given.map(asTrack);
    setQueue(tracks);
    setCurrentIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
  };

  const addToQueue = (track: Track) => {
    setQueue(prevQueue => [...prevQueue, asTrack(track)]);
  };

  const playNext = () => {
    if (activeQueue.length === 0) return;
    let nextIndex = activeIndex + 1;
    if (nextIndex >= activeQueue.length) {
      if (isRepeat) {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    const nextTrack = activeQueue[nextIndex];
    setCurrentTrack(nextTrack);
    setCurrentIndex(queue.findIndex(t => t.id === nextTrack.id));
    setIsPlaying(true);
  };

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrevious = () => {
    if (activeQueue.length === 0) return;
    let prevIndex = activeIndex - 1;
    if (prevIndex < 0) {
      if (isRepeat) {
        prevIndex = activeQueue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    const prevTrack = activeQueue[prevIndex];
    setCurrentTrack(prevTrack);
    setCurrentIndex(queue.findIndex(t => t.id === prevTrack.id));
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(prev => !prev);
    }
  };

  const setPlaying = (playing: boolean) => setIsPlaying(playing);

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const r = recovery.current;
    r.position = time;
    // Its connection dropped: the file is read again from there (now if it is
    // meant to play, else when play is pressed)
    if (r.broken || (audio.error && r.started)) {
      r.broken = true;
      if (isPlaying) {
        r.attempts = 0;
        r.reload?.();
      }
      return;
    }
    audio.currentTime = time;
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  const toggleNowPlaying = () => setContextView(prev => prev === 'now-playing' ? null : 'now-playing');
  const toggleQueue = () => setContextView(prev => prev === 'queue' ? 'now-playing' : 'queue');

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        recentTracks,
        recentLoaded,
        clearRecent,
        activeQueue,
        isShuffle,
        isRepeat,
        duration,
        audioRef,
        volume,
        isMuted,
        playTrack,
        playQueue,
        addToQueue,
        playNext,
        playPrevious,
        togglePlayPause,
        setPlaying,
        seekTo,
        setVolume,
        setIsMuted,
        toggleShuffle,
        toggleRepeat,
        contextView,
        toggleNowPlaying,
        toggleQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
