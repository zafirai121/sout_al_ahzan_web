"use client";

// Adding a track to one of the listener's playlists: the track at the top, each
// playlist with its cover and count and a gold button (a check where it is
// already), and a new playlist made with the track in it.

import React, { useEffect, useState } from 'react';
import { usePlaylists } from '@/context/PlaylistContext';
import { thumb } from '@/utils/image';
import { countOf, TRACKS } from '@/utils/plural';
import { Check, ListMusic, Plus, X } from 'lucide-react';
import './add-to-playlist.css';

/** How long the check shows before the window goes, so it is seen */
const SEEN_MS = 650;

export default function AddToPlaylistModal({ track, onClose }: { track: any, onClose: () => void }) {
  const { playlists, createPlaylist, addTrackToPlaylist } = usePlaylists();
  const [name, setName] = useState('');
  const [added, setAdded] = useState<string | null>(null);

  // Esc closes it, as clicking outside does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addTo = (id: string) => {
    if (added) return;
    addTrackToPlaylist(id, track);
    setAdded(id);
    setTimeout(onClose, SEEN_MS);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const title = name.trim();
    if (!title || added) return;
    addTo(createPlaylist(title));
    setName('');
  };

  return (
    <div className="pl-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pl-modal" role="dialog" aria-modal="true" aria-labelledby="pl-title">
        <header className="pl-head">
          <h2 id="pl-title" className="pl-title">إضافة إلى قائمة</h2>
          <button type="button" className="pl-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        {/* The track being added */}
        <div className="pl-track">
          {track.imageUrl ? <img src={thumb(track.imageUrl, 96)} alt="" width={48} height={48} /> : <span className="pl-cover is-empty"><ListMusic size={22} /></span>}
          <div className="pl-text">
            <span className="pl-name">{track.title}</span>
            {track.artist ? <span className="pl-sub">{track.artist}</span> : null}
          </div>
        </div>

        {playlists.length === 0 ? (
          <p className="pl-empty">لا قوائم تشغيل بعد. اكتب اسم أول قائمة بالأسفل، ويُضاف المقطع إليها.</p>
        ) : (
          <ul className="pl-list">
            {playlists.map(p => {
              const has = p.tracks.some(t => t.id === track.id);
              const cover = p.tracks.find(t => t.imageUrl)?.imageUrl;
              return (
                <li key={p.id} className="pl-row">
                  {cover ? <img src={thumb(cover, 96)} alt="" width={48} height={48} loading="lazy" /> : <span className="pl-cover is-empty"><ListMusic size={22} /></span>}
                  <div className="pl-text">
                    <span className="pl-name">{p.name}</span>
                    <span className="pl-sub">{p.tracks.length ? countOf(p.tracks.length, TRACKS) : 'فارغة'}</span>
                  </div>
                  {has ? (
                    <span className="pl-done"><Check size={16} strokeWidth={3} />{added === p.id ? 'أُضيف' : 'مضاف'}</span>
                  ) : (
                    <button type="button" className="pl-add" onClick={() => addTo(p.id)} disabled={!!added} aria-label={`أضف إلى ${p.name}`}>
                      <Plus size={16} strokeWidth={3} />إضافة
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* A new playlist, made with this track in it */}
        <form className="pl-new" onSubmit={create}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="اسم قائمة جديدة"
            aria-label="اسم قائمة جديدة"
            maxLength={80}
          />
          <button type="submit" className="pl-create" disabled={!name.trim() || !!added}>إنشاء وإضافة</button>
        </form>
      </div>
    </div>
  );
}
