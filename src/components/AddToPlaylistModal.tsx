"use client";

import React, { useState } from 'react';
import { usePlaylists } from '@/context/PlaylistContext';
import './AuthModal.css';

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
    <div className="auth-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal-container" style={{ padding: '32px' }}>
        <button className="auth-modal-close" onClick={onClose} aria-label="إغلاق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <h2 className="auth-modal-title" style={{ fontSize: '24px', marginBottom: '24px' }}>إضافة إلى قائمة</h2>

        <div style={{ width: '100%', maxHeight: '250px', overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
          {playlists.length === 0 ? (
            <p className="auth-modal-subtitle" style={{ marginBottom: 0 }}>لا توجد قوائم تشغيل حالياً. قم بإنشاء قائمة جديدة بالأسفل.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {playlists.map(p => {
                const isAdded = p.tracks.some(t => t.id === track.id);
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  >
                    <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{p.name}</span>
                    {isAdded ? (
                      <span style={{ color: '#1ed760', fontSize: '14px', fontWeight: 'bold' }}>مضاف ✓</span>
                    ) : (
                      <button 
                        onClick={() => {
                          addTrackToPlaylist(p.id, track);
                          onClose();
                        }}
                        style={{ background: '#F05B28', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        إضافة
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
            <input 
              type="text" 
              className="auth-input"
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
              placeholder="اسم القائمة الجديدة" 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); }}
            />
          </div>
          <button 
            onClick={handleCreateAndAdd}
            disabled={!newPlaylistName.trim()}
            style={{ 
              background: newPlaylistName.trim() ? '#fff' : '#333', 
              color: newPlaylistName.trim() ? '#000' : '#777', 
              border: 'none', 
              padding: '16px 24px', 
              borderRadius: '24px', 
              cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed', 
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}
