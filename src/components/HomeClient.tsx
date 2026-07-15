"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { getTrackData, getReciterData } from '@/utils/data_mapper';
import TrackContextMenu from './TrackContextMenu';
import Image from 'next/image';
import { DbAudioTrack, DbReciter, Track, Reciter } from '@/types';

interface HomeClientProps {
  poems: DbAudioTrack[];
  popularPoems: DbAudioTrack[];
  reciters: DbReciter[];
  fridayTracks: DbAudioTrack[];
}

export default function HomeClient({ poems, popularPoems, reciters, fridayTracks }: HomeClientProps) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const router = useRouter();

  const recentScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "طاب صباحك";
    } else {
      return "طاب مساؤك";
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح الخير';
    if (hour >= 12 && hour < 18) return 'مساء الخير';
    return 'طاب مساؤك';
  };

  const handlePlay = (e: React.MouseEvent, item: DbAudioTrack) => {
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

  const renderPoemCard = (item: DbAudioTrack) => {
    const track = getTrackData(item);
    return (
      <div key={`poem-${track.id}`} className="card" onClick={() => goToTrack(track.id)}>
        <div className="card-img-container" style={{ position: 'relative' }}>
          <Image src={track.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={track.title} fill style={{ objectFit: 'cover', borderRadius: '8px' }} sizes="(max-width: 768px) 100vw, 200px" />
          <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
            {currentTrack?.id == track.id && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
            <p className="card-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
            <p className="card-subtitle" style={{ margin: 0, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <TrackContextMenu track={track} />
          </div>
        </div>
      </div>
    );
  };

  const renderReciterCard = (item: DbReciter) => {
    const reciter = getReciterData(item);
    return (
      <div key={reciter.id} className="card" onClick={() => router.push(`/reciter?id=${reciter.id}`)}>
        <div className="card-img-container circle" style={{ position: 'relative' }}>
          <Image src={reciter.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={reciter.name} fill style={{ objectFit: 'cover', borderRadius: '50%' }} sizes="(max-width: 768px) 100vw, 200px" />
          <button className="play-btn" onClick={(e) => { e.stopPropagation(); router.push(`/reciter?id=${reciter.id}`); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          </button>
        </div>
        <p className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{reciter.name}</p>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>فنان</p>
      </div>
    );
  };

  const renderShortcutCard = (item: DbAudioTrack) => {
    const track = getTrackData(item);
    return (
      <div key={track.id} className="shortcut-card" onClick={(e) => handlePlay(e, item)}>
        <div style={{ width: '64px', height: '64px', flexShrink: 0, position: 'relative' }}>
          <Image src={track.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={track.title} fill style={{ objectFit: 'cover' }} sizes="64px" />
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

  const renderHorizontalCard = (item: DbAudioTrack) => {
    const track = getTrackData(item);
    return (
      <div 
        key={`horiz-${track.id}`} 
        onClick={(e) => handlePlay(e, item)} 
        style={{ 
          position: 'relative', 
          aspectRatio: '35 / 24', 
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
        <Image src={track.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={track.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 350px" />
        
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

  const renderRecentTrack = (item: DbAudioTrack, globalIndex: number) => {
    const track = getTrackData(item);
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
        <div style={{ width: '48px', height: '48px', borderRadius: '4px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <Image src={track.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={track.title} fill style={{ objectFit: 'cover' }} sizes="48px" />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</span>
          <span style={{ color: '#b3b3b3', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</span>
        </div>
        
        <div style={{ color: '#b3b3b3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>{plays} استماع</span>
          <div onClick={(e) => e.stopPropagation()}>
            <TrackContextMenu track={track} />
          </div>
        </div>
      </div>
    );
  };

  const renderMixCard = (rawTrack: DbAudioTrack, mixName: string, gradient: string) => {
    const track = getTrackData(rawTrack);
    return (
      <div key={`mix-${track.id}`} className="mix-card" style={{ background: gradient }} onClick={() => {
        if (track.reciterId) {
          router.push(`/radio?ids=${track.reciterId}`);
        } else {
          goToTrack(track.id);
        }
      }}>
        <Image src={track.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt={mixName} fill style={{ objectFit: 'cover' }} className="mix-card-image" sizes="(max-width: 768px) 100vw, 300px" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 className="mix-card-title">{mixName}</h3>
          <p className="mix-card-subtitle">ميكس مخصص لك بناءً على استماعك لـ {track.artist}</p>
        </div>
      </div>
    );
  };

  const renderStationCard = (mainReciter: DbReciter, sideReciters: DbReciter[], gradient: string) => {
    if (!mainReciter) return null;
    const r1 = getReciterData(mainReciter);
    const r2 = sideReciters[0] ? getReciterData(sideReciters[0]) : r1;
    const r3 = sideReciters[1] ? getReciterData(sideReciters[1]) : r1;
    
    return (
      <div key={`station-${r1.id}`} onClick={() => router.push(`/radio?ids=${r1.id},${r2.id},${r3.id}&color=${gradient.replace(/linear-gradient\(135deg,\s*([^,]+),\s*[^)]+\)/, '$1').replace('#', '')}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
        <div className="mix-card" style={{ background: gradient, overflow: 'hidden', position: 'relative', width: '100%' }}>
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', opacity: 0.8 }}>راديو</span>
          </div>
          
          {/* The 3 intersecting circles */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
            <div style={{ width: '45%', aspectRatio: '1 / 1', borderRadius: '50%', position: 'absolute', transform: 'translateX(-65%)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1, overflow: 'hidden' }}>
              <Image src={r3.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt="" fill style={{ objectFit: 'cover' }} sizes="70px" />
            </div>
            <div style={{ width: '45%', aspectRatio: '1 / 1', borderRadius: '50%', position: 'absolute', transform: 'translateX(65%)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1, overflow: 'hidden' }}>
              <Image src={r2.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt="" fill style={{ objectFit: 'cover' }} sizes="70px" />
            </div>
            <div style={{ width: '60%', aspectRatio: '1 / 1', borderRadius: '50%', position: 'absolute', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 2, overflow: 'hidden' }}>
              <Image src={r1.imageUrl || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80'} alt="" fill style={{ objectFit: 'cover' }} sizes="90px" />
            </div>
          </div>

          <div className="desktop-only-block" style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2 }}>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#000', margin: '0 0 4px 0', textShadow: 'none', textAlign: 'center' }}>{r1.name}</h3>
            <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.7)', margin: 0, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              مع {r2.name}، {r3.name}
            </p>
          </div>
        </div>

        <div className="mobile-only-block" style={{ marginTop: '12px' }}>
          <h3 className="card-title" style={{ margin: '0 0 4px 0', textAlign: 'center' }}>{r1.name}</h3>
          <p className="card-subtitle" style={{ margin: 0, textAlign: 'center' }}>
            مع {r2.name}، {r3.name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="content-inner">
      {/* Mobile Greeting and Shortcuts (Visible only on mobile via CSS) */}
      <div className="mobile-only-header" style={{ marginBottom: '24px', padding: '0 16px' }}>
        <div className="shortcut-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
           {poems.slice(0, 6).map(item => renderShortcutCard(item))}
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="welcome-banner desktop-only-banner">
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
      <section className="section-container desktop-only-banner">
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

      {/* 3. Recently Listened Section - Desktop (Original Grid) */}
      {poems.length >= 5 && (
        <section className="section-container desktop-only-block">
          <div className="section-header">
            <h2 style={{ fontSize: '28px', color: '#fff', fontWeight: 'bold' }}>تم الاستماع إليه مؤخراً</h2>
          </div>
          <div className="responsive-grid-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {poems.slice(0, 5).map((item, i) => renderRecentTrack(item, i))}
            </div>
            {poems.length > 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {poems.slice(5, 10).map((item, i) => renderRecentTrack(item, i + 5))}
              </div>
            )}
            {poems.length > 10 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {poems.slice(10, 15).map((item, i) => renderRecentTrack(item, i + 10))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Recently Listened Section - Mobile (Horizontal Columns) */}
      {poems.length >= 5 && (
        <section className="section-container mobile-only-block">
          <div className="section-header">
            <h2 style={{ fontSize: '28px', color: '#fff', fontWeight: 'bold' }}>تم الاستماع إليه مؤخراً</h2>
          </div>
          <div className="horizontal-columns-container">
            {/* Column 1 */}
            <div className="list-column">
              {poems.slice(0, 5).map((item, i) => renderRecentTrack(item, i))}
            </div>
            {/* Column 2 */}
            {poems.length > 5 && (
              <div className="list-column">
                {poems.slice(5, 10).map((item, i) => renderRecentTrack(item, i + 5))}
              </div>
            )}
            {/* Column 3 */}
            {poems.length > 10 && (
              <div className="list-column">
                {poems.slice(10, 15).map((item, i) => renderRecentTrack(item, i + 10))}
              </div>
            )}
            {/* Column 4 */}
            {poems.length > 15 && (
              <div className="list-column">
                {poems.slice(15, 20).map((item, i) => renderRecentTrack(item, i + 15))}
              </div>
            )}
            {/* Column 5 */}
            {poems.length > 20 && (
              <div className="list-column">
                {poems.slice(20, 25).map((item, i) => renderRecentTrack(item, i + 20))}
              </div>
            )}
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
    </div>
  );
}
