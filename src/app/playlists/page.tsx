"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlaylists } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import DropdownMenu from '@/components/DropdownMenu';
import { thumb } from '@/utils/image';
import { formatDuration } from '@/utils/data_mapper';
import { CircleArrowDown, CircleCheck, CirclePlus, Ellipsis, Heart, Pause, Play, Shuffle, X } from 'lucide-react';

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
                    <img src={thumb(coverImg, 200)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CirclePlus size={48} color="#b3b3b3" />
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
        imageUrl: track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || '/icon.png',
        audioUrl: track.audioUrl || track.audio_url || track.file_url || track.url || ''
      })), 0);
    }
  };

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id?.toString(),
      title: track.title || track.name || 'بدون عنوان',
      artist: track.reciterName || track.artist || track.reciter_name || 'مجهول',
      imageUrl: track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || '/icon.png',
      audioUrl: track.audioUrl || track.audio_url || track.file_url || track.url || ''
    });
  };

  const firstTrackImg = playlist.tracks[0] ? (playlist.tracks[0].thumbnailUrl || playlist.tracks[0].thumbnail_url || playlist.tracks[0].imageUrl || playlist.tracks[0].image_url) : null;

  return (
    <div className="content-inner" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px' }}>
        <div style={{ width: '232px', height: '232px', background: firstTrackImg ? 'transparent' : 'linear-gradient(135deg, #450af5, #c4efd9)', boxShadow: '0 4px 60px rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLikesPlaylist ? (
            <Heart size={120} color="#fff" fill="currentColor" />
          ) : (
            firstTrackImg && <img src={thumb(firstTrackImg, 240)} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <Pause size={24} color="#000" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={24} color="#000" fill="currentColor" strokeWidth={0} />
          )}
        </button>

        <button onClick={() => toggleShuffle()} style={{ background: 'transparent', border: 'none', color: isShuffle ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isShuffle ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isShuffle ? '#1db954' : '#b3b3b3'} title="تشغيل عشوائي">
          <Shuffle size={32} />
        </button>

        <button onClick={() => setIsAdded(!isAdded)} style={{ background: 'transparent', border: 'none', color: isAdded ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isAdded ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isAdded ? '#1db954' : '#b3b3b3'} title="حفظ في المكتبة">
          {isAdded ? (
            <CircleCheck size={32} />
          ) : (
            <CirclePlus size={32} />
          )}
        </button>

        <button onClick={() => setIsDownloaded(!isDownloaded)} style={{ background: 'transparent', border: 'none', color: isDownloaded ? '#1db954' : '#b3b3b3', cursor: 'pointer', padding: '0', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = isDownloaded ? '#1ed760' : '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = isDownloaded ? '#1db954' : '#b3b3b3'} title="تنزيل">
          <CircleArrowDown size={32} />
        </button>

        <DropdownMenu
          buttonContent={
            <Ellipsis size={32} />
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
            <CirclePlus size={16} />
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
                <img src={thumb(track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || '/icon.png', 40)} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: isPlayingTrack ? '#1db954' : '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title || track.name}</span>
                  <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.reciter_name || track.artist}</span>
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.title || 'بدون ألبوم'}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                {track.addedAt ? new Date(track.addedAt).toLocaleDateString('ar') : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#b3b3b3', fontSize: '14px' }}>{formatDuration(track.duration)}</span>
                {isLikesPlaylist ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    style={{ background: 'transparent', border: 'none', color: '#1db954', cursor: 'pointer', padding: '4px' }}
                    title="إزالة من الإعجابات"
                  >
                    <Heart size={16} color="#1db954" fill="currentColor" />
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTrackFromPlaylist(playlist.id, track.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}
                    title="إزالة من القائمة"
                  >
                    <X size={16} />
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
