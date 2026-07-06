"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DropdownMenu from '@/components/DropdownMenu';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import CreditsModal from '@/components/CreditsModal';
import { downloadTrack } from '@/utils/download';

function TrackDetails() {
  const { playTrack, playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get('id');

  const [track, setTrack] = useState<any>(null);
  const [suggestedTracks, setSuggestedTracks] = useState<any[]>([]);
  const [artistTracks, setArtistTracks] = useState<any[]>([]);
  const [popularArtistTracks, setPopularArtistTracks] = useState<any[]>([]);
  const [fansAlsoLike, setFansAlsoLike] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgColor, setBgColor] = useState('#705820');
  const [isShuffle, setIsShuffle] = useState(false);
  const [selectedTrackToPlaylist, setSelectedTrackToPlaylist] = useState<any>(null);
  const [selectedTrackForCredits, setSelectedTrackForCredits] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      if (!trackId) return;
      try {
        setLoading(true);
        // Fetch specific track
        const { data: trackData, error: trackErr } = await supabase
          .from('audio_library')
          .select('*')
          .eq('id', trackId)
          .single();

        if (trackData) {
          setTrack(trackData);
          
          const artistName = trackData.reciterName || trackData.artist || trackData.reciter_name;

          if (artistName) {
             // 1. المزيد من أعمال الرادود (أحدث أعماله)
             const { data: artistData } = await supabase
              .from('audio_library')
              .select('*')
              .eq('reciter_name', artistName)
              .neq('id', trackId)
              .limit(10);
             if (artistData) setArtistTracks(artistData);

             // 2. ألبومات رائجة للرادود (الأكثر استماعاً للرادود)
             const { data: popularData } = await supabase
              .from('audio_library')
              .select('*')
              .eq('reciter_name', artistName)
              .neq('id', trackId)
              // .order('listen_count', { ascending: false }) // Uncomment if listen_count exists
              .limit(10);
             if (popularData) setPopularArtistTracks(popularData);
          }

          // 3. المعجبون يحبون أيضا (فنانين آخرين مشابهين أو مقاطع شائعة)
          const { data: fansData } = await supabase
            .from('audio_library')
            .select('*')
            .neq('id', trackId)
            // .order('listen_count', { ascending: false }) 
            .limit(10);
          if (fansData) setFansAlsoLike(fansData.reverse()); // Just to randomize for now

          // 4. إصدارات مقترحة (حديثة)
          const { data: suggestedData } = await supabase
            .from('audio_library')
            .select('*')
            .neq('id', trackId)
            .limit(10);
          if (suggestedData) setSuggestedTracks(suggestedData);
        }
      } catch (err) {
        console.error("Error loading track details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [trackId]);

  const getTrackData = (item: any) => ({
    id: item.id?.toString(),
    title: item.title || 'بدون عنوان',
    artist: item.reciterName || item.artist || item.reciter_name || 'مجهول',
    audioUrl: item.audioUrl || item.file_url || item.url || '',
    imageUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80',
    plays: item.listen_count || item.listenCount || 0
  });
  useEffect(() => {
    if (track) {
      const tData = getTrackData(track);
      const imgUrl = tData.imageUrl;
      
      const generateFallback = () => {
        let fallback = '#705820'; // default
        if (track.id) {
          const colors = ['#4a235a', '#154360', '#0e6251', '#7b241c', '#186a3b', '#b9770e'];
          fallback = colors[Number(track.id) % colors.length] || fallback;
        }
        setBgColor(fallback);
      };

      if (!imgUrl) {
        generateFallback();
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imgUrl;
      
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
            setBgColor(`rgb(${r}, ${g}, ${b})`);
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
    }
  }, [track]);

  const handlePlay = (e?: React.MouseEvent, item?: any) => {
    if (e) e.stopPropagation();
    
    if (!item) {
      // Big play button clicked
      if (isCurrentTrackInPage) {
        togglePlayPause();
        return;
      }
      const trackToPlay = getTrackData(track);
      if (!trackToPlay.audioUrl) {
        alert("عذراً، الرابط الصوتي غير متوفر لهذا المقطع.");
        return;
      }
      const queueTracks = [trackToPlay, ...suggestedTracks.map(t => getTrackData(t))];
      playQueue(queueTracks, 0);
      return;
    }

    // Specific track clicked
    const trackToPlay = getTrackData(item);
    if (currentTrack?.id == trackToPlay.id) {
      togglePlayPause();
      return;
    }

    if (!trackToPlay.audioUrl) {
      alert("عذراً، الرابط الصوتي غير متوفر لهذا المقطع.");
      return;
    }
    
    // Create a queue with the requested track first, followed by suggested ones.
    const queueTracks = [trackToPlay, ...suggestedTracks.map(t => getTrackData(t))];
    playQueue(queueTracks, 0);
  };

  const goToTrack = (id: string) => {
    router.push(`/track?id=${id}`);
  };

  const handleDownload = async () => {
    const trackToDownload = getTrackData(track);
    if (!trackToDownload.audioUrl || isDownloading) return;
    setIsDownloading(true);
    showToast('جاري التنزيل...');
    const result = await downloadTrack(trackToDownload.audioUrl, `${trackToDownload.title} - ${trackToDownload.artist}`);
    if (result === 'SUCCESS') {
      showToast('تم التنزيل بنجاح!');
    } else if (result === 'CORS_FALLBACK') {
      showToast("تم فتح المقطع في نافذة جديدة. اضغط على ⋮ واختر 'تنزيل'.");
    } else {
      showToast('حدث خطأ أثناء التنزيل.');
    }
    setIsDownloading(false);
  };

  if (!trackId) {
    return (
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>الرجاء تحديد مقطع</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>المقطع غير موجود!</h2>
      </div>
    );
  }

  const currentTrackData = getTrackData(track);
  
  const isCurrentTrackInPage = 
    currentTrack?.id == currentTrackData.id ||
    suggestedTracks.some(t => t.id == currentTrack?.id) ||
    artistTracks.some(t => t.id == currentTrack?.id) ||
    popularArtistTracks.some(t => t.id == currentTrack?.id) ||
    fansAlsoLike.some(t => t.id == currentTrack?.id);

  const isCurrentPlaying = isCurrentTrackInPage && isPlaying;

  const renderCard = (item: any, style: 'square' | 'circle' | 'wide' = 'square') => {
    const tData = getTrackData(item);
    return (
      <div key={tData.id} className="card" onClick={() => goToTrack(tData.id)}>
        <div className={`card-img-container ${style}`}>
          <div className="placeholder-bg" style={{ backgroundImage: `url(${tData.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
            {currentTrack?.id == tData.id && isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            )}
          </button>
        </div>
        <p className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: style === 'circle' ? 'center' : 'right' }}>{tData.title}</p>
        <p className="card-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: style === 'circle' ? 'center' : 'right' }}>{tData.artist}</p>
      </div>
    );
  };

  const getDropdownItems = (itemData: any) => {
    const isLiked = likedTracks.includes(itemData.id);
    return [
      { 
        label: 'أضف إلى قائمة أغاني', 
        onClick: () => setSelectedTrackToPlaylist(itemData),
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path></svg>
      },
      { 
        label: isLiked ? 'إزالة من "أغانٍ أعجبتني"' : 'حفظ في "أغانٍ أعجبتني"', 
        preventCloseOnClick: true,
        onClick: () => {
          setLikedTracks(prev => {
            if (prev.includes(itemData.id)) {
              return prev.filter(id => id !== itemData.id);
            } else {
              return [...prev, itemData.id];
            }
          });
        },
        icon: isLiked 
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1db954" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      },
      { 
        label: 'إضافة إلى قائمة الاستماع', 
        onClick: () => { addToQueue(itemData); showToast('تمت الإضافة إلى قائمة الاستماع'); },
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M16 15H2v-1.5h14V15zm0-4.5H2V9h14v1.5zm-8.034-6A5.484 5.484 0 0 1 7.187 6H13.5a2.5 2.5 0 0 0 0-5H7.966c.159.474.255.978.278 1.5H13.5a1 1 0 1 1 0 2H7.966zM2 2V0h1.5v2h2v1.5h-2v2H2v-2H0V2h2z"></path></svg>
      },
      { 
        label: 'الاستبعاد من "لمحة عن ذوقك"', 
        onClick: () => showToast('تم الاستبعاد مؤقتاً (ميزة تجريبية)'),
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      },
      { type: 'divider' },
      { 
        label: 'الانتقال إلى راديو الأغنية', 
        onClick: () => router.push(`/radio?ids=${itemData.id}`),
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
      },
      { 
        label: 'الانتقال إلى الألبوم', 
        onClick: () => router.push(`/search?q=${encodeURIComponent(itemData.artist)}`),
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
      },
      { 
        label: 'عرض لائحة الشكر', 
        onClick: () => setSelectedTrackForCredits(itemData),
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      },
      { 
        label: 'مشاركة', 
        onClick: () => { navigator.clipboard.writeText(window.location.origin + '/track?id=' + itemData.id); showToast('تم نسخ الرابط الحصري للمقطع'); },
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
      },
      { type: 'divider' },
      { 
        label: 'الاستماع على تطبيق الكمبيوتر', 
        onClick: () => showToast('يرجى تثبيت تطبيق سطح المكتب أولاً'),
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.625.625 0 0 1-.858.207c-2.35-1.435-5.306-1.76-8.786-.964a.626.626 0 0 1-.274-1.22c3.813-.87 7.077-.492 9.712 1.118a.625.625 0 0 1 .206.859zm1.223-2.735a.78.78 0 0 1-1.072.258c-2.686-1.65-6.784-2.13-9.965-1.166a.782.782 0 1 1-.453-1.5c3.67-1.11 8.2-.57 11.232 1.294a.78.78 0 0 1 .258 1.114zm.11-2.839C14.733 8.94 9.4 8.715 5.5 9.896a.987.987 0 0 1-.571-1.884c4.464-1.352 10.366-1.096 14.07 1.107a.987.987 0 1 1-1.08 1.731z"></path></svg>
      }
    ] as any;
  };

  return (
    <div className="content-inner" style={{ padding: 0, backgroundColor: 'var(--bg-panel)', minHeight: '100%' }}>
      <div style={{ backgroundImage: `linear-gradient(to bottom, ${bgColor} 0%, var(--bg-panel) 450px, transparent 450px)` }}>
        <div className="track-page-header-container" style={{ background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.5) 100%)' }}>
          <img src={currentTrackData.imageUrl} alt="Cover" className="track-page-cover" />
          <div className="track-page-header-info">
            <span className="track-page-type">مقطع</span>
            <h1 className="track-page-title-text">{currentTrackData.title}</h1>
          <div className="track-page-meta">
            <img src={currentTrackData.imageUrl} alt="Artist" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span>{currentTrackData.artist}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-base)' }}>{currentTrackData.plays} استماع</span>
          </div>
        </div>
      </div>

      <div className="track-page-controls-container">
        <button className="big-play-btn" onClick={() => handlePlay()}>
          {isCurrentPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
          )}
        </button>

        {/* Shuffle Button */}
        <button className="control-icon-btn" onClick={() => setIsShuffle(!isShuffle)} style={{ color: isShuffle ? '#1db954' : '#b3b3b3' }} title="تشغيل عشوائي">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.527 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.953l-1.017-1.018a.75.75 0 1 1 1.06-1.06L15.98 13.25l-2.828 2.828a.75.75 0 1 1-1.06-1.06l1.017-1.018H11.16a2.25 2.25 0 0 1-1.724-.804l-1.8-2.14.98-1.166 1.8 2.14a3.75 3.75 0 0 0 2.744.96z"></path>
          </svg>
        </button>

        {/* Add (Plus) Button */}
        <button className="control-icon-btn" onClick={() => setSelectedTrackToPlaylist(track)} style={{ color: '#b3b3b3' }} title="حفظ في المكتبة">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>

        {/* Download Button */}
        <button className="control-icon-btn" onClick={handleDownload} disabled={isDownloading} style={{ color: isDownloading ? '#1db954' : '#b3b3b3' }} title="تنزيل">
          {isDownloading ? (
            <svg className="sp-animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="8 12 12 16 16 12"></polyline>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
          )}
        </button>

        {/* More Options (Three Dots) Button */}
        <DropdownMenu
          buttonContent={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
          }
          items={getDropdownItems(track)}
        />
      </div>

      <div className="track-page-content">

        {suggestedTracks.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>مقترحة</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-base)' }}>بناءً على هذا المقطع</span>
            </div>
            
            {/* Table Header with Thin Separator Line */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px', padding: '0 16px 8px 16px', color: 'var(--text-base)', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>#</div>
              <div>المحتوى</div>
              <div style={{ textAlign: 'right' }}>الاستماعات</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path>
                  <path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path>
                </svg>
              </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
              {suggestedTracks.map((item, i) => {
                const tData = getTrackData(item);
                const isPlayingTrack = currentTrack?.id == tData.id;
                return (
                  <div className="track-list-row" key={tData.id} onClick={(e) => handlePlay(e, item)} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 180px', gap: '16px' }}>
                    <div className="col-index" style={{ alignSelf: 'center' }}>
                      {isPlayingTrack ? (
                        <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                          <div className="wave-bar"></div>
                          <div className="wave-bar"></div>
                          <div className="wave-bar"></div>
                        </div>
                      ) : (
                        <span className="index-number">{i + 1}</span>
                      )}
                      <span className="index-play">
                        <button className="play-btn-small" onClick={(e) => handlePlay(e, item)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                          {isPlayingTrack && isPlaying ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                          )}
                        </button>
                      </span>
                    </div>
                    <div className="col-info">
                      <img src={tData.imageUrl} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="Track" />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '16px', fontWeight: 400, color: isPlayingTrack ? '#1db954' : 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tData.title}</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tData.artist}</span>
                      </div>
                    </div>
                    <div className="col-plays" style={{ alignSelf: 'center', textAlign: 'right' }}>
                      {tData.plays.toLocaleString()}
                    </div>
                    <div className="col-actions" style={{ alignSelf: 'center', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      <button title="إضافة إلى قائمة الأغاني" onClick={(e) => { e.stopPropagation(); setSelectedTrackToPlaylist(item); }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z"></path></svg>
                      </button>
                      <span style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 8px' }}>3:45</span>
                      <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu
                          buttonContent={
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path></svg>
                          }
                          menuStyle={{ right: 'auto', left: 0 }}
                          items={getDropdownItems(item)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* القسم الرابع: إصدارات مقترحة */}
        {suggestedTracks.length > 0 && (
          <section className="section-container">
            <div className="section-header">
              <h2>إصدارات مقترحة</h2>
            </div>
            <div className="cards-row">
              {suggestedTracks.slice(0, 10).map(item => renderCard(item, 'wide'))}
            </div>
          </section>
        )}

        {/* القسم الأول: المزيد من أعمال الرادود */}
        {artistTracks.length > 0 && (
          <section className="section-container">
            <div className="section-header">
              <h2>المزيد من أعمال {currentTrackData.artist}</h2>
              <a href="#" className="show-all">عرض الكل</a>
            </div>
            <div className="cards-row">
              {artistTracks.slice(0, 10).map(item => renderCard(item, 'square'))}
            </div>
          </section>
        )}



        {/* القسم الثالث: المعجبون يحبون أيضاً */}
        {fansAlsoLike.length > 0 && (
          <section className="section-container">
            <div className="section-header">
              <h2>المعجبون يحبون أيضاً</h2>
              <a href="#" className="show-all">عرض الكل</a>
            </div>
            <div className="cards-row">
              {fansAlsoLike.slice(0, 10).map(item => renderCard(item, 'circle'))}
            </div>
          </section>
        )}
      </div>
      </div>

      {selectedTrackToPlaylist && (
        <AddToPlaylistModal 
          track={selectedTrackToPlaylist} 
          onClose={() => setSelectedTrackToPlaylist(null)} 
        />
      )}
      {selectedTrackForCredits && (
        <CreditsModal 
          track={selectedTrackForCredits} 
          onClose={() => setSelectedTrackForCredits(null)} 
        />
      )}
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
          fontWeight: 'bold'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="content-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2>جاري التحميل...</h2>
      </div>
    }>
      <TrackDetails />
    </Suspense>
  );
}
