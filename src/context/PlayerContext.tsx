"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  recentTracks: Track[];
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
  contextView: 'now-playing' | 'queue' | 'devices' | null;
  toggleNowPlaying: () => void;
  toggleQueue: () => void;
  toggleDevices: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([]);
  const [contextView, setContextView] = useState<'now-playing' | 'queue' | 'devices' | null>('now-playing');

  // Audio state — lives in context so it survives navigation
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Load recent tracks from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sout_recent_tracks');
      if (stored) setRecentTracks(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const addToRecent = (track: Track) => {
    setRecentTracks(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const newRecent = [track, ...filtered].slice(0, 30); // Keep last 30
      try {
        localStorage.setItem('sout_recent_tracks', JSON.stringify(newRecent));
      } catch (e) {}
      return newRecent;
    });
  };

  // Store the latest playNext function
  const playNextRef = useRef<(() => void) | null>(null);

  // Create the audio element once and keep it for the app lifetime
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      // Auto play next
      if (playNextRef.current) playNextRef.current();
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // When track changes, update audio src
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    
    addToRecent(currentTrack);
    
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
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(e => console.log('Audio play error:', e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Volume/mute control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // When shuffle toggles, recompute shuffled queue if we have a queue
  useEffect(() => {
    if (isShuffle && queue.length > 0) {
      const remaining = queue.filter((_, i) => i !== currentIndex);
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      if (currentIndex >= 0) {
        setShuffledQueue([queue[currentIndex], ...shuffled]);
      } else {
        setShuffledQueue(shuffled);
      }
    } else {
      setShuffledQueue([]);
    }
  }, [isShuffle, queue, currentIndex]);

  const activeQueue = isShuffle && shuffledQueue.length > 0 ? shuffledQueue : queue;
  const activeIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (!queue.find(t => t.id === track.id)) {
      setQueue([track]);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(queue.findIndex(t => t.id === track.id));
    }
  };

  const playQueue = (tracks: Track[], startIndex: number = 0) => {
    setQueue(tracks);
    setCurrentIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
  };

  const addToQueue = (track: Track) => {
    setQueue(prevQueue => [...prevQueue, track]);
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
    if (audio) {
      audio.currentTime = time;
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  const toggleNowPlaying = () => setContextView(prev => prev === 'now-playing' ? null : 'now-playing');
  const toggleQueue = () => setContextView(prev => prev === 'queue' ? 'now-playing' : 'queue');
  const toggleDevices = () => setContextView(prev => prev === 'devices' ? 'now-playing' : 'devices');

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        recentTracks,
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
        toggleDevices,
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
