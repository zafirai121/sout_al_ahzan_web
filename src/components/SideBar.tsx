"use client";

import React, { useState } from 'react';
import { usePlaylists } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';

export default function SideBar() {
  const { playlists, createPlaylist, likedTracks } = usePlaylists();
  const { recentTracks } = usePlayer();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'playlists' | 'artists' | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreatePlaylist = () => {
    setIsCreateMenuOpen(false);
    setIsCreateModalOpen(true);
  };

  const handlePlaylistClick = (id: string) => {
    router.push(`/playlists?id=${id}`);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ padding: '12px 16px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b3b3b3', cursor: 'pointer' }} onClick={() => router.push('/playlists')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z"/></svg>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>مكتبتك الصوتية</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <button className="icon-btn" style={{ width: '32px', height: '32px', background: isCreateMenuOpen ? '#2a2a2a' : 'transparent', color: isCreateMenuOpen ? '#fff' : 'inherit', borderRadius: '50%' }} onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/></svg>
          </button>

          {isCreateMenuOpen && (
            <>
              <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99}} onClick={() => setIsCreateMenuOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: '#282828', borderRadius: '4px', boxShadow: '0 16px 24px rgba(0,0,0,0.3)', width: '280px', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '4px' }}>
                <div onClick={handleCreatePlaylist} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#b3b3b3' }}><path d="M9 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm19-8v13H2v-13h20zM3 6.5v11h18v-11H3z"/></svg>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>قائمة مقاطع</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>إنشاء قائمة للمقاطع الصوتية</span>
                  </div>
                </div>

                <div onClick={() => { setIsCreateMenuOpen(false); alert("قيد التطوير"); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#b3b3b3' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7v10M8 11h8" stroke="currentColor" strokeWidth="2"/></svg>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>قائمة مشتركة</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>قائمة تجمع بين أذواق أصدقائك</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }}></div>

                <div onClick={() => { setIsCreateMenuOpen(false); alert("قيد التطوير"); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#b3b3b3' }}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>مجلّد</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>تنظيم قوائم مقاطعك</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <button className="icon-btn" style={{ width: '32px', height: '32px', background: 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.19 1A5.192 5.192 0 0 0 2 6.19C2 9.06 4.34 11.38 7.19 11.38c1.173 0 2.247-.393 3.12-1.054l3.524 3.523.707-.707-3.523-3.524A5.163 5.163 0 0 0 12.38 6.19C12.38 3.32 10.06 1 7.19 1zM3 6.19A4.195 4.195 0 0 1 7.19 2a4.195 4.195 0 0 1 4.19 4.19c0 2.31-1.88 4.19-4.19 4.19A4.195 4.195 0 0 1 3 6.19z"/></svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 8px 16px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => setActiveFilter(activeFilter === 'playlists' ? null : 'playlists')}
          style={{ background: activeFilter === 'playlists' ? '#fff' : '#242424', color: activeFilter === 'playlists' ? '#000' : '#fff', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>
          قوائم التشغيل
        </button>
        <button 
          onClick={() => setActiveFilter(activeFilter === 'artists' ? null : 'artists')}
          style={{ background: activeFilter === 'artists' ? '#fff' : '#242424', color: activeFilter === 'artists' ? '#000' : '#fff', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>
          الرواديد
        </button>
      </div>

      <div className="sidebar-content" style={{ flexGrow: 1, overflowY: 'auto', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', color: '#b3b3b3', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15 14.5H1v-1.5h14v1.5zm0-5.75H1v-1.5h14v1.5zm0-5.75H1v-1.5h14v1.5z"/></svg>
            <span>تم الاستماع إليها مؤخراً</span>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Likes List */}
          {(activeFilter === null || activeFilter === 'playlists') && (
          <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => router.push('/playlists?id=likes')}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>الإعجابات</div>
              <div style={{ fontSize: '14px', color: '#b3b3b3' }}>
                <span style={{ color: '#1db954', marginRight: '4px' }}>📌</span>
                قائمة تشغيل • {likedTracks ? likedTracks.length : 0} مقطع
              </div>
            </div>
          </li>
          )}

          {/* Recent Tracks List */}
          {(activeFilter === null) && recentTracks.map(t => (
            <li key={`recent-${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => router.push(`/track?id=${t.id}`)}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '4px', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>مقطع • {t.artist}</span>
              </div>
            </li>
          ))}

          {(activeFilter === null || activeFilter === 'playlists') && playlists.map(p => {
            const firstTrackImg = p.tracks[0] ? (p.tracks[0].thumbnailUrl || p.tracks[0].thumbnail_url || p.tracks[0].imageUrl || p.tracks[0].image_url) : null;
            return (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handlePlaylistClick(p.id)}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '4px', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {firstTrackImg ? (
                    <img src={firstTrackImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span style={{ color: '#b3b3b3', fontSize: '14px' }}>قائمة تشغيل • {p.tracks.length} مقطع</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#282828', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>إنشاء قائمة تشغيل</h2>
            <input 
              type="text" 
              placeholder="اسم قائمة التشغيل..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPlaylistName.trim()) {
                  const newId = createPlaylist(newPlaylistName.trim());
                  setIsCreateModalOpen(false);
                  setNewPlaylistName("");
                  router.push(`/playlists?id=${newId}`);
                }
              }}
              style={{ padding: '14px', borderRadius: '4px', border: '1px solid transparent', backgroundColor: '#3e3e3e', color: '#fff', fontSize: '16px', outline: 'none', transition: '0.2s' }}
              onFocus={(e) => e.target.style.border = '1px solid #727272'}
              onBlur={(e) => e.target.style.border = '1px solid transparent'}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button 
                onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(""); }}
                style={{ padding: '12px 24px', borderRadius: '24px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  if (newPlaylistName.trim()) {
                    const newId = createPlaylist(newPlaylistName.trim());
                    setIsCreateModalOpen(false);
                    setNewPlaylistName("");
                    router.push(`/playlists?id=${newId}`);
                  }
                }}
                style={{ padding: '12px 24px', borderRadius: '24px', background: '#1ed760', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
