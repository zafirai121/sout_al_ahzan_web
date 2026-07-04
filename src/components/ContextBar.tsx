"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import CreditsModal from '@/components/CreditsModal';

export default function ContextBar() {
  const { currentTrack, queue, isShuffle, isRepeat, showContextBar, toggleContextBar } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!showContextBar) return null;

  if (!currentTrack) {
    return (
      <aside className="context-sidebar" style={{ padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#b3b3b3', textAlign: 'center' }}>لا يوجد مقطع قيد التشغيل</p>
      </aside>
    );
  }

  // Determine next track
  const activeIndex = queue.findIndex(t => t.id === currentTrack.id);
  let nextTrack = null;
  if (activeIndex >= 0 && activeIndex < queue.length - 1) {
    nextTrack = queue[activeIndex + 1];
  } else if (isRepeat && queue.length > 0) {
    nextTrack = queue[0];
  }

  const liked = isLiked(currentTrack.id);

  return (
    <aside className="context-sidebar" style={{ padding: '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', margin: 0 }}>{currentTrack.title}</h3>
        <button style={{ color: '#b3b3b3', cursor: 'pointer', background: 'none', border: 'none' }} onClick={toggleContextBar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <img src={currentTrack.imageUrl} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', wordBreak: 'break-word' }}>
            {currentTrack.title}
          </h2>
          <p style={{ color: '#b3b3b3', fontSize: '16px', margin: 0 }}>{currentTrack.artist}</p>
        </div>
        <button 
          onClick={() => toggleLike(currentTrack)} 
          style={{ color: liked ? '#1db954' : '#b3b3b3', marginTop: '6px', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {liked ? (
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            ) : (
              <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
            )}
          </svg>
        </button>
      </div>

      <div style={{ backgroundColor: '#242424', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '16px', marginBottom: '16px', color: '#fff' }}>عن الرادود</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={currentTrack.imageUrl} alt={currentTrack.artist} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentTrack.artist}</div>
            <div style={{ fontSize: '14px', color: '#b3b3b3' }}>فنان</div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#242424', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', margin: 0, color: '#fff' }}>لائحة الشكر</h4>
          <button 
            onClick={() => setShowCreditsModal(true)} 
            style={{ color: '#b3b3b3', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
          >
            عرض الكل
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#fff', marginBottom: '4px' }}>{currentTrack.artist}</div>
            <div style={{ fontSize: '12px', color: '#b3b3b3' }}>فنان رئيسي</div>
          </div>
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            style={{ 
              color: isFollowing ? '#fff' : '#fff', 
              border: isFollowing ? '1px solid transparent' : '1px solid #727272', 
              padding: '6px 14px', 
              borderRadius: '32px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              background: isFollowing ? 'transparent' : 'transparent',
              cursor: 'pointer',
              transition: 'transform 0.1s, border-color 0.2s',
              borderColor: isFollowing ? '#1db954' : '#727272'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              if (!isFollowing) e.currentTarget.style.borderColor = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (!isFollowing) e.currentTarget.style.borderColor = '#727272';
            }}
          >
            {isFollowing ? 'يتابعه' : 'متابعة'}
          </button>
        </div>
      </div>

      {nextTrack && (
        <div style={{ backgroundColor: '#242424', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>التالي في قائمة استماع</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={nextTrack.imageUrl} alt={nextTrack.title} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{nextTrack.title}</div>
              <div style={{ fontSize: '12px', color: '#b3b3b3' }}>{nextTrack.artist}</div>
            </div>
          </div>
        </div>
      )}

      {showCreditsModal && (
        <CreditsModal 
          track={currentTrack} 
          onClose={() => setShowCreditsModal(false)} 
        />
      )}
    </aside>
  );
}


