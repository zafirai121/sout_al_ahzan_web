"use client";

import React, { useState } from 'react';
import { usePlaylists } from '@/context/PlaylistContext';

export default function AddToPlaylistModal({ track, onClose }: { track: any, onClose: () => void }) {
  const { playlists, createPlaylist, addTrackToPlaylist } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) return;
    const newId = createPlaylist(newPlaylistName.trim());
    addTrackToPlaylist(newId, track);
    setNewPlaylistName('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#282828',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: '#fff' }}>إضافة إلى قائمة</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {playlists.length === 0 ? (
            <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '16px 0' }}>لا توجد قوائم تشغيل. قم بإنشاء قائمة جديدة.</p>
          ) : (
            playlists.map(p => {
              const isAdded = p.tracks.some(t => t.id === track.id);
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #333' }}>
                  <span style={{ color: '#fff' }}>{p.name}</span>
                  {isAdded ? (
                    <span style={{ color: '#1ed760', fontSize: '12px' }}>مضاف ✓</span>
                  ) : (
                    <button 
                      onClick={() => {
                        addTrackToPlaylist(p.id, track);
                        onClose();
                      }}
                      style={{ background: '#1ed760', color: '#000', border: 'none', padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      إضافة
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <input 
            type="text" 
            placeholder="اسم القائمة الجديدة" 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '4px', border: 'none', background: '#3E3E3E', color: '#fff' }}
          />
          <button 
            onClick={handleCreateAndAdd}
            style={{ background: '#fff', color: '#000', border: 'none', padding: '0 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}
