"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Playlist {
  id: string;
  name: string;
  tracks: any[]; // The track object
  folderId?: string; // Optional folder ID
}

export interface PlaylistFolder {
  id: string;
  name: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  folders: PlaylistFolder[];
  createPlaylist: (name: string, folderId?: string) => string;
  addTrackToPlaylist: (playlistId: string, track: any) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  createFolder: (name: string) => string;
  deleteFolder: (folderId: string) => void;
  movePlaylistToFolder: (playlistId: string, folderId: string | null) => void;
  likedTracks: any[];
  toggleLike: (track: any) => void;
  isLiked: (trackId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: React.ReactNode }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [folders, setFolders] = useState<PlaylistFolder[]>([]);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);

  // Load from local storage
  useEffect(() => {
    const storedPlaylists = localStorage.getItem('soutalahzan_playlists');
    if (storedPlaylists) {
      try {
        setPlaylists(JSON.parse(storedPlaylists));
      } catch (e) {}
    }
    const storedFolders = localStorage.getItem('soutalahzan_folders');
    if (storedFolders) {
      try {
        setFolders(JSON.parse(storedFolders));
      } catch (e) {}
    }
    const storedLikes = localStorage.getItem('soutalahzan_likes');
    if (storedLikes) {
      try {
        setLikedTracks(JSON.parse(storedLikes));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('soutalahzan_folders', JSON.stringify(folders));
  }, [folders]);

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

  const createPlaylist = (name: string, folderId?: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      ...(folderId ? { folderId } : {})
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

  const createFolder = (name: string) => {
    const newFolder: PlaylistFolder = {
      id: Date.now().toString(),
      name
    };
    setFolders([...folders, newFolder]);
    return newFolder.id;
  };

  const deleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setPlaylists(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: undefined } : p));
  };

  const movePlaylistToFolder = (playlistId: string, folderId: string | null) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (folderId === null) {
          const { folderId: _, ...rest } = p;
          return rest as Playlist;
        }
        return { ...p, folderId };
      }
      return p;
    }));
  };

  return (
    <PlaylistContext.Provider value={{ 
      playlists, folders, createPlaylist, addTrackToPlaylist, 
      removeTrackFromPlaylist, deletePlaylist, createFolder, 
      deleteFolder, movePlaylistToFolder, likedTracks, toggleLike, isLiked 
    }}>
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
