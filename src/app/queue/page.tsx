"use client";

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import TopBar from '@/components/TopBar';

export default function QueuePage() {
  const { currentTrack, activeQueue, playTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();

  // Find current index to separate what's currently playing and what's next
  const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
  const nextTracks = currentIndex >= 0 ? activeQueue.slice(currentIndex + 1) : [];

  return (
    <div className="page-container" style={{ paddingBottom: '120px' }}>
      <TopBar onMenuClick={() => {}} />
      <div className="track-page-content" style={{ marginTop: '60px', padding: '0 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#fff' }}>طابور التشغيل</h1>
        
        {currentTrack ? (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff' }}>يتم التشغيل الآن</h2>
            <div className="track-list-container">
              <div 
                className="track-list-row track-list-grid-row playing"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div className="col-index">
                  <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </div>
                <div className="col-title">
                  <div className="track-info">
                    {currentTrack.imageUrl ? (
                      <img src={currentTrack.imageUrl} alt={currentTrack.title} className="track-img" />
                    ) : (
                      <div className="track-img-placeholder"></div>
                    )}
                    <div className="track-text">
                      <div className="track-name" style={{ color: '#1ed760' }}>{currentTrack.title}</div>
                      <div className="track-artist">{currentTrack.artist}</div>
                    </div>
                  </div>
                </div>
                <div className="col-album">{currentTrack.artist}</div>
                <div className="col-plays" style={{ textAlign: 'center' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack); }}
                    style={{ background: 'transparent', border: 'none', color: isLiked(currentTrack.id) ? '#1db954' : '#b3b3b3', cursor: 'pointer' }}
                  >
                    {isLiked(currentTrack.id) ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002z"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002zM8 3.515l-.756-.757a3.082 3.082 0 00-4.36 0 3.082 3.082 0 000 4.36L8 12.23l5.116-5.112a3.082 3.082 0 000-4.36 3.082 3.082 0 00-4.36 0L8 3.515z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#b3b3b3', marginTop: '40px' }}>لا يوجد مقطع يعمل حالياً</div>
        )}

        {nextTracks.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff' }}>التالي في الطابور</h2>
            <div className="track-list-container">
              <div className="track-list-header track-list-grid-row">
                <div className="col-index">#</div>
                <div className="col-title">العنوان</div>
                <div className="col-album">الرادود</div>
                <div className="col-plays" style={{ textAlign: 'center' }}></div>
              </div>
              
              {nextTracks.map((track, index) => (
                <div 
                  key={`${track.id}-${index}`} 
                  className="track-list-row track-list-grid-row"
                  onClick={() => playTrack(track)}
                >
                  <div className="col-index">{index + 1}</div>
                  <div className="col-title">
                    <div className="track-info">
                      {track.imageUrl ? (
                        <img src={track.imageUrl} alt={track.title} className="track-img" />
                      ) : (
                        <div className="track-img-placeholder"></div>
                      )}
                      <div className="track-text">
                        <div className="track-name">{track.title}</div>
                        <div className="track-artist">{track.artist}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-album">{track.artist}</div>
                  <div className="col-plays" style={{ textAlign: 'center' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                      style={{ background: 'transparent', border: 'none', color: isLiked(track.id) ? '#1db954' : '#b3b3b3', cursor: 'pointer' }}
                    >
                      {isLiked(track.id) ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002z"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002zM8 3.515l-.756-.757a3.082 3.082 0 00-4.36 0 3.082 3.082 0 000 4.36L8 12.23l5.116-5.112a3.082 3.082 0 000-4.36 3.082 3.082 0 00-4.36 0L8 3.515z"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
