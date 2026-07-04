"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';

function RadioPageContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids');
  const [dynamicBgColor, setDynamicBgColor] = useState('#3f3f3f');
  
  const { playTrack, currentTrack, isPlaying, togglePlayPause, isShuffle, toggleShuffle } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [reciters, setReciters] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [allReciters, setAllReciters] = useState<any[]>([]);
  const [recommendedRadios, setRecommendedRadios] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  // Extract color from mainReciter image
  useEffect(() => {
    const mainReciter = reciters[0];
    if (!mainReciter) return;
    
    const imageUrl = mainReciter.image_url || mainReciter.imageUrl;
    
    const generateFallback = () => {
      let fallback = '#3f3f3f';
      if (mainReciter.id) {
        const colors = ['#4a235a', '#154360', '#0e6251', '#7b241c', '#186a3b', '#b9770e'];
        fallback = colors[Number(mainReciter.id) % colors.length] || fallback;
      }
      setDynamicBgColor(fallback);
    };

    if (!imageUrl) {
      generateFallback();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          generateFallback();
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pixelData = ctx.getImageData(img.width / 2, img.height / 2, 1, 1).data;
        if (pixelData[0] !== undefined && pixelData[0] !== 0 && pixelData[1] !== 0) {
          const r = Math.max(0, pixelData[0] - 40);
          const g = Math.max(0, pixelData[1] - 40);
          const b = Math.max(0, pixelData[2] - 40);
          setDynamicBgColor(`rgb(${r}, ${g}, ${b})`);
        } else {
          generateFallback();
        }
      } catch (e) {
        console.warn("Could not extract color, using fallback", e);
        generateFallback();
      }
    };
    
    img.onerror = () => {
      generateFallback();
    };
  }, [reciters]);
  
  useEffect(() => {
    async function fetchRadioData() {
      if (!ids) {
        setLoading(false);
        return;
      }
      const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
      if (idArray.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data: fetchedReciters, error } = await supabase.from('reciters').select('*');
        if (error) throw error;
        if (!fetchedReciters) return;
        
        setAllReciters(fetchedReciters);
        const selectedReciters = idArray.map(id => fetchedReciters.find((r: any) => r.id == id)).filter(Boolean);
        setReciters(selectedReciters);
        
        // Generate recommended radios deterministically for client side to prevent hydration error
        const recommended = fetchedReciters
          .filter((r: any) => !idArray.includes(r.id))
          .sort(() => 0.5 - Math.random()) // Sort randomly ONLY in the effect
          .slice(0, 8)
          .map((r: any, i: number) => {
             const others = fetchedReciters.filter((or: any) => or.id !== r.id);
             const side1 = others[i % others.length];
             const side2 = others[(i + 1) % others.length];
             const gradients = ['aee4d7', 'f8e8b9', 'f8c0b9', 'e6d4f8', 'd4e4f8', 'f8d4e4'];
             const color = gradients[i % gradients.length];
             return { main: r, side1, side2, color };
          });
        setRecommendedRadios(recommended);

        // Fetch tracks for these reciters
        const { data: tracksData } = await supabase
          .from('audio_library')
          .select('*')
          .in('reciter_id', idArray)
          .limit(50);

        if (tracksData) {
          // Shuffle tracks to mix them
          const shuffled = [...tracksData].sort(() => 0.5 - Math.random());
          setTracks(shuffled);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRadioData();
  }, [ids]);

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.reciter_name || track.reciterName || track.artist || 'غير معروف',
      imageUrl: track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/150',
      audioUrl: track.audio_url || track.audioUrl || track.file_url || ''
    });
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      if (currentTrack && tracks.some(t => t.id == currentTrack.id)) {
        togglePlayPause();
      } else {
        handlePlayTrack(tracks[0]);
      }
    }
  };

  const isRadioPlaying = currentTrack && tracks.some(t => t.id == currentTrack.id) && isPlaying;

  if (loading) {
    return <div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>;
  }

  if (!ids || reciters.length === 0) {
    return <div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>تعذر العثور على المحطة.</div>;
  }

  const mainReciter = reciters[0];
  const sideReciter1 = reciters.length > 1 ? reciters[1] : null;
  const sideReciter2 = reciters.length > 2 ? reciters[2] : null;

  const totalMinutes = tracks.length * 6; // Average 6 minutes per track
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let durationText = '';
  if (hours > 0) {
    durationText += `حوالي ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : hours <= 10 ? 'ساعات' : 'ساعة'}`;
    if (minutes > 0) durationText += ` و ${minutes} دقيقة`;
  } else if (minutes > 0) {
    durationText += `حوالي ${minutes} دقيقة`;
  }

  return (
    <div className="content-inner" style={{ padding: 0, backgroundColor: 'var(--bg-panel)', minHeight: '100%' }}>
      <div style={{ backgroundImage: `linear-gradient(to bottom, ${dynamicBgColor} 0%, var(--bg-panel) 450px, transparent 450px)` }}>
      {/* Header */}
      <div className="track-page-header" style={{ background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.5) 100%)', display: 'flex', alignItems: 'flex-end', gap: '32px', padding: '24px 64px 32px 64px', height: '340px' }}>
        
        {/* Cover Square Card (Right side) */}
        <div style={{ width: '232px', height: '232px', flexShrink: 0, background: dynamicBgColor, position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '4px' }}>
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>راديو</span>
          </div>
          
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
            {sideReciter2 && <img src={sideReciter2.image_url || sideReciter2.imageUrl || 'https://via.placeholder.com/150'} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', transform: 'translateX(-50px)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1 }} />}
            {sideReciter1 && <img src={sideReciter1.image_url || sideReciter1.imageUrl || 'https://via.placeholder.com/150'} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', transform: 'translateX(50px)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1 }} />}
            <img src={mainReciter.image_url || mainReciter.imageUrl || 'https://via.placeholder.com/150'} alt="" style={{ width: sideReciter1 ? '120px' : '190px', height: sideReciter1 ? '120px' : '190px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 2 }} />
          </div>
        </div>

        {/* Info (Left side) */}
        <div className="track-page-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="track-page-type" style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>قائمة تشغيل علنية</span>
          
          <h1 className="track-page-title" style={{ fontSize: '72px', margin: '0 0 8px 0', fontWeight: '900', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.1' }}>
            راديو {mainReciter.name}
          </h1>
          
          <div className="track-page-meta" style={{ color: '#fff', fontSize: '14px', marginTop: '8px' }}>
            <span>مع {sideReciter1 ? sideReciter1.name : mainReciter.name}{sideReciter2 ? `، ${sideReciter2.name}` : ''} والمزيد</span>
          </div>

          <div className="track-page-meta" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>صوت الأحزان</span>
            <span className="dot" style={{ margin: '0 8px' }}>•</span>
            <span>{tracks.length > 0 ? `${tracks.length} مقطع، ${durationText}` : 'لا توجد مقاطع'}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="track-page-controls" style={{ background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '32px', padding: '24px 64px' }}>
        <button 
          className="big-play-btn"
          onClick={handlePlayAll}
          style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#1ed760', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          {isRadioPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          )}
        </button>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'rgba(255,255,255,0.6)' }}>
          {/* Shuffle Icon */}
          <button 
            onClick={toggleShuffle}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: isShuffle ? '#1ed760' : 'inherit' }} 
            onMouseEnter={(e) => !isShuffle && (e.currentTarget.style.color = '#fff')} 
            onMouseLeave={(e) => !isShuffle && (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: '32px', height: '32px' }}>
              <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z" />
              <path d="m7.5 10.723.98-1.167 1.795 2.14A2.25 2.25 0 0 0 11.999 12.5h1.921l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.92 14h-1.921a3.75 3.75 0 0 1-2.873-1.34l-1.627-1.937z" />
            </svg>
          </button>

          {/* Plus / Add Icon (Hollow circle with plus) */}
          <button 
            onClick={() => showToast('تم الحفظ في مكتبتك')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} 
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          
          {/* Download Icon (Toggle offline mode) */}
          <button 
            onClick={() => {
              setIsDownloaded(!isDownloaded);
              showToast(!isDownloaded ? 'تم تنزيل المحطة للاستماع بدون إنترنت' : 'تم إزالة المحطة من التنزيلات');
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: isDownloaded ? '#1ed760' : 'inherit' }} 
            onMouseEnter={(e) => !isDownloaded && (e.currentTarget.style.color = '#fff')} 
            onMouseLeave={(e) => !isDownloaded && (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            {isDownloaded ? (
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '32px', height: '32px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M16 11l-4 4-4-4m4 4V7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="8 12 12 16 16 12" />
                <line x1="12" y1="8" x2="12" y2="16" />
              </svg>
            )}
          </button>

          {/* More Options Menu */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: showMenu ? '#fff' : 'inherit' }} 
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} 
              onMouseLeave={(e) => !showMenu && (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            
            {showMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#282828',
                  borderRadius: '4px',
                  boxShadow: '0 16px 24px rgba(0,0,0,0.5)',
                  minWidth: '200px',
                  zIndex: 100,
                  padding: '4px'
                }}
              >
                <div 
                  className="menu-item"
                  style={{ padding: '12px 16px', color: '#fff', fontSize: '14px', cursor: 'pointer', borderRadius: '2px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('تم نسخ رابط المحطة');
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  نسخ الرابط
                </div>
                <div 
                  className="menu-item"
                  style={{ padding: '12px 16px', color: '#fff', fontSize: '14px', cursor: 'pointer', borderRadius: '2px' }}
                  onClick={() => showToast('تمت الإضافة لقائمة الانتظار')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  إضافة لقائمة الانتظار
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="track-page-content" style={{ paddingBottom: '80px', backgroundColor: 'var(--bg-panel)' }}>
        {tracks.length > 0 ? (
          <div className="section-container">
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px', color: '#b3b3b3', fontSize: '14px', borderBottom: '1px solid #2a2a2a', paddingBottom: '8px', marginBottom: '16px', padding: '0 16px' }}>
              <div className="col-index">#</div>
              <div className="col-info">العنوان</div>
              <div className="col-plays" style={{textAlign: 'right'}}>الاستماعات</div>
              <div className="col-actions" style={{justifyContent: 'flex-end'}}>
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M8 3.25a.75.75 0 0 1 .75.75v3.25H11a.75.75 0 0 1 0 1.5H7.25V4A.75.75 0 0 1 8 3.25z"></path></svg>
              </div>
            </div>

            {tracks.map((track, index) => {
              const plays = track.listen_count || track.listenCount || Math.floor(Math.random() * 10000) + 1000;
              const trackArtist = track.reciter_name || track.reciterName || track.artist || 'غير معروف';
              const isPlayingTrack = currentTrack?.id === track.id;
              return (
              <div key={track.id + '-' + index} className="track-list-row" onClick={() => handlePlayTrack(track)} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px' }}>
                <div className="col-index" style={{ alignSelf: 'center' }}>
                  {isPlayingTrack ? (
                    <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                    </div>
                  ) : (
                    <span className="index-number">{index + 1}</span>
                  )}
                  <span className="index-play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                  </span>
                </div>
                <div className="col-info">
                  <img src={track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/40'} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ color: isPlayingTrack ? '#1db954' : '#fff', fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title || track.name}</span>
                    <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trackArtist}</span>
                  </div>
                </div>
                <div className="col-plays" style={{ alignSelf: 'center', textAlign: 'right' }}>
                  {plays.toLocaleString()}
                </div>
                <div className="col-actions" style={{ alignSelf: 'center', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  <button title="إضافة إلى قائمة الأغاني">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path></svg>
                  </button>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div style={{ color: '#b3b3b3', padding: '0 16px' }}>لا توجد مقاطع في هذه المحطة.</div>
        )}
      </div>

      {/* Recommended Section */}
      {recommendedRadios.length > 0 && (
        <div style={{ padding: '0 64px 64px 64px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '24px' }}>قد يعجبك أيضاً</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {recommendedRadios.slice(0, 8).map((radio, i) => (
              <div 
                key={`rec-radio-${i}`} 
                className="spotify-card" 
                style={{ background: '#181818', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s' }}
                onClick={() => window.location.href = `/radio?ids=${radio.main.id},${radio.side1.id},${radio.side2.id}&color=${radio.color}`}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
              >
                <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '6px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <img src={radio.main.image_url || radio.main.imageUrl || 'https://via.placeholder.com/300'} alt={radio.main.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{radio.main.name}</h3>
                <p style={{ fontSize: '14px', color: '#a7a7a7', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>راديو مخصص</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
      </div>
    </div>
  );
}

export default function RadioPage() {
  return (
    <Suspense fallback={<div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>}>
      <RadioPageContent />
    </Suspense>
  );
}
