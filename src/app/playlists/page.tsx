"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlaylists } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import DropdownMenu from '@/components/DropdownMenu';

function PlaylistsContent() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('id');
  
  const { playlists, deletePlaylist, removeTrackFromPlaylist, likedTracks, toggleLike } = usePlaylists();
  const { playTrack, playQueue, isShuffle, toggleShuffle, currentTrack, isPlaying } = usePlayer();

  const [isAdded, setIsAdded] = React.useState(true); // Since it's already in the playlist, it could default to true
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  if (!playlistId) {
    return (
      <div className="content-inner" style={{ padding: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '24px', fontWeight: 'bold' }}>
          قوائم التشغيل الخاصة بك
        </h2>
        {playlists.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {playlists.map(p => {
              const firstTrack = p.tracks[0];
              const coverImg = firstTrack ? (firstTrack.thumbnailUrl || firstTrack.thumbnail_url || firstTrack.imageUrl || firstTrack.image_url) : null;
              
              return (
              <div key={p.id} className="card" onClick={() => window.location.href = `/playlists?id=${p.id}`}>
                <div className="card-img-container" style={{ background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {coverImg ? (
                    <img src={coverImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>
                  )}
                </div>
                <h3 className="card-title">{p.name}</h3>
                <p className="card-subtitle">{p.tracks.length} مقطع</p>
              </div>
            )})}
          </div>
        ) : (
          <div style={{ color: '#b3b3b3', textAlign: 'center', marginTop: '40px' }}>
            <p>لا توجد لديك أي قوائم تشغيل بعد.</p>
            <p>قم بإنشاء قائمة جديدة من الشريط الجانبي الأيمن.</p>
          </div>
        )}
      </div>
    );
  }

  let playlist: any;
  let isLikesPlaylist = false;
  
  if (playlistId === 'likes') {
    playlist = {
      id: 'likes',
      name: 'المقاطع التي أعجبتك',
      tracks: likedTracks,
      isVirtual: true
    };
    isLikesPlaylist = true;
  } else {
    playlist = playlists.find(p => p.id === playlistId);
  }

  if (!playlist) {
    return (
      <div className="content-inner" style={{ padding: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '24px' }}>القائمة غير موجودة</h2>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playQueue(playlist.tracks.map((track: any) => ({
        id: track.id?.toString(),
        title: track.title || track.name || 'بدون عنوان',
        artist: track.reciterName || track.artist || track.reciter_name || 'مجهول',
        imageUrl: track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/150',
        audioUrl: track.audioUrl || track.audio_url || track.file_url || track.url || ''
      })), 0);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id?.toString(),
      title: track.title || track.name || 'بدون عنوان',
      artist: track.reciterName || track.artist || track.reciter_name || 'مجهول',
      imageUrl: track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/150',
      audioUrl: track.audioUrl || track.audio_url || track.file_url || track.url || ''
    });
  };

  const firstTrackImg = playlist.tracks[0] ? (playlist.tracks[0].thumbnailUrl || playlist.tracks[0].thumbnail_url || playlist.tracks[0].imageUrl || playlist.tracks[0].image_url) : null;

  return (
    <div className="content-inner" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px' }}>
        <div style={{ width: '232px', height: '232px', background: firstTrackImg ? 'transparent' : 'linear-gradient(135deg, #450af5, #c4efd9)', boxShadow: '0 4px 60px rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLikesPlaylist ? (
            <svg width="120" height="120" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            firstTrackImg && <img src={firstTrackImg} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>قائمة تشغيل</span>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: '#fff', margin: 0, padding: 0, letterSpacing: '-0.04em' }}>
            {playlist.name}
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '14px', marginTop: '8px' }}>
            {playlist.tracks.length} مقطع
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
        <button 
          onClick={handlePlayAll}
          style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1ed760', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: playlist.tracks.length > 0 ? 'pointer' : 'not-allowed', opacity: playlist.tracks.length > 0 ? 1 : 0.5, transition: 'transform 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying && currentTrack && playlist.tracks.some((t: any) => t.id == currentTrack.id) ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          )}
        </button>

        <button onClick={() => toggleShuffle()} style={{ background: 'transparent', border: 'none', color: isShuffle ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isShuffle ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isShuffle ? '#1db954' : '#b3b3b3'} title="تشغيل عشوائي">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.527 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.953l-1.017-1.018a.75.75 0 1 1 1.06-1.06L15.98 13.25l-2.828 2.828a.75.75 0 1 1-1.06-1.06l1.017-1.018H11.16a2.25 2.25 0 0 1-1.724-.804l-1.8-2.14.98-1.166 1.8 2.14a3.75 3.75 0 0 0 2.744.96z"></path>
          </svg>
        </button>

        <button onClick={() => setIsAdded(!isAdded)} style={{ background: 'transparent', border: 'none', color: isAdded ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isAdded ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isAdded ? '#1db954' : '#b3b3b3'} title="حفظ في المكتبة">
          {isAdded ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          )}
        </button>

        <button onClick={() => setIsDownloaded(!isDownloaded)} style={{ background: 'transparent', border: 'none', color: isDownloaded ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isDownloaded ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isDownloaded ? '#1db954' : '#b3b3b3'} title="تنزيل">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="8 12 12 16 16 12"></polyline>
            <line x1="12" y1="8" x2="12" y2="16"></line>
          </svg>
        </button>

        <DropdownMenu
          buttonContent={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
          }
          items={[
            { label: 'تعديل التفاصيل', onClick: () => alert('ميزة التعديل قيد التطوير') },
            { label: 'حذف القائمة', onClick: () => { deletePlaylist(playlist.id); window.location.href='/playlists'; } },
            { label: 'نسخ الرابط', onClick: () => { navigator.clipboard.writeText(window.location.href); alert('تم نسخ الرابط'); } }
          ]}
          style={{ background: 'transparent', color: '#b3b3b3', padding: '8px' }}
        />
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Table Header with Thin Separator Line */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 200px 150px 80px', gap: '16px', color: '#b3b3b3', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ textAlign: 'center' }}>#</span>
          <span>المحتوى</span>
          <span>الألبوم</span>
          <span>تاريخ الإضافة</span>
          <span style={{ textAlign: 'left', paddingLeft: '16px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path>
              <path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path>
            </svg>
          </span>
        </div>

        {playlist.tracks.length > 0 ? (
          playlist.tracks.map((track: any, index: number) => {
            const isPlayingTrack = currentTrack?.id === track.id;
            return (
            <div key={track.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 200px 150px 80px', gap: '16px', padding: '8px 0', alignItems: 'center', borderRadius: '4px', cursor: 'pointer' }} className="track-list-row" onClick={() => handlePlayTrack(track)}>
              {isPlayingTrack ? (
                <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              ) : (
                <span style={{ color: '#b3b3b3', textAlign: 'center' }}>{index + 1}</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/40'} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: isPlayingTrack ? '#1db954' : '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title || track.name}</span>
                  <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.reciter_name || track.artist}</span>
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.title || 'بدون ألبوم'}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                قبل ١٠ ساعات
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#b3b3b3', fontSize: '14px' }}>4:30</span>
                {isLikesPlaylist ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    style={{ background: 'transparent', border: 'none', color: '#1db954', cursor: 'pointer', padding: '4px' }}
                    title="إزالة من الإعجابات"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1db954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTrackFromPlaylist(playlist.id, track.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}
                    title="إزالة من القائمة"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })
        ) : (
          <div style={{ color: '#b3b3b3', textAlign: 'center', padding: '40px 0' }}>
            لا توجد مقاطع في هذه القائمة. ابحث عن مقاطع وأضفها!
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  return (
    <Suspense fallback={<div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>}>
      <PlaylistsContent />
    </Suspense>
  );
}
