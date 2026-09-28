"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import CreditsModal from '@/components/CreditsModal';
import { thumb } from '@/utils/image';
import { Download, Heart, Monitor, MonitorSpeaker, Wifi, X } from 'lucide-react';

export default function ContextBar() {
  const { currentTrack, queue, activeQueue, isShuffle, isRepeat, contextView, toggleNowPlaying, toggleQueue, toggleDevices, playTrack } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // ContextBarWrapper only renders this while a track is loaded
  if (!contextView || !currentTrack) return null;

  // Determine next track for now-playing view
  const activeIndex = queue.findIndex(t => t.id === currentTrack.id);
  let nextTrack = null;
  if (activeIndex >= 0 && activeIndex < queue.length - 1) {
    nextTrack = queue[activeIndex + 1];
  } else if (isRepeat && queue.length > 0) {
    nextTrack = queue[0];
  }

  const liked = isLiked(currentTrack.id);

  const handleCloseNowPlaying = () => toggleNowPlaying();
  const handleCloseQueue = () => toggleQueue();
  const handleCloseDevices = () => toggleDevices();

  // === DEVICES VIEW ===
  if (contextView === 'devices') {
    return (
      <aside className="context-sidebar" style={{ padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>الاتصال</h3>
          <button onClick={handleCloseDevices} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current device */}
        <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'rgba(29,185,84,0.08)', borderRadius: '8px' }}>
            <Monitor size={22} color="#1db954" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1db954' }}>متصفح الويب هذا</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 8px' }}></div>

        {/* No other devices */}
        <div style={{ padding: '8px 20px', flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px' }}>لم يتم العثور على أي أجهزة أخرى</p>

          {/* Tip 1: WiFi */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <Wifi size={22} color="#b3b3b3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>التحقق من شبكة WiFi لديك</div>
              <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.6' }}>اربط الأجهزة التي تستخدمها بشبكة WiFi نفسها.</div>
            </div>
          </div>

          {/* Tip 2: Another device */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <MonitorSpeaker size={22} color="#b3b3b3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>الاستماع من جهاز آخر</div>
              <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.6' }}>سيظهر الجهاز تلقائياً هنا.</div>
            </div>
          </div>

          {/* Tip 3: Switch to app */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <Download size={22} color="#b3b3b3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>التبديل إلى التطبيق</div>
              <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.6' }}>يستطيع التطبيق اكتشاف المزيد من الأجهزة.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', flexShrink: 0 }}>
          <button
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1db954'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
          >
            ألا يمكنك رؤية جهازك؟
          </button>
        </div>
      </aside>
    );
  }

  // Determine next tracks for queue view
  const currentActiveIndex = activeQueue.findIndex(t => t.id === currentTrack.id);
  const nextTracks = currentActiveIndex >= 0 ? activeQueue.slice(currentActiveIndex + 1) : [];

  // === QUEUE VIEW: Full sidebar replaced with queue list ===
  if (contextView === 'queue') {
    return (
      <aside className="context-sidebar" style={{ padding: '24px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#fff' }}>قائمة الاستماع</h3>
          <button style={{ color: '#b3b3b3', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }} onClick={handleCloseQueue}>
            <X size={20} />
          </button>
        </div>

        {/* Now Playing */}
        <div style={{ marginBottom: '28px', flexShrink: 0 }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>تستمع الآن إلى</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            {currentTrack.imageUrl ? (
              <img src={thumb(currentTrack.imageUrl, 44)} alt={currentTrack.title} style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '4px', background: '#333', flexShrink: 0 }}></div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', color: '#1db954', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
              <div style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{currentTrack.artist}</div>
            </div>
          </div>
        </div>

        {/* Next Tracks */}
        {nextTracks.length > 0 && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
              التالي من: {currentTrack.artist}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
              {nextTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background-color 0.15s' }}
                  onClick={() => playTrack(track)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {track.imageUrl ? (
                    <img src={thumb(track.imageUrl, 44)} alt={track.title} style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '4px', background: '#333', flexShrink: 0 }}></div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                    <div style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextTracks.length === 0 && (
          <p style={{ color: '#b3b3b3', fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>لا توجد مقاطع أخرى في الطابور</p>
        )}
      </aside>
    );
  }

  // === NOW PLAYING VIEW: Full sidebar with reciter details ===
  return (
    <aside className="context-sidebar" style={{ padding: '16px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', margin: 0, color: '#fff', fontWeight: 'bold' }}>{currentTrack.title}</h3>
        <button style={{ color: '#b3b3b3', cursor: 'pointer', background: 'none', border: 'none' }} onClick={handleCloseNowPlaying}>
          <X size={24} />
        </button>
      </div>

      {/* Cover Art */}
      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <img src={thumb(currentTrack.imageUrl, 350)} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Track Info + Like */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', wordBreak: 'break-word', color: '#fff' }}>
            {currentTrack.title}
          </h2>
          <p style={{ color: '#b3b3b3', fontSize: '16px', margin: 0 }}>{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => toggleLike(currentTrack)}
          style={{ color: liked ? '#1db954' : '#b3b3b3', marginTop: '6px', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          <Heart size={24} fill="currentColor" />
        </button>
      </div>

      {/* About Artist */}
      <div style={{ backgroundColor: '#242424', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '16px', marginBottom: '16px', color: '#fff' }}>عن الرادود</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={thumb(currentTrack.imageUrl, 56)} alt={currentTrack.artist} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{currentTrack.artist}</div>
            <div style={{ fontSize: '14px', color: '#b3b3b3' }}>فنان</div>
          </div>
        </div>
      </div>

      {/* Credits */}
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
              color: '#fff',
              border: `1px solid ${isFollowing ? '#1db954' : '#727272'}`,
              padding: '6px 14px',
              borderRadius: '32px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'transform 0.1s, border-color 0.2s',
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

      {/* Next Track */}
      {nextTrack && (
        <div style={{ backgroundColor: '#242424', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>التالي في قائمة استماع</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={thumb(nextTrack.imageUrl, 48)} alt={nextTrack.title} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
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
