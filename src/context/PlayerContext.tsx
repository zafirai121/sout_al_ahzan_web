"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  isShuffle: boolean;
  isRepeat: boolean;
  playTrack: (track: Track) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setPlaying: (playing: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  showContextBar: boolean;
  toggleContextBar: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([]);
  const [showContextBar, setShowContextBar] = useState(true);

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
    setQueue(prevQueue => {
      // If it's already in the queue, we can just return, or add it to the end. Let's add it to the end if not present, or allow duplicates.
      return [...prevQueue, track];
    });
  };

  const playNext = () => {
    if (activeQueue.length === 0) return;
    
    let nextIndex = activeIndex + 1;
    if (nextIndex >= activeQueue.length) {
      if (isRepeat) {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return; // End of queue
      }
    }
    const nextTrack = activeQueue[nextIndex];
    setCurrentTrack(nextTrack);
    setCurrentIndex(queue.findIndex(t => t.id === nextTrack.id));
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (activeQueue.length === 0) return;

    let prevIndex = activeIndex - 1;
    if (prevIndex < 0) {
      if (isRepeat) {
        prevIndex = activeQueue.length - 1;
      } else {
        prevIndex = 0; // Just restart current if not repeating
      }
    }
    const prevTrack = activeQueue[prevIndex];
    setCurrentTrack(prevTrack);
    setCurrentIndex(queue.findIndex(t => t.id === prevTrack.id));
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  const toggleContextBar = () => setShowContextBar(prev => !prev);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        isShuffle,
        isRepeat,
        showContextBar,
        playTrack,
        playQueue,
        addToQueue,
        playNext,
        playPrevious,
        togglePlayPause,
        setPlaying,
        toggleShuffle,
        toggleRepeat,
        toggleContextBar,
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
