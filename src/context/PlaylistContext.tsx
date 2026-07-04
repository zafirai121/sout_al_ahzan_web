"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Playlist {
  id: string;
  name: string;
  tracks: any[]; // The track object
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string) => string;
  addTrackToPlaylist: (playlistId: string, track: any) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  likedTracks: any[];
  toggleLike: (track: any) => void;
  isLiked: (trackId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: React.ReactNode }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);

  // Load from local storage
  useEffect(() => {
    const storedPlaylists = localStorage.getItem('soutalahzan_playlists');
    if (storedPlaylists) {
      try {
        setPlaylists(JSON.parse(storedPlaylists));
      } catch (e) {}
    }
    const storedLikes = localStorage.getItem('soutalahzan_likes');
    if (storedLikes) {
      try {
        setLikedTracks(JSON.parse(storedLikes));
      } catch (e) {}
    }
  }, []);

  // Save to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('soutalahzan_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('soutalahzan_likes', JSON.stringify(likedTracks));
  }, [likedTracks]);

  const toggleLike = (track: any) => {
    setLikedTracks(prev => {
      const exists = prev.find(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const isLiked = (trackId: string) => {
    return likedTracks.some(t => t.id === trackId);
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: []
    };
    setPlaylists([...playlists, newPlaylist]);
    return newPlaylist.id;
  };

  const addTrackToPlaylist = (playlistId: string, track: any) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (!p.tracks.find(t => t.id === track.id)) {
          return { ...p, tracks: [...p.tracks, track] };
        }
      }
      return p;
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      }
      return p;
    }));
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  return (
    <PlaylistContext.Provider value={{ playlists, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist, deletePlaylist, likedTracks, toggleLike, isLiked }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylists must be used within a PlaylistProvider");
  }
  return context;
};
