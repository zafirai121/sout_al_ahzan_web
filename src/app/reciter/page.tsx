"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePlayer } from '@/context/PlayerContext';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ReciterContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const [reciter, setReciter] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [similarReciters, setSimilarReciters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgColor, setBgColor] = useState('#3f3f3f');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { playTrack, currentTrack, isPlaying, togglePlayPause, playQueue, isShuffle, toggleShuffle } = usePlayer();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: reciterData, error: reciterError } = await supabase
          .from('reciters')
          .select('*')
          .eq('id', id)
          .single();

        if (reciterError) throw reciterError;
        setReciter(reciterData);

        const reciterName = reciterData.name;
        const reciterId = reciterData.id?.toString();
        
        // Try multiple strategies to find matching tracks
        let finalTracks: any[] = [];

        // Strategy 1: match by reciter_id field
        const byIdResult = await supabase
          .from('audio_library')
          .select('*')
          .eq('reciter_id', reciterId);
        if (!byIdResult.error && byIdResult.data && byIdResult.data.length > 0) {
          finalTracks = byIdResult.data;
        }

        // Strategy 2: case-insensitive name match on reciter_name
        if (finalTracks.length === 0) {
          const byNameResult = await supabase
            .from('audio_library')
            .select('*')
            .ilike('reciter_name', `%${reciterName}%`);
          if (!byNameResult.error && byNameResult.data && byNameResult.data.length > 0) {
            finalTracks = byNameResult.data;
          }
        }

        // Strategy 3: case-insensitive on reciterName (camelCase column)
        if (finalTracks.length === 0) {
          const byCamelResult = await supabase
            .from('audio_library')
            .select('*')
            .ilike('reciterName', `%${reciterName}%`);
          if (!byCamelResult.error && byCamelResult.data && byCamelResult.data.length > 0) {
            finalTracks = byCamelResult.data;
          }
        }

        setTracks(finalTracks);

        const { data: similarRecitersData } = await supabase
          .from('reciters')
          .select('*')
          .neq('id', id)
          .limit(6);
          
        if (similarRecitersData) {
          setSimilarReciters(similarRecitersData);
        }

      } catch (error) {
        console.error("Error fetching reciter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (reciter) {
      const colors = ['#d97736', '#2e77d0', '#8d67ab', '#1ed760', '#af2896', '#503d29', '#e8115b', '#006450', '#8400e7'];
      const hash = reciter?.id ? Array.from(reciter.id.toString()).reduce((acc: number, char: any) => acc + String(char).charCodeAt(0), 0) : 0;
      const fallback = colors[hash % colors.length];
      setBgColor(fallback);

      const rImg = reciter.image_url || reciter.imageUrl;
      if (!rImg) return;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          try {
            const data = ctx.getImageData(0, 0, 1, 1).data;
            setBgColor(`rgb(${data[0]}, ${data[1]}, ${data[2]})`);
          } catch (e) {
            console.error("CORS error getting image data", e);
          }
        }
      };
      img.src = rImg;
    }
  }, [reciter]);

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
        const queueTracks = tracks.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.reciter_name || t.reciterName || t.artist || 'غير معروف',
          imageUrl: t.thumbnailUrl || t.thumbnail_url || t.imageUrl || t.image_url || 'https://via.placeholder.com/150',
          audioUrl: t.audio_url || t.audioUrl || t.file_url || ''
        }));
        playQueue(queueTracks, 0);
      }
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length > 0) {
      const queueTracks = tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.reciter_name || t.reciterName || t.artist || 'غير معروف',
        imageUrl: t.thumbnailUrl || t.thumbnail_url || t.imageUrl || t.image_url || 'https://via.placeholder.com/150',
        audioUrl: t.audio_url || t.audioUrl || t.file_url || ''
      }));
      const shuffled = [...queueTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
      if (!isShuffle) toggleShuffle();
    }
  };

  const MenuItem = ({ text, icon, onClick, hasArrow = false }: { text: string, icon: React.ReactNode, onClick: () => void, hasArrow?: boolean }) => (
    <div 
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderRadius: '4px', transition: '0.2s', backgroundColor: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#eaeaea' }}>
        {icon}
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{text}</span>
      </div>
      {hasArrow && <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M10 12L6 8l4-4v8z"/></svg>}
    </div>
  );

  const isReciterPlaying = currentTrack && tracks.some(t => t.id == currentTrack.id) && isPlaying;

  if (loading) {
    return <div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>;
  }

  if (!reciter) {
    return (
      <div className="content-inner" style={{ padding: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '24px' }}>الرادود غير موجود</h2>
      </div>
    );
  }

  const reciterImg = reciter.image_url || reciter.imageUrl || 'https://via.placeholder.com/250';
  const topTracks = tracks.slice(0, 10);
  const latestTracks = [...tracks].reverse().slice(0, 6);
  const recommendedTracks = tracks.length > 10 ? tracks.slice(10, 16) : tracks.slice(0, 6);

  const renderTrackCard = (track: any) => {
    const tImg = track.thumbnailUrl || track.thumbnail_url || track.imageUrl || track.image_url || 'https://via.placeholder.com/150';
    return (
      <div key={track.id} className="card" onClick={() => handlePlayTrack(track)}>
        <div className="card-img-container square">
          <div className="placeholder-bg" style={{ backgroundImage: `url(${tImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <button className="play-btn" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          </button>
        </div>
        <p className="card-title">{track.title || track.name}</p>
        <p className="card-subtitle">{track.reciter_name || track.reciterName || reciter.name}</p>
      </div>
    );
  };

  const renderReciterCard = (r: any) => {
    const rImg = r.image_url || r.imageUrl || 'https://via.placeholder.com/150';
    return (
      <div key={r.id} className="card" onClick={() => router.push(`/reciter?id=${r.id}`)}>
        <div className="card-img-container circle">
          <div className="placeholder-bg" style={{ backgroundImage: `url(${rImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        </div>
        <p className="card-title" style={{ textAlign: 'center' }}>{r.name}</p>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>رادود</p>
      </div>
    );
  };

  return (
    <div className="content-inner" style={{ padding: 0, backgroundColor: 'var(--bg-panel)', minHeight: '100%' }}>
      <div style={{ backgroundImage: `linear-gradient(to bottom, ${bgColor} 0%, var(--bg-panel) 450px, transparent 450px)` }}>
      {/* Header */}
      <div className="track-page-header" style={{ background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.5) 100%)', display: 'flex', alignItems: 'center', padding: '24px 64px 32px 64px' }}>
        <div style={{ 
          width: '232px', height: '232px', 
          borderRadius: '50%', 
          backgroundImage: `url(${reciterImg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 4px 60px rgba(0,0,0,0.5)',
          marginLeft: '24px'
        }}></div>
        <div className="track-page-info">
          <span className="track-page-type">رادود</span>
          <h1 className="track-page-title">{reciter.name}</h1>
          <div className="track-page-meta">
            <span>{tracks.length} مقطع</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="track-page-controls" style={{ background: 'rgba(0,0,0,0.1)', padding: '24px 64px', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <button 
          className="big-play-btn"
          onClick={handlePlayAll}
          style={{ opacity: tracks.length > 0 ? 1 : 0.5, cursor: tracks.length > 0 ? 'pointer' : 'not-allowed' }}
        >
          {isReciterPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          )}
        </button>

        <button 
          style={{ background: 'none', border: 'none', color: isShuffle ? '#1db954' : '#b3b3b3', cursor: 'pointer', transition: '0.2s', padding: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.color = isShuffle ? '#1ed760' : '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = isShuffle ? '#1db954' : '#b3b3b3'}
          onClick={handleShufflePlay}
          title="تشغيل عشوائي"
        >
          <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.527 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.953l-1.017-1.018a.75.75 0 1 1 1.06-1.06L15.98 13.25l-2.828 2.828a.75.75 0 1 1-1.06-1.06l1.017-1.018H11.16a2.25 2.25 0 0 1-1.724-.804l-1.8-2.14.98-1.166 1.8 2.14a3.75 3.75 0 0 0 2.744.96z"></path>
          </svg>
        </button>
        
        <button 
          style={{ 
            background: 'transparent', 
            border: isFollowing ? '1px solid #fff' : '1px solid #727272', 
            color: '#fff', 
            borderRadius: '9999px', 
            padding: '6px 15px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            transition: '0.2s',
            letterSpacing: '1px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid #fff'; e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.border = isFollowing ? '1px solid #fff' : '1px solid #727272'; e.currentTarget.style.transform = 'scale(1)'; }}
          onClick={() => setIsFollowing(!isFollowing)}
        >
          {isFollowing ? 'أتابع' : 'متابعة'}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            style={{ background: 'none', border: 'none', color: showMenu ? '#fff' : '#b3b3b3', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => { if (!showMenu) e.currentTarget.style.color = '#b3b3b3'; }}
            onClick={() => setShowMenu(!showMenu)}
            title="خيارات إضافية"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
          </button>
          
          {showMenu && (
            <>
              <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99}} onClick={() => setShowMenu(false)} />
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                marginTop: '8px',
                backgroundColor: '#282828',
                borderRadius: '4px',
                boxShadow: '0 16px 24px rgba(0,0,0,0.3)',
                padding: '4px',
                width: '320px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <MenuItem 
                  text={isFollowing ? 'إلغاء المتابعة' : 'متابعة'} 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M10.8 4a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0zm1.5 0a4.3 4.3 0 1 0-8.6 0 4.3 4.3 0 0 0 8.6 0zM8 8a5.2 5.2 0 0 0-4.9 3.5H1.5A6.7 6.7 0 0 1 8 6.5a6.7 6.7 0 0 1 6.5 5h-1.6A5.2 5.2 0 0 0 8 8zm6.5 4v-1.5h-1.5V12H11.5v1.5H13V15h1.5v-1.5h1.5z"/></svg>} 
                  onClick={() => { setIsFollowing(!isFollowing); setShowMenu(false); }} 
                />
                <MenuItem 
                  text="لا أريد الاستماع إلى هذا الفنان/هذه الفنانة" 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/><path d="M12.25 11.19L4.81 3.75l1.06-1.06 7.44 7.44-1.06 1.06z"/></svg>} 
                  onClick={() => { alert("قيد التطوير"); setShowMenu(false); }} 
                />
                <MenuItem 
                  text="الانتقال إلى راديو الفنان" 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10.97 6.03a4.2 4.2 0 0 0-5.94 0l-1.06-1.06a5.7 5.7 0 0 1 8.06 0l-1.06 1.06zM13.1 3.9a7.2 7.2 0 0 0-10.2 0L1.84 2.84a8.7 8.7 0 0 1 12.32 0l-1.06 1.06z"/></svg>} 
                  onClick={() => { router.push(`/radio?ids=${reciter.id}`); setShowMenu(false); }} 
                />
                <MenuItem 
                  text="إبلاغ عن المحتوى" 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M7.25 9V4h1.5v5h-1.5zm0 3v-1.5h1.5V12h-1.5zM4.146 1.5l7.708 0 3.646 3.646 0 7.708-3.646 3.646-7.708 0L.5 12.854V5.146L4.146 1.5zM4.768 3l-2.768 2.768v4.464L4.768 13h4.464l2.768-2.768V5.768L9.232 3H4.768z"/></svg>} 
                  onClick={() => { alert("تم الإبلاغ بنجاح"); setShowMenu(false); }} 
                />
                
                <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }}></div>
                
                <MenuItem 
                  text="مشاركة" 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M12.5 11.5v2H2v-10h4v-1.5H.5v13h13.5v-3.5h-1.5z"/><path d="M10.2 3.5l1.24 1.24-5.32 5.32 1.06 1.06 5.32-5.32 1.24 1.24V3.5h-3.54z"/></svg>} 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); alert("تم نسخ رابط الصفحة بنجاح!"); setShowMenu(false); }} 
                  hasArrow={true}
                />
                
                <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }}></div>
                
                <MenuItem 
                  text="الاستماع على تطبيق الكمبيوتر" 
                  icon={<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zM11.66 11.23a.47.47 0 0 1-.65.15c-1.78-1.09-4.02-1.34-6.66-.73a.47.47 0 1 1-.22-.92c2.9-.67 5.37-.39 7.38.84a.47.47 0 0 1 .15.66zm.93-2.19a.59.59 0 0 1-.8.19c-2.03-1.25-5.14-1.62-7.51-.89a.59.59 0 0 1-.35-1.12c2.72-.84 6.13-.42 8.47 1.02a.59.59 0 0 1 .19.8zm.05-2.29c-2.43-1.44-6.44-1.58-8.77-.87a.71.71 0 1 1-.41-1.35c2.68-.82 7.14-.65 9.94 1.01a.71.71 0 1 1-.76 1.21z"/></svg>} 
                  onClick={() => { alert("سيتم توفير تطبيق الكمبيوتر قريباً!"); setShowMenu(false); }} 
                />
              </div>
            </>
          )}
        </div>
      </div>

      </div>

      <div className="track-page-content" style={{ paddingBottom: '80px', backgroundColor: 'var(--bg-panel)' }}>
        {/* Section 1: Top 10 Vertical */}
        {topTracks.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h2>الأكثر استماعاً</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px', color: '#b3b3b3', fontSize: '14px', borderBottom: '1px solid #2a2a2a', paddingBottom: '8px', marginBottom: '16px', padding: '0 16px' }}>
              <div className="col-index">#</div>
              <div className="col-info">العنوان</div>
              <div className="col-plays" style={{textAlign: 'right'}}>الاستماعات</div>
              <div className="col-actions" style={{justifyContent: 'flex-end'}}>
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M8 3.25a.75.75 0 0 1 .75.75v3.25H11a.75.75 0 0 1 0 1.5H7.25V4A.75.75 0 0 1 8 3.25z"></path></svg>
              </div>
            </div>

            {topTracks.map((track, index) => {
              const plays = track.listen_count || track.listenCount || Math.floor(Math.random() * 10000) + 1000;
              const isPlayingTrack = currentTrack?.id === track.id;
              return (
              <div key={track.id} className="track-list-row" onClick={() => handlePlayTrack(track)} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px' }}>
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
                    <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.reciter_name || track.reciterName || reciter.name}</span>
                  </div>
                </div>
                <div className="col-plays" style={{ alignSelf: 'center', textAlign: 'right' }}>
                  {plays.toLocaleString()}
                </div>
                <div className="col-actions" style={{ alignSelf: 'center', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  <button title="إضافة إلى قائمة الأغاني">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path></svg>
                  </button>
                  <span style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 8px' }}>3:45</span>
                  <button title="المزيد من الخيارات">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path></svg>
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Section 2: Latest Tracks (Horizontal) */}
        {latestTracks.length > 0 && (
          <div className="section-container" style={{ marginTop: '48px' }}>
            <div className="section-header">
              <h2>أحدث الإصدارات</h2>
            </div>
            <div className="cards-row">
              {latestTracks.map(renderTrackCard)}
            </div>
          </div>
        )}

        {/* Section 3: Recommended Tracks (Horizontal) */}
        {recommendedTracks.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h2>مقاطع مقترحة</h2>
            </div>
            <div className="cards-row">
              {recommendedTracks.map(renderTrackCard)}
            </div>
          </div>
        )}

        {/* Section 4: Similar Reciters (Horizontal) */}
        {similarReciters.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h2>معجبون بهذا الرادود يستمعون أيضاً إلى</h2>
            </div>
            <div className="cards-row">
              {similarReciters.map(renderReciterCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReciterPage() {
  return (
    <Suspense fallback={<div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>}>
      <ReciterContent />
    </Suspense>
  );
}
