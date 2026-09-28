"use client";

import React, { useState } from 'react';
import { usePlaylists } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { thumb } from '@/utils/image';
import { ChevronDown, CirclePlus, Folder, Heart, Library, List, ListMusic, Plus, Search, Upload, Users } from 'lucide-react';

export default function SideBar() {
  const { playlists, folders, createPlaylist, createFolder, movePlaylistToFolder, likedTracks } = usePlaylists();
  const { recentTracks } = usePlayer();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'playlists' | 'artists' | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

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
          <Library size={24} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>مكتبتك الصوتية</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <button className="icon-btn" style={{ width: '32px', height: '32px', background: isCreateMenuOpen ? '#2a2a2a' : 'transparent', color: isCreateMenuOpen ? '#fff' : 'inherit', borderRadius: '50%' }} onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}>
            <Plus size={16} />
          </button>

          {isCreateMenuOpen && (
            <>
              <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99}} onClick={() => setIsCreateMenuOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: '#282828', borderRadius: '4px', boxShadow: '0 16px 24px rgba(0,0,0,0.3)', width: '280px', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '4px' }}>
                <div onClick={() => { setIsCreateMenuOpen(false); router.push('/upload'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Upload size={24} color="#b3b3b3" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>رفع مقطع</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>مشاركة مقاطعك مع المستمعين</span>
                  </div>
                </div>

                <div onClick={handleCreatePlaylist} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <ListMusic size={24} style={{ color: '#b3b3b3' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>قائمة مقاطع</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>إنشاء قائمة للمقاطع الصوتية</span>
                  </div>
                </div>

                <div onClick={() => { setIsCreateMenuOpen(false); setNewPlaylistName("قائمة مشتركة جديدة"); setIsCreateModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Users size={24} style={{ color: '#b3b3b3' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>قائمة مشتركة</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>قائمة تجمع بين أذواق أصدقائك</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }}></div>

                <div onClick={() => { setIsCreateMenuOpen(false); setIsFolderModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '2px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Folder size={24} style={{ color: '#b3b3b3' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>مجلّد</span>
                    <span style={{ fontSize: '12px', color: '#b3b3b3' }}>تنظيم قوائم مقاطعك</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <button className="icon-btn" style={{ width: '32px', height: '32px', background: 'transparent' }} onClick={() => router.push('/search')}>
            <Search size={16} />
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
            <List size={16} />
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
              <Heart size={24} color="#fff" fill="currentColor" />
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
                  <img src={thumb(t.imageUrl, 48)} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <CirclePlus size={24} color="#b3b3b3" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>مقطع • {t.artist}</span>
              </div>
            </li>
          ))}

          {/* Render Folders */}
          {(activeFilter === null || activeFilter === 'playlists') && folders.map(folder => {
            const isExpanded = expandedFolders.includes(folder.id);
            const folderPlaylists = playlists.filter(p => p.folderId === folder.id);
            return (
              <React.Fragment key={folder.id}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setExpandedFolders(prev => isExpanded ? prev.filter(id => id !== folder.id) : [...prev, folder.id])}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#2a2a2a'; }}
                    onDragLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const draggedId = e.dataTransfer.getData('playlistId');
                      if (draggedId) movePlaylistToFolder(draggedId, folder.id);
                    }}
                >
                  <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={24} color="#b3b3b3" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{folder.name}</span>
                    <span style={{ color: '#b3b3b3', fontSize: '14px' }}>مجلّد • {folderPlaylists.length} قائمة</span>
                  </div>
                  <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#b3b3b3' }} />
                </li>
                {isExpanded && folderPlaylists.map(p => {
                  const firstTrackImg = p.tracks[0] ? (p.tracks[0].thumbnailUrl || p.tracks[0].thumbnail_url || p.tracks[0].imageUrl || p.tracks[0].image_url) : null;
                  return (
                    <li key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('playlistId', p.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 8px 8px 32px', borderRadius: '4px', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => handlePlaylistClick(p.id)}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {firstTrackImg ? (
                          <img src={thumb(firstTrackImg, 48)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <CirclePlus size={20} color="#b3b3b3" />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                        <span style={{ color: '#b3b3b3', fontSize: '13px' }}>قائمة تشغيل</span>
                      </div>
                    </li>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Render Root Playlists */}
          {(activeFilter === null || activeFilter === 'playlists') && playlists.filter(p => !p.folderId).map(p => {
            const firstTrackImg = p.tracks[0] ? (p.tracks[0].thumbnailUrl || p.tracks[0].thumbnail_url || p.tracks[0].imageUrl || p.tracks[0].image_url) : null;
            return (
              <li key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('playlistId', p.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handlePlaylistClick(p.id)}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '4px', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {firstTrackImg ? (
                    <img src={thumb(firstTrackImg, 48)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CirclePlus size={24} color="#b3b3b3" />
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

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#282828', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>إنشاء مجلد جديد</h2>
            <input 
              type="text" 
              placeholder="اسم المجلد..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolder(newFolderName.trim());
                  setIsFolderModalOpen(false);
                  setNewFolderName("");
                }
              }}
              style={{ padding: '14px', borderRadius: '4px', border: '1px solid transparent', backgroundColor: '#3e3e3e', color: '#fff', fontSize: '16px', outline: 'none', transition: '0.2s' }}
              onFocus={(e) => e.target.style.border = '1px solid #727272'}
              onBlur={(e) => e.target.style.border = '1px solid transparent'}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button 
                onClick={() => { setIsFolderModalOpen(false); setNewFolderName(""); }}
                style={{ padding: '12px 24px', borderRadius: '24px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  if (newFolderName.trim()) {
                    createFolder(newFolderName.trim());
                    setIsFolderModalOpen(false);
                    setNewFolderName("");
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
