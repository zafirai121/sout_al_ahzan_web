"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';

export default function PlayerBar() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause, 
    setPlaying,
    toggleShuffle,
    isShuffle,
    playPrevious,
    queue,
    playNext,
    toggleRepeat,
    isRepeat,
    contextView,
    toggleNowPlaying,
    toggleQueue
  } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  const router = useRouter();
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [activeDevice, setActiveDevice] = useState('هذا المتصفح');
  const deviceBtnRef = useRef<HTMLButtonElement>(null);

  const devices = [
    { id: 'browser', name: 'هذا المتصفح', type: 'computer', icon: 'M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v8h12V4H4zm0 10v1h12v-1H4z' },
    { id: 'phone', name: 'هاتف محمول', type: 'phone', icon: 'M4 2a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2 0v12h4V2H6zm2 9a1 1 0 100 2 1 1 0 000-2z' },
    { id: 'tv', name: 'تلفاز ذكي', type: 'tv', icon: 'M1 3a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H9.5l.5 2H11a.5.5 0 010 1H5a.5.5 0 010-1h1l.5-2H2a1 1 0 01-1-1V3zm13 0H2v8h12V3z' },
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(e => console.log('Audio play error:', e));
      } else {
        audio.pause();
      }
    }
    
    return () => {
      // If the component unmounts or track changes, ensure we don't leave ghost audio playing
      // Wait, we don't want to pause on every re-render of this effect (like when isPlaying changes)
      // Actually, if we just rely on standard HTML5 audio src change, it stops the old one.
    }
  }, [isPlaying, currentTrack]);

  // Global cleanup for unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      if (!isDragging) {
        setProgress(audioRef.current.currentTime);
      }
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
  };

  const handleSeekCommit = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = progress;
    }
    setIsDragging(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
    if (Number(e.target.value) > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!currentTrack) {
    return (
      <footer className="sleek-player empty">
        <p>قم باختيار قصيدة للبدء بالاستماع</p>
      </footer>
    );
  }

  const progressPercent = duration ? (progress / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .sleek-player {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 90px;
          background-color: #000000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
          border-top: 1px solid #282828;
          color: #b3b3b3;
          user-select: none;
        }
        .sleek-player.empty {
          justify-content: center;
          font-size: 14px;
        }
        .sp-left, .sp-right {
          width: 30%;
          min-width: 180px;
          display: flex;
          align-items: center;
        }
        .sp-center {
          width: 40%;
          max-width: 722px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sp-track-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sp-cover {
          width: 56px;
          height: 56px;
          border-radius: 4px;
          overflow: hidden;
          background-color: #282828;
          box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }
        .sp-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sp-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .sp-title {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
          cursor: pointer;
        }
        .sp-title:hover {
          text-decoration: underline;
        }
        .sp-artist {
          font-size: 12px;
          cursor: pointer;
        }
        .sp-artist:hover {
          text-decoration: underline;
          color: #fff;
        }
        .sp-controls {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 8px;
        }
        .sp-btn {
          background: transparent;
          border: none;
          color: #b3b3b3;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .sp-btn:hover {
          color: #fff;
        }
        .sp-play-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #fff;
          color: #000;
        }
        .sp-play-btn:hover {
          transform: scale(1.05);
          color: #000;
          background-color: #fff;
        }
        .sp-progress-container {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .sp-time {
          font-size: 11px;
          min-width: 40px;
          text-align: center;
        }
        
        /* Custom Range Slider */
        .sp-slider-wrapper {
          position: relative;
          width: 100%;
          height: 12px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .sp-slider-track {
          position: absolute;
          width: 100%;
          height: 4px;
          background-color: #4d4d4d;
          border-radius: 2px;
          overflow: hidden;
        }
        .sp-slider-fill {
          height: 100%;
          background-color: #fff;
          border-radius: 2px;
        }
        .sp-slider-wrapper:hover .sp-slider-fill {
          background-color: #1db954;
        }
        .sp-slider-thumb {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: #fff;
          border-radius: 50%;
          top: 50%;
          transform: translate(50%, -50%); /* For RTL right alignment */
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          opacity: 0;
        }
        .sp-slider-wrapper:hover .sp-slider-thumb {
          opacity: 1;
        }
        .sp-range {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }
        .sp-right {
          justify-content: flex-end;
          gap: 16px;
        }
      `}} />

      <footer className="sleek-player" dir="rtl">
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />

        {/* Right side in RTL (Track Info) */}
        <div className="sp-left">
          <div className="sp-track-info">
            <div className="sp-cover">
              {currentTrack.imageUrl ? (
                <img src={currentTrack.imageUrl} alt={currentTrack.title} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #444, #222)' }}></div>
              )}
            </div>
            <div className="sp-text">
              <span className="sp-title">{currentTrack.title}</span>
              <span className="sp-artist">{currentTrack.artist}</span>
            </div>
            <button 
              className="sp-btn" 
              style={{ marginRight: '16px', color: isLiked(currentTrack.id) ? '#1db954' : '#b3b3b3' }} 
              title="حفظ في مكتبتك"
              onClick={() => toggleLike(currentTrack)}
            >
              {isLiked(currentTrack.id) ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-1.15-1.464L.705 8.31a4.542 4.542 0 01-1.01-3.84A4.618 4.618 0 013.477.817h.002a4.582 4.582 0 014.21 1.206h-.002zM8 3.515l-.756-.757a3.082 3.082 0 00-4.36 0 3.082 3.082 0 000 4.36L8 12.23l5.116-5.112a3.082 3.082 0 000-4.36 3.082 3.082 0 00-4.36 0L8 3.515z"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Center (Controls & Progress) */}
        <div className="sp-center">
          <div className="sp-controls">
            <button className="sp-btn" title="تبديل عشوائي" onClick={toggleShuffle} style={{ color: isShuffle ? '#1db954' : '#b3b3b3' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391a2.25 2.25 0 011.724.804l4.48 5.338-.992.834-4.48-5.338A3.75 3.75 0 00.391 3.5zm10.77 10h1.947l-1.017-1.018a.75.75 0 011.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 11-1.06-1.06l1.017-1.018H11.16a2.25 2.25 0 01-1.724-.804l-1.282-1.528.992-.834 1.283 1.528a3.75 3.75 0 002.873 1.34z"/></svg>
            </button>
            
            <button className="sp-btn" title="السابق" onClick={playPrevious} disabled={queue.length <= 1}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-1.4 0V1.7a.7.7 0 01.7-.7z"/></svg>
            </button>
            
            <button className="sp-btn sp-play-btn" onClick={togglePlayPause} title={isPlaying ? "إيقاف" : "تشغيل"}>
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z"/></svg>
              )}
            </button>
            
            <button className="sp-btn" title="التالي" onClick={playNext} disabled={queue.length <= 1}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.106A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 001.4 0V1.7a.7.7 0 00-.7-.7z"/></svg>
            </button>
            
            <button className="sp-btn" title="تكرار" onClick={toggleRepeat} style={{ color: isRepeat ? '#1db954' : '#b3b3b3' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z"/></svg>
            </button>
          </div>
          
          <div className="sp-progress-container">
            <span className="sp-time">{formatTime(progress)}</span>
            <div className="sp-slider-wrapper">
              <div className="sp-slider-track">
                <div className="sp-slider-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="sp-slider-thumb" style={{ right: `${progressPercent}%` /* right instead of left for RTL */ }}></div>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={progress}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="sp-range"
              />
            </div>
            <span className="sp-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Left side in RTL (Volume & Extras) */}
        <div className="sp-right">
          <button className="sp-btn" title="عرض قيد التشغيل" onClick={toggleNowPlaying} style={{ color: contextView === 'now-playing' ? '#1db954' : '#b3b3b3' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.196 8l-4.696-3.605A.5.5 0 005.75 4.8v6.4a.5.5 0 00.75.395L11.196 8zM2.5 2A1.5 1.5 0 001 3.5v9A1.5 1.5 0 002.5 14h11a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013.5 2h-11zm0 1h11a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5z"/></svg>
          </button>
          <button className="sp-btn" title="طابور التشغيل" onClick={toggleQueue} style={{ color: contextView === 'queue' ? '#1db954' : '#b3b3b3' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 013.5 1h9a2.5 2.5 0 010 5h-9A2.5 2.5 0 011 3.5zm2.5-1a1 1 0 000 2h9a1 1 0 100-2h-9z"/></svg>
          </button>
          <div style={{ position: 'relative' }}>
            <button
              ref={deviceBtnRef}
              className="sp-btn"
              title="الاتصال بجهاز"
              onClick={() => setShowDevicePanel(p => !p)}
              style={{ color: showDevicePanel ? '#1db954' : '#b3b3b3' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15h-6.5A1.75 1.75 0 016 13.25V13H5v1.5a1.5 1.5 0 01-1.5 1.5h-2A1.5 1.5 0 010 14.5v-10A1.5 1.5 0 011.5 3h2A1.5 1.5 0 015 4.5V6h1V2.75zM7.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25h-6.5zm-6.25 2a.25.25 0 00-.25.25v10c0 .138.112.25.25.25h2a.25.25 0 00.25-.25v-10a.25.25 0 00-.25-.25h-2zM4 6.5A1.5 1.5 0 002.5 8 1.5 1.5 0 004 9.5 1.5 1.5 0 005.5 8 1.5 1.5 0 004 6.5z"/></svg>
            </button>

            {showDevicePanel && (
              <div style={{
                position: 'fixed',
                bottom: '90px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#282828',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                width: '340px',
                zIndex: 9999,
                overflow: 'hidden',
                animation: 'fadeInUp 0.2s ease'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>الاتصال</h3>
                  <button onClick={() => setShowDevicePanel(false)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>

                {/* Current device - browser */}
                <div style={{ padding: '0 12px 8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    background: 'rgba(29,185,84,0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1db954" style={{ flexShrink: 0 }}>
                      <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v1h12v-1l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1db954' }}>متصفح الويب هذا</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }}></div>

                {/* No other devices found */}
                <div style={{ padding: '8px 20px 4px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '0 0 16px' }}>لم يتم العثور على أي أجهزة أخرى</p>

                  {/* Tip 1: WiFi */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#b3b3b3">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>التحقق من شبكة WiFi لديك</div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.5' }}>اربط الأجهزة التي تستخدمها بشبكة WiFi نفسها.</div>
                    </div>
                  </div>

                  {/* Tip 2: Listen from another device */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <svg width="22" height="22" viewBox="0 0 16 16" fill="#b3b3b3">
                        <path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15h-6.5A1.75 1.75 0 016 13.25V13H5v1.5a1.5 1.5 0 01-1.5 1.5h-2A1.5 1.5 0 010 14.5v-10A1.5 1.5 0 011.5 3h2A1.5 1.5 0 015 4.5V6h1V2.75zM7.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25h-6.5zm-6.25 2a.25.25 0 00-.25.25v10c0 .138.112.25.25.25h2a.25.25 0 00.25-.25v-10a.25.25 0 00-.25-.25h-2zM4 6.5A1.5 1.5 0 002.5 8 1.5 1.5 0 004 9.5 1.5 1.5 0 005.5 8 1.5 1.5 0 004 6.5z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>الاستماع من جهاز آخر</div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.5' }}>سيظهر الجهاز تلقائياً هنا.</div>
                    </div>
                  </div>

                  {/* Tip 3: Switch to app */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#b3b3b3">
                        <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>التبديل إلى التطبيق</div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.5' }}>يستطيع التطبيق اكتشاف المزيد من الأجهزة.</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
                  <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1db954'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                  >
                    ألا يمكنك رؤية جهازك؟
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '93px' }}>
            <div className="sp-slider-wrapper">
              <div className="sp-slider-track">
                <div className="sp-slider-fill" style={{ width: `${volumePercent}%` }}></div>
              </div>
              <div className="sp-slider-thumb" style={{ right: `${volumePercent}%` }}></div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="sp-range"
              />
            </div>
            <button className="sp-btn" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.86 5.47a.75.75 0 00-1.06 1.06l1.47 1.47-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L16.39 8l1.47-1.47a.75.75 0 00-1.06-1.06l-1.47 1.47-1.47-1.47zM.5 5.5v5h3l5 4.5v-14l-5 4.5h-3z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z"/></svg>
              )}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
