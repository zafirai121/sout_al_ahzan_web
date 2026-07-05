"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const router = useRouter();

  const [poems, setPoems] = useState<any[]>([]);
  const [popularPoems, setPopularPoems] = useState<any[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [fridayTracks, setFridayTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const recentScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [recentRes, popularRes, recitersRes, fridayRes] = await Promise.all([
          supabase.from('audio_library').select('*').order('id', { ascending: false }).limit(30),
          supabase.from('audio_library').select('*').order('listen_count', { ascending: false }).limit(20),
          supabase.from('reciters').select('*').limit(20),
          supabase.from('audio_library').select('*').in('category', ['dua', 'quran', 'أدعية ومناجاة', 'قرآن', 'adhkar']).limit(20)
        ]);
        
        if (recentRes.data) setPoems(recentRes.data);
        if (popularRes.data) setPopularPoems(popularRes.data);
        if (recitersRes.data) setReciters(recitersRes.data);
        if (fridayRes.data) setFridayTracks(fridayRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to get time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "طاب صباحك";
    } else {
      return "طاب مساؤك";
    }
  };

  // Helper to get daily message
  const getDailyMessage = () => {
    const day = new Date().getDay();
    switch (day) {
      case 0: return "بداية أسبوع مباركة، وقت للروحانية";
      case 1: return "يوم الإثنين، تجديد العهد والنية";
      case 2: return "الثلاثاء، سكينة وطمأنينة";
      case 3: return "منتصف الأسبوع، استمر في العطاء الروحي";
      case 4: return "ليلة الجمعة تقترب، وقت للخشوع والدعاء";
      case 5: return "إنه الجمعة، يوم الدعاء وقراءة القرآن";
      case 6: return "يوم السبت، راحة وسلام داخلي";
      default: return "يوم مبارك";
    }
  };

  // Helper to extract fields based on data models
  const getTrackData = (item: any) => ({
    id: item.id?.toString(),
    title: item.title || 'بدون عنوان',
    artist: item.reciterName || item.artist || item.reciter_name || 'مجهول',
    audioUrl: item.audioUrl || item.file_url || item.url || '',
    imageUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80',
    plays: item.listen_count || item.listenCount || 0,
    reciterId: item.reciter_id || item.reciterId || item.artist_id || item.artistId || ''
  });

  const getReciterData = (item: any) => ({
    id: item.id?.toString(),
    name: item.name || 'بدون اسم',
    imageUrl: item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80',
  });

  const handlePlay = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const track = getTrackData(item);
    if (currentTrack?.id == track.id) {
      togglePlayPause();
      return;
    }
    if (!track.audioUrl) {
      alert("عذراً، الرابط الصوتي غير متوفر لهذا المقطع.");
      return;
    }
    playTrack(track);
  };

  const goToTrack = (id: string) => {
    router.push(`/track?id=${id}`);
  };

  const renderPoemCard = (item: any) => {
    const track = getTrackData(item);
    return (
      <div key={`poem-${track.id}`} className="card" onClick={() => goToTrack(track.id)}>
        <div className="card-img-container">
          <div className="placeholder-bg" style={{ backgroundImage: `url(${track.imageUrl})`, backgroundSize: 'cover' }}></div>
          <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
            {currentTrack?.id == track.id && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            )}
          </button>
        </div>
        <p className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
        <p className="card-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
      </div>
    );
  };

  const renderReciterCard = (item: any) => {
    const reciter = getReciterData(item);
    return (
      <div key={reciter.id} className="card" onClick={() => router.push(`/reciter?id=${reciter.id}`)}>
        <div className="card-img-container circle">
          <div className="placeholder-bg" style={{ backgroundImage: `url(${reciter.imageUrl})`, backgroundSize: 'cover' }}></div>
          <button className="play-btn" onClick={(e) => { e.stopPropagation(); router.push(`/reciter?id=${reciter.id}`); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          </button>
        </div>
        <p className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{reciter.name}</p>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>فنان</p>
      </div>
    );
  };

  const renderShortcutCard = (item: any) => {
    const track = getTrackData(item);
    return (
      <div key={track.id} className="shortcut-card" onClick={(e) => handlePlay(e, item)}>
        <div style={{ width: '64px', height: '64px', flexShrink: 0 }}>
          <img src={track.imageUrl} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ padding: '0 16px', flex: 1 }}>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
        </div>
        <button className="play-btn shortcut-play-btn" onClick={(e) => handlePlay(e, item)} style={{ marginRight: 'auto', marginLeft: '16px', position: 'static', opacity: 0 }}>
            {currentTrack?.id == track.id && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            )}
        </button>
      </div>
    );
  };

  const renderHorizontalCard = (item: any) => {
    const track = getTrackData(item);
    return (
      <div 
        key={`horiz-${track.id}`} 
        onClick={(e) => handlePlay(e, item)} 
        style={{ 
          position: 'relative', 
          height: '240px', 
          width: '85vw',
          maxWidth: '350px',
          flexShrink: 0,
          borderRadius: '8px', 
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          const btn = e.currentTarget.querySelector('.play-btn') as HTMLElement;
          if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          const btn = e.currentTarget.querySelector('.play-btn') as HTMLElement;
          if (btn) { btn.style.opacity = '0'; btn.style.transform = 'translateY(8px)'; }
        }}
      >
        <img src={track.imageUrl} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        
        <div style={{ 
          position: 'absolute', 
          bottom: 0, left: 0, right: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', 
          padding: '32px 16px 16px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{track.title}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{track.artist}</p>
          </div>
          
          <button className="play-btn" onClick={(e) => handlePlay(e, item)} style={{ position: 'relative', right: 0, bottom: 0, opacity: 0, transform: 'translateY(8px)', transition: 'all 0.3s', flexShrink: 0, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentTrack?.id == track.id && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderListItem = (item: any, i: number) => {
    const track = getTrackData(item);
    return (
      <div key={track.id} className="list-item" onClick={() => goToTrack(track.id)}>
        <div className="list-item-left">
          <span className="list-index">{i + 1}</span>
          <div className="list-img-container">
            <div className="placeholder-bg" style={{ backgroundImage: `url(${track.imageUrl})`, backgroundSize: 'cover' }}></div>
          </div>
          <div className="list-text">
            <p className="card-title">{track.title}</p>
            <p className="card-subtitle">{track.artist}</p>
          </div>
        </div>
        <div className="list-item-right">
          <span className="duration" style={{ marginLeft: '16px' }}>{track.plays} استماع</span>
          <span className="duration">M:SS</span>
        </div>
      </div>
    );
  };

  const renderTopChartItem = (item: any, i: number) => {
    const track = getTrackData(item);
    return (
      <div key={track.id} className="top-chart-item" onClick={() => goToTrack(track.id)}>
        <span className="top-chart-index">{i + 1}</span>
        <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden' }}>
          <img src={track.imageUrl} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{track.title}</p>
          <p style={{ color: '#b3b3b3', fontSize: '14px', margin: 0 }}>{track.artist}</p>
        </div>
        <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
          {track.plays} استماع
        </div>
      </div>
    );
  };

  const renderRecentTrack = (item: any, globalIndex: number) => {
    const track = getTrackData(item);
    const isTopThree = globalIndex < 3;
    const plays = track.plays || 0;
    
    return (
      <div 
        key={`recent-${track.id}-${globalIndex}`} 
        className="recent-track-row" 
        onClick={(e) => handlePlay(e, item)}
        style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s', gap: '16px' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <img src={track.imageUrl} alt={track.title} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</span>
          <span style={{ color: '#b3b3b3', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</span>
        </div>
        
        <div style={{ marginRight: 'auto', color: '#b3b3b3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {plays} استماع
        </div>
      </div>
    );
  };

  const renderWideCard = (item: any, title: string, subtitle: string) => {
    const track = getTrackData(item);
    return (
      <div key={`wide-${track.id}`} className="wide-card" onClick={() => goToTrack(track.id)}>
        <img src={track.imageUrl} alt={track.title} className="wide-card-img" />
        <div className="wide-card-content" style={{ padding: '16px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{subtitle}</p>
        </div>
      </div>
    );
  };

  const renderMixCard = (rawTrack: any, mixName: string, gradient: string) => {
    const track = getTrackData(rawTrack);
    return (
      <div key={`mix-${track.id}`} className="mix-card" style={{ background: gradient }} onClick={() => {
        if (track.reciterId) {
          router.push(`/radio?ids=${track.reciterId}`);
        } else {
          goToTrack(track.id);
        }
      }}>
        <img src={track.imageUrl} alt={mixName} className="mix-card-image" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 className="mix-card-title">{mixName}</h3>
          <p className="mix-card-subtitle">ميكس مخصص لك بناءً على استماعك لـ {track.artist}</p>
        </div>
      </div>
    );
  };

  const renderStationCard = (mainReciter: any, sideReciters: any[], gradient: string) => {
    if (!mainReciter) return null;
    const r1 = getReciterData(mainReciter);
    const r2 = sideReciters[0] ? getReciterData(sideReciters[0]) : r1;
    const r3 = sideReciters[1] ? getReciterData(sideReciters[1]) : r1;
    
    return (
      <div key={`station-${r1.id}`} className="mix-card" style={{ background: gradient, cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={() => router.push(`/radio?ids=${r1.id},${r2.id},${r3.id}&color=${gradient.replace(/linear-gradient\(135deg,\s*([^,]+),\s*[^)]+\)/, '$1').replace('#', '')}`)}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', opacity: 0.8 }}>راديو</span>
        </div>
        
        {/* The 3 intersecting circles */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
          {/* Left circle */}
          <img src={r3.imageUrl} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', transform: 'translateX(-45px)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1 }} />
          {/* Right circle */}
          <img src={r2.imageUrl} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', transform: 'translateX(45px)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1 }} />
          {/* Center circle (Main) */}
          <img src={r1.imageUrl} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', position: 'absolute', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 2 }} />
        </div>

        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2 }}>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#000', margin: '0 0 4px 0', textShadow: 'none', textAlign: 'center' }}>{r1.name}</h3>
          <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.7)', margin: 0, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            مع {r2.name}، {r3.name}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    );
  }

  return (
    <div className="content-inner">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-banner-icon">
            <svg width="50" height="50" viewBox="0 0 100 100">
              <text x="50" y="80" fontSize="90" fontWeight="900" fontStyle="italic" fontFamily="Arial, Impact, sans-serif" fill="#F05B28" textAnchor="middle">S</text>
            </svg>
          </div>
          <div>
            <h2 className="welcome-banner-title">مرحباً بك في منصة صوت الأحزان</h2>
            <p className="welcome-banner-subtitle">المنصة الأولى للاستماع للقصائد واللطميات الحسينية بجودة عالية وبدون إعلانات.</p>
          </div>
        </div>
        <button className="btn-login welcome-banner-btn" onClick={() => router.push('/explore')}>
          ابدأ الاستماع
        </button>
      </div>

      {/* 1. Time Greeting Section */}
      <section className="section-container">
        <h2 className="section-title" style={{ fontSize: '32px', marginBottom: '24px' }}>{getTimeGreeting()}</h2>
        <div className="shortcut-grid">
          {poems.slice(0, 8).map((item, i) => renderShortcutCard(item))}
        </div>
      </section>

      {/* 2. Recently Added Section */}
      {poems.length > 0 && (
        <section className="section-container">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>مضاف حديثاً</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => handleScroll(recentScrollRef, 'right')} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button onClick={() => handleScroll(recentScrollRef, 'left')} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button className="show-all" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold', marginLeft: '16px'}} onClick={() => window.location.href = '/explore?type=recent'}>عرض الكل</button>
            </div>
          </div>
          <div className="cards-row" ref={recentScrollRef}>
            {poems.slice(0, 30).map(item => renderHorizontalCard(item))}
          </div>
        </section>
      )}



      {/* 3. Recently Listened Section */}
      {poems.length >= 15 && (
        <section className="section-container">
          <div className="section-header">
            <h2 style={{ fontSize: '28px', color: '#fff', fontWeight: 'bold' }}>تم الاستماع إليه مؤخراً</h2>
          </div>
          <div className="responsive-grid-3">
            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {poems.slice(0, 5).map((item, i) => renderRecentTrack(item, i))}
            </div>
            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {poems.slice(5, 10).map((item, i) => renderRecentTrack(item, i + 5))}
            </div>
            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {poems.slice(10, 15).map((item, i) => renderRecentTrack(item, i + 10))}
            </div>
          </div>
        </section>
      )}

      {/* Made For Username Section */}
      {poems.length >= 6 && reciters.length >= 2 && (
        <section className="section-container">
          <div className="section-header">
            {/* Displaying static 'الضيف' but can be replaced dynamically with user session name */}
            <h2 style={{ fontSize: '28px' }}>مصمم من أجل الضيف</h2>
          </div>
          <div className="cards-row">
            {renderPoemCard(poems[0])}
            {renderPoemCard(poems[1])}
            {renderPoemCard(poems[2])}
            {renderMixCard(poems[3], 'الميكس اليومي 1', 'linear-gradient(135deg, #0dc2b3, #191414)')}
            {renderReciterCard(reciters[0])}
            {renderPoemCard(poems[4])}
            {renderReciterCard(reciters[1])}
            {renderMixCard(poems[5], 'راديو الفنان', 'linear-gradient(135deg, #2b3990, #191414)')}
            {renderMixCard(poems[6] || poems[0], 'ميكس حزين', 'linear-gradient(135deg, #af2896, #191414)')}
          </div>
        </section>
      )}

      {/* Listen to Poems You Loved Once Section */}
      {poems.length >= 8 && reciters.length >= 3 && (
        <section className="section-container">
          <div className="section-header">
            <h2 style={{ fontSize: '28px' }}>استمع للقصائد التي أحببتها يوماً ما</h2>
          </div>
          <div className="cards-row">
            {renderPoemCard(poems[5])}
            {renderPoemCard(poems[6])}
            {renderPoemCard(poems[7])}
            {renderMixCard(poems[1], 'ميكس الذكريات', 'linear-gradient(135deg, #1db954, #191414)')}
            {renderReciterCard(reciters[2])}
            {renderPoemCard(poems[8])}
            {renderMixCard(poems[2], 'مفضلاتك القديمة', 'linear-gradient(135deg, #e91e63, #191414)')}
            {renderReciterCard(reciters[0])}
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      {popularPoems.length > 5 && (
        <section className="section-container">
          <div className="section-header">
            <h2>توصيتنا لك اليوم</h2>
            <button className="show-all" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold'}} onClick={() => window.location.href = '/explore?type=popular'}>عرض الكل</button>
          </div>
          <div className="cards-row">
            {popularPoems.slice(5, 15).map(item => renderPoemCard(item))}
          </div>
        </section>
      )}

      {/* More Like Artist Section */}
      {reciters.length > 0 && poems.length > 0 && (() => {
        const targetReciter = reciters[0];
        const similarReciter = reciters[1] || reciters[0];
        const reciterTracks = popularPoems.filter(p => (p.reciter_name === targetReciter.name || p.reciterName === targetReciter.name || p.artist === targetReciter.name));
        const displayTracks = reciterTracks.length >= 3 ? reciterTracks : poems.slice(0, 3);
        
        return (
          <section className="section-container">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={targetReciter.imageUrl || targetReciter.image_url} 
                  alt={targetReciter.name} 
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', color: '#b3b3b3', marginBottom: '4px' }}>المزيد مثل</span>
                  <h2 style={{ fontSize: '32px', margin: 0, fontWeight: 'bold', lineHeight: '1' }}>{targetReciter.name}</h2>
                </div>
              </div>
              <button className="show-all" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold'}} onClick={() => window.location.href = `/reciter?id=${targetReciter.id}`}>عرض الكل</button>
            </div>
            <div className="cards-row">
              {renderPoemCard(displayTracks[0])}
              {renderReciterCard(targetReciter)}
              {displayTracks[1] && renderPoemCard(displayTracks[1])}
              {renderMixCard(displayTracks[0], `راديو ${targetReciter.name}`, 'linear-gradient(135deg, #1db954, #191414)')}
              {displayTracks[2] && renderPoemCard(displayTracks[2])}
              {renderReciterCard(similarReciter)}
            </div>
          </section>
        );
      })()}

      {/* Suggested Stations Section */}
      {reciters.length >= 8 && (
        <section className="section-container">
          <div className="section-header">
            <h2 style={{ fontSize: '28px' }}>المحطات المقترحة</h2>
          </div>
          <div className="cards-row">
            {renderStationCard(reciters[0], [reciters[1], reciters[2]], '#aee4d7')}
            {renderStationCard(reciters[1], [reciters[2], reciters[3]], '#f8e8b9')}
            {renderStationCard(reciters[2], [reciters[3], reciters[4]], '#f8c0b9')}
            {renderStationCard(reciters[3], [reciters[4], reciters[5]], '#e2e2e2')}
            {renderStationCard(reciters[4], [reciters[5], reciters[6]], '#d4e4f8')}
            {renderStationCard(reciters[5], [reciters[6], reciters[7]], '#e6d4f8')}
            {renderStationCard(reciters[6], [reciters[7], reciters[0]], '#f8d4e4')}
            {renderStationCard(reciters[7], [reciters[0], reciters[1]], '#d4f8e6')}
          </div>
        </section>
      )}

      {/* Daily Section */}
      {fridayTracks.length > 0 && (
        <section className="section-container">
          <div className="section-header">
            <h2 style={{ fontSize: '28px' }}>{getDailyMessage()}</h2>
          </div>
          <div className="cards-row">
            {fridayTracks.map(item => renderPoemCard(item))}
          </div>
        </section>
      )}

      {/* 4. Circular Cards - Top Reciters */}
      <section className="section-container">
        <div className="section-header">
          <h2>الرواديد</h2>
          <button className="show-all" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold'}} onClick={() => window.location.href = '/explore?type=reciters'}>عرض الكل</button>
        </div>
        <div className="cards-row">
          {reciters.map(item => renderReciterCard(item))}
        </div>
      </section>

      {/* 5. Popular Cards */}
      <section className="section-container">
        <div className="section-header">
          <h2>الأكثر استماعاً</h2>
          <button className="show-all" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold'}} onClick={() => window.location.href = '/explore?type=popular'}>عرض الكل</button>
        </div>
        <div className="cards-row">
          {popularPoems.map(item => renderPoemCard(item))}
        </div>
      </section>
      
      {/* 6. Made For You Mixes */}
      {poems.length >= 3 && (
        <section className="section-container">
          <div className="section-header">
            <h2>ميكس تم إعداده لك</h2>
          </div>
          <div className="cards-row">
            {renderMixCard(poems[0], 'ميكس باسم الكربلائي', 'linear-gradient(135deg, #1db954, #191414)')}
            {renderMixCard(poems[1], 'ميكس حزين', 'linear-gradient(135deg, #af2896, #191414)')}
            {renderMixCard(poems[2], 'أفضل اللطميات', 'linear-gradient(135deg, #d97736, #191414)')}
          </div>
        </section>
      )}

      {/* 7. Events & Specials (Wide Cards) */}
      {poems.length >= 5 && (
        <section className="section-container">
          <div className="section-header">
            <h2>أحداث ومناسبات</h2>
          </div>
          <div className="responsive-grid-5">
            {renderWideCard(poems[0], 'محرم الحرام', 'أحدث الإصدارات')}
            {renderWideCard(poems[1], 'الأربعين', 'مسيرة العشق الحسيني')}
            {renderWideCard(poems[2], 'عاشوراء', 'يوم المصيبة الراتبة')}
            {renderWideCard(poems[3], 'استشهاد الأمير', 'يا علي')}
            {renderWideCard(poems[4], 'الفاطمية', 'يا زهراء')}
          </div>
        </section>
      )}


    </div>
  );
}
