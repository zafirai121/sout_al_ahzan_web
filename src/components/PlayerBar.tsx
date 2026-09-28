import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { downloadTrack } from '@/utils/download';
import { thumb } from '@/utils/image';
import { Heart, Download, LoaderCircle, Shuffle, SkipBack, SkipForward, Play, Pause, Repeat, Repeat1, SquarePlay, ListMusic, MonitorSpeaker, Volume1, Volume2, VolumeX } from 'lucide-react';

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
    toggleQueue,
    toggleDevices,
    duration,
    audioRef,
    volume,
    isMuted,
    seekTo,
    setVolume,
    setIsMuted,
  } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();

  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDownload = async () => {
    if (!currentTrack || isDownloading) return;
    setIsDownloading(true);
    const result = await downloadTrack(currentTrack.audioUrl, `${currentTrack.title} - ${currentTrack.artist}`);
    if (result === 'SUCCESS') {
      showToast('تم التنزيل بنجاح!');
    } else if (result === 'CORS_FALLBACK') {
      showToast("تم فتح المقطع في نافذة جديدة. اضغط على ⋮ واختر 'تنزيل'.");
    } else {
      showToast('حدث خطأ أثناء التنزيل.');
    }
    setIsDownloading(false);
  };

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    let animationFrameId: number;

    const updateProgress = () => {
      if (!isDragging && audio) {
        setProgress(audio.currentTime);
      }
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    } else {
      if (!isDragging && audio) {
        setProgress(audio.currentTime);
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef?.current, isDragging, isPlaying]);

  const displayProgress = isDragging ? localProgress : progress;
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(Number(e.target.value));
  };

  const handleSeekCommit = () => {
    if (audioRef?.current) {
      // Temporarily set progress to avoid jump back before audio updates
      setProgress(localProgress);
      seekTo(localProgress);
    }
    // Delay resetting isDragging to avoid jumping back from an old timeupdate event
    setTimeout(() => {
      setIsDragging(false);
    }, 150);
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

  const progressPercent = duration ? (displayProgress / duration) * 100 : 0;
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
          position: relative;
        }
        .sp-play-btn:hover {
          transform: scale(1.05);
          color: #000;
          background-color: #fff;
        }
        .sp-play-btn.download-active::before {
          content: '';
          position: absolute;
          top: -4px; left: -4px; right: -4px; bottom: -4px;
          border-radius: 50%;
          border: 2px solid rgba(29, 185, 84, 0.3);
          border-top-color: #1db954;
          animation: sp-spin 1s linear infinite;
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
          position: absolute;
          right: 0;
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
          transform: translate(50%, -50%);
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
          direction: ltr !important;
          transform: scaleX(-1);
        }
        .sp-right {
          justify-content: flex-end;
          gap: 16px;
        }
        @keyframes sp-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sp-animate-spin {
          animation: sp-spin 1s linear infinite;
        }
      `}} />

      <footer className="sleek-player" dir="rtl">

        {/* Right side in RTL (Track Info) */}
        <div className="sp-left">
          <div className="sp-track-info">
            <div className="sp-cover">
              {currentTrack.imageUrl ? (
                <img src={thumb(currentTrack.imageUrl, 56)} alt={currentTrack.title} />
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
                <Heart size={18} fill="currentColor" strokeWidth={2} />
              ) : (
                <Heart size={18} strokeWidth={2} />
              )}
            </button>
            <button 
              className="sp-btn" 
              style={{ marginRight: '8px', color: isDownloading ? '#1db954' : '#b3b3b3' }} 
              title="تنزيل المقطع"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <LoaderCircle className="sp-animate-spin" size={18} strokeWidth={2} />
              ) : (
                <Download size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Center (Controls & Progress) */}
        <div className="sp-center">
          <div className="sp-controls">
            <button className="sp-btn" title="تبديل عشوائي" onClick={toggleShuffle} style={{ color: isShuffle ? '#1db954' : '#b3b3b3' }}>
              <Shuffle size={18} strokeWidth={2} />
            </button>
            
            <button className="sp-btn" title="السابق" onClick={playPrevious} disabled={queue.length <= 1}>
              <SkipBack size={18} fill="currentColor" strokeWidth={2} />
            </button>
            
            <button className={`sp-btn sp-play-btn ${isDownloading ? 'download-active' : ''}`} onClick={togglePlayPause} title={isPlaying ? "إيقاف" : "تشغيل"}>
              {isPlaying ? (
                <Pause size={18} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={18} fill="currentColor" strokeWidth={0} style={{ marginLeft: '2px' }} />
              )}
            </button>
            
            <button className="sp-btn" title="التالي" onClick={playNext} disabled={queue.length <= 1}>
              <SkipForward size={18} fill="currentColor" strokeWidth={2} />
            </button>
            
            <button className="sp-btn" title="تكرار" onClick={toggleRepeat} style={{ color: isRepeat ? '#1db954' : '#b3b3b3' }}>
              {isRepeat ? <Repeat1 size={18} strokeWidth={2} /> : <Repeat size={18} strokeWidth={2} />}
            </button>
          </div>
          
          <div className="sp-progress-container">
            <span className="sp-time">{formatTime(progress)}</span>
            <div className={`sp-slider-wrapper ${isDragging ? 'dragging' : ''}`}>
              <div className="sp-slider-track">
                <div className="sp-slider-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="sp-slider-thumb" style={{ right: `${progressPercent}%` }}></div>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="any"
                value={displayProgress}
                onMouseDown={() => { setIsDragging(true); setLocalProgress(displayProgress); }}
                onTouchStart={() => { setIsDragging(true); setLocalProgress(displayProgress); }}
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
            <SquarePlay size={18} strokeWidth={2} />
          </button>
          <button className="sp-btn" title="طابور التشغيل" onClick={toggleQueue} style={{ color: contextView === 'queue' ? '#1db954' : '#b3b3b3' }}>
            <ListMusic size={18} strokeWidth={2} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="sp-btn"
              title="الاتصال بجهاز"
              onClick={toggleDevices}
              style={{ color: contextView === 'devices' ? '#1db954' : '#b3b3b3' }}
            >
              <MonitorSpeaker size={18} strokeWidth={2} />
            </button>
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
                <VolumeX size={18} strokeWidth={2} />
              ) : (
                volume < 0.5 ? <Volume1 size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2e77d0',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: '1.5'
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
