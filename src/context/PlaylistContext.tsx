"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getTrackData } from '@/utils/data_mapper';

export interface Playlist {
  id: string;
  name: string;
  tracks: any[]; // The track object
  folderId?: string; // Optional folder ID
  from?: string; // The site's list it was saved from (a mix, a station)
  unseen?: string[]; // Tracks the account keeps in it that the library no longer has: kept, so saving it here drops none
}

export interface PlaylistFolder {
  id: string;
  name: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  folders: PlaylistFolder[];
  createPlaylist: (name: string, folderId?: string) => string;
  saveList: (name: string, tracks: any[], from: string) => string;
  addTrackToPlaylist: (playlistId: string, track: any) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  createFolder: (name: string) => string;
  deleteFolder: (folderId: string) => void;
  movePlaylistToFolder: (playlistId: string, folderId: string | null) => void;
  likedTracks: any[];
  toggleLike: (track: any) => void;
  isLiked: (trackId: string) => boolean;
  /** The library has been read from the browser (it may be empty) */
  libraryLoaded: boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

// Each account has its own copy in this browser ("soutalahzan_u_<id>_likes"), the
// visitor not signed in the keys as they always were: two accounts on one computer
// never see each other's library
type Kept = 'likes' | 'playlists' | 'folders';
const keyOf = (owner: string | null, name: Kept) => owner ? `soutalahzan_u_${owner}_${name}` : `soutalahzan_${name}`;

const read = <T,>(key: string): T[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch (e) {
    return [];
  }
};

// The account's tables are the phone apps' too (favorites, user_playlists), where a track is "cloud_<id>"
const cloudId = (id: string) => `cloud_${id}`;
const fromCloudId = (id: unknown) => String(id).replace(/^cloud_/, '');
const TRACK_COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,duration,listen_count';

const trackIds = (p: Playlist) => [...p.tracks.map(t => String(t.id)), ...(p.unseen ?? [])];
// What the account keeps of a playlist: its name and its tracks, in order
const signature = (p: Playlist) => JSON.stringify([p.name, trackIds(p)]);
const playlistRow = (uid: string, p: Playlist) => ({ user_id: uid, id: p.id, title: p.name, tracks: trackIds(p).map(cloudId) });

const dateOf = (value: unknown) => {
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

// Sent with when each was made, so they keep their order in the account; without, if it won't take that.
// What the account has already stays as it is there: it may have changed since
const insertDated = async (table: string, rows: Record<string, unknown>[], onConflict: string) => {
  const options = { onConflict, ignoreDuplicates: true };
  const { error } = await supabase.from(table).upsert(rows, options);
  if (!error) return;
  const { error: again } = await supabase.from(table).upsert(rows.map(({ created_at: _, ...row }) => row), options);
  if (again) throw again;
};

/** What the account has, as far as this browser knows: the library shown beyond it goes to the account */
interface Synced {
  likes: Map<string, any>; // track id → the track
  playlists: Map<string, string>; // playlist id → its signature
}
const likesOf = (likes: any[]) => new Map(likes.map(t => [String(t.id), t]));
const playlistsOf = (lists: Playlist[]) => new Map(lists.map(p => [p.id, signature(p)]));

export const PlaylistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  // Whose library is shown: an account's id, null for a visitor not signed in, undefined until the session is read
  const owner = loading ? undefined : (user?.id ?? null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [folders, setFolders] = useState<PlaylistFolder[]>([]);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const shown = useRef<string | null | undefined>(undefined); // whose lists are in the state
  const latest = useRef<{ likes: any[]; playlists: Playlist[] }>({ likes: [], playlists: [] });
  const synced = useRef<Synced | null>(null); // null while not signed in
  // The account's requests go one after another; changes counts those made here, so a read
  // of the account that a change overtook is read again once the change is in
  const queue = useRef<Promise<void>>(Promise.resolve());
  const changes = useRef(0);
  const lastPull = useRef(0);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const tell = (message: string) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  const enqueue = (task: () => Promise<void>) => {
    queue.current = queue.current.then(task).catch(e => console.warn('Library sync failed:', e));
  };

  /** Sends one change; on a failure, undo puts it back as it was and they are told */
  const send = (uid: string, request: () => PromiseLike<{ error: unknown }>, message: string, undo?: () => void) => {
    changes.current++;
    enqueue(async () => {
      const ok = await Promise.resolve(request()).then(({ error }) => !error, () => false);
      if (!ok && shown.current === uid) {
        undo?.();
        tell(message);
      }
    });
  };

  /** Puts a like back as it was when the account didn't take the change */
  const undoLike = (uid: string, id: string, liked: boolean, track: any) => {
    if (shown.current !== uid || !synced.current) return;
    if (liked) synced.current.likes.set(id, track); else synced.current.likes.delete(id);
    setLikedTracks(prev => {
      if (prev.some(t => String(t.id) === id) === liked) return prev;
      return liked ? [...prev, track] : prev.filter(t => String(t.id) !== id);
    });
  };

  // The visitor's likes and playlists in this browser move into the account, and are
  // forgotten here once it has them (a failure is tried again next time). Their folders,
  // which only this site has, go with the playlists into the account's copy here
  const moveGuest = async (uid: string) => {
    const likes = read<any>(keyOf(null, 'likes'));
    const lists = read<Playlist>(keyOf(null, 'playlists'));
    const moved = { likes: true, playlists: true, guestLikes: likes, guestLists: lists };
    if (likes.length) {
      try {
        await insertDated('favorites', likes.map(t => ({ user_id: uid, poem_id: cloudId(String(t.id)), created_at: dateOf(t.addedAt) })), 'user_id,poem_id');
        localStorage.removeItem(keyOf(null, 'likes'));
      } catch (e) {
        moved.likes = false;
      }
    }
    if (lists.length) {
      try {
        // A playlist's id is when it was made
        await insertDated('user_playlists', lists.map(p => ({ ...playlistRow(uid, p), created_at: dateOf(Number(p.id)) })), 'user_id,id');
        const theirs = read<PlaylistFolder>(keyOf(uid, 'folders'));
        const guest = read<PlaylistFolder>(keyOf(null, 'folders'));
        const merged = [...theirs, ...guest.filter(f => !theirs.some(t => t.id === f.id))];
        localStorage.setItem(keyOf(uid, 'folders'), JSON.stringify(merged));
        if (shown.current === uid) setFolders(merged);
        localStorage.removeItem(keyOf(null, 'playlists'));
        localStorage.removeItem(keyOf(null, 'folders'));
      } catch (e) {
        moved.playlists = false;
      }
    }
    return moved;
  };

  /**
   * After signing in, and on each visit while signed in: what this browser kept before
   * moves into the account, then the account's own lists (as the phone apps left them)
   * replace the copy here. Each stays as it is here if it can't be read.
   */
  const pull = (uid: string) => enqueue(async () => {
    if (shown.current !== uid) return;
    lastPull.current = Date.now();
    const before = changes.current;
    const moved = await moveGuest(uid);
    const [fav, pls] = await Promise.all([
      supabase.from('favorites').select('*').eq('user_id', uid),
      supabase.from('user_playlists').select('id,title,tracks,created_at').eq('user_id', uid).order('created_at'),
    ]);
    const likeRows = fav.error || !moved.likes ? null
      : [...(fav.data ?? [])].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))); // the oldest first, as kept here
    const listRows = pls.error || !moved.playlists ? null : pls.data ?? [];

    // The tracks they name, as the site shows them: those this browser has, the rest from the library
    const known = new Map<string, any>();
    const here = latest.current;
    for (const t of [...moved.guestLikes, ...moved.guestLists.flatMap(p => p.tracks), ...here.likes, ...here.playlists.flatMap(p => p.tracks)]) {
      if (t?.id != null) known.set(String(t.id), t);
    }
    const wanted = new Set<string>();
    likeRows?.forEach(r => wanted.add(fromCloudId(r.poem_id)));
    listRows?.forEach(r => (Array.isArray(r.tracks) ? r.tracks : []).forEach((t: unknown) => wanted.add(fromCloudId(t))));
    const missing = [...wanted].filter(id => !known.has(id) && /^\d+$/.test(id));
    for (let i = 0; i < missing.length; i += 100) {
      const { data, error } = await supabase.from('audio_library').select(TRACK_COLUMNS).in('id', missing.slice(i, i + 100));
      if (error) return; // read again next time
      data?.forEach(row => known.set(String(row.id), getTrackData(row)));
    }

    if (shown.current !== uid || !synced.current) return;
    // Changed here meanwhile: read again once those changes are in the account
    if (changes.current !== before) {
      pull(uid);
      return;
    }
    if (likeRows) {
      const likes: any[] = [];
      const seen = new Set<string>();
      for (const r of likeRows) {
        const id = fromCloudId(r.poem_id);
        const t = known.get(id);
        // A like of a track the library no longer has stays in the account, unshown
        if (!t || seen.has(id)) continue;
        seen.add(id);
        likes.push({ ...t, addedAt: r.created_at ?? t.addedAt });
      }
      synced.current.likes = likesOf(likes);
      latest.current = { ...latest.current, likes };
      setLikedTracks(likes);
    }
    if (listRows) {
      const local = new Map([...moved.guestLists, ...latest.current.playlists].map(p => [p.id, p]));
      const lists: Playlist[] = listRows.map(r => {
        const mine = local.get(String(r.id));
        const addedAt = new Map((mine?.tracks ?? []).map(t => [String(t.id), t.addedAt]));
        const ids = [...new Set<string>((Array.isArray(r.tracks) ? r.tracks : []).map(fromCloudId))];
        const unseen = ids.filter(id => !known.has(id));
        return {
          id: String(r.id),
          name: r.title || 'قائمة تشغيل',
          tracks: ids.filter(id => known.has(id)).map(id => ({ ...known.get(id), addedAt: addedAt.get(id) })),
          ...(unseen.length ? { unseen } : {}),
          ...(mine?.folderId ? { folderId: mine.folderId } : {}),
          ...(mine?.from ? { from: mine.from } : {}),
        };
      });
      synced.current.playlists = playlistsOf(lists);
      latest.current = { ...latest.current, playlists: lists };
      setPlaylists(lists);
    }
  });

  // Signed in, out, or into another account: its own library is shown. An account's
  // first time in this browser, it starts as the visitor's (moving into the account,
  // see pull), so nothing disappears meanwhile
  useEffect(() => {
    if (owner === undefined) return;
    if (owner && localStorage.getItem(keyOf(owner, 'likes')) === null && localStorage.getItem(keyOf(owner, 'playlists')) === null) {
      for (const name of ['likes', 'playlists', 'folders'] as const) {
        const guest = localStorage.getItem(keyOf(null, name));
        if (guest !== null) localStorage.setItem(keyOf(owner, name), guest);
      }
    }
    const likes = read<any>(keyOf(owner, 'likes'));
    const lists = read<Playlist>(keyOf(owner, 'playlists'));
    shown.current = owner;
    latest.current = { likes, playlists: lists };
    synced.current = owner ? { likes: likesOf(likes), playlists: playlistsOf(lists) } : null;
    setLikedTracks(likes);
    setPlaylists(lists);
    setFolders(read<PlaylistFolder>(keyOf(owner, 'folders')));
    setLibraryLoaded(true);
    if (owner) pull(owner);
  }, [owner]);

  // Back on the site after a while: what they changed in the app meanwhile shows here too
  useEffect(() => {
    if (!owner) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastPull.current > 60_000) pull(owner);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [owner]);

  // Kept in this browser whenever it changes, and sent to the account while signed in
  useEffect(() => {
    if (shown.current === undefined) return;
    localStorage.setItem(keyOf(shown.current, 'folders'), JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    const uid = shown.current;
    if (uid === undefined) return;
    localStorage.setItem(keyOf(uid, 'playlists'), JSON.stringify(playlists));
    latest.current = { ...latest.current, playlists };
    const base = synced.current;
    if (!uid || !base) return;
    const now = playlistsOf(playlists);
    for (const p of playlists) {
      if (base.playlists.get(p.id) === now.get(p.id)) continue; // new or changed
      const row = playlistRow(uid, p);
      send(uid, () => supabase.from('user_playlists').upsert(row, { onConflict: 'user_id,id' }), 'تعذر حفظ القائمة في حسابك');
    }
    for (const id of base.playlists.keys()) {
      if (!now.has(id)) send(uid, () => supabase.from('user_playlists').delete().eq('user_id', uid).eq('id', id), 'تعذر حذف القائمة من حسابك، تحقق من اتصالك');
    }
    base.playlists = now;
  }, [playlists]);

  useEffect(() => {
    const uid = shown.current;
    if (uid === undefined) return;
    localStorage.setItem(keyOf(uid, 'likes'), JSON.stringify(likedTracks));
    latest.current = { ...latest.current, likes: likedTracks };
    const base = synced.current;
    if (!uid || !base) return;
    const now = likesOf(likedTracks);
    const message = 'تعذر حفظ التغيير في حسابك، تحقق من اتصالك';
    for (const [id, track] of now) {
      if (base.likes.has(id)) continue;
      send(uid, () => supabase.from('favorites').upsert({ user_id: uid, poem_id: cloudId(id) }, { onConflict: 'user_id,poem_id', ignoreDuplicates: true }),
        message, () => undoLike(uid, id, false, track));
    }
    for (const [id, track] of base.likes) {
      if (now.has(id)) continue;
      send(uid, () => supabase.from('favorites').delete().eq('user_id', uid).eq('poem_id', cloudId(id)), message, () => undoLike(uid, id, true, track));
    }
    base.likes = now;
  }, [likedTracks]);

  const toggleLike = (track: any) => {
    setLikedTracks(prev => {
      const exists = prev.find(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, { ...track, addedAt: new Date().toISOString() }];
      }
    });
  };

  const isLiked = (trackId: string) => {
    return likedTracks.some(t => t.id === trackId);
  };

  // Lists the account's copy may replace at any moment: changed from the latest, not this render's
  const createPlaylist = (name: string, folderId?: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      ...(folderId ? { folderId } : {})
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist.id;
  };

  // A whole list of the site's (a mix, a station) kept as one of the listener's playlists
  const saveList = (name: string, tracks: any[], from: string) => {
    const addedAt = new Date().toISOString();
    const saved: Playlist = { id: Date.now().toString(), name, from, tracks: tracks.map(t => ({ ...t, addedAt })) };
    setPlaylists(prev => [...prev, saved]);
    return saved.id;
  };

  const addTrackToPlaylist = (playlistId: string, track: any) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (!p.tracks.find(t => t.id === track.id)) {
          return { ...p, tracks: [...p.tracks, { ...track, addedAt: new Date().toISOString() }] };
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
    setFolders(prev => [...prev, newFolder]);
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
      playlists, folders, createPlaylist, saveList, addTrackToPlaylist,
      removeTrackFromPlaylist, deletePlaylist, createFolder,
      deleteFolder, movePlaylistToFolder, likedTracks, toggleLike, isLiked, libraryLoaded
    }}>
      {children}
      {notice && <div className="sync-notice" role="status">{notice}</div>}
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
