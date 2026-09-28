"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DropdownMenu from '@/components/DropdownMenu';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import CreditsModal from '@/components/CreditsModal';
import { downloadTrack } from '@/utils/download';
import { getTrackData } from '@/utils/data_mapper';
import TrackContextMenu from './TrackContextMenu';
import { thumb } from '@/utils/image';
import CrawlLink from '@/components/CrawlLink';
import { Check, CircleArrowDown, CirclePlus, CircleX, Disc3, Ellipsis, ListPlus, LoaderCircle, Music, Pause, Play, Radio, Share, Shuffle } from 'lucide-react';

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

  // Keep the tab title in sync with the SEO title set by functions/track.js
  useEffect(() => {
    if (!track) return;
    const t = getTrackData(track);
    document.title = `${t.title} - ${t.artist} | صوت الأحزان`;
  }, [track]);

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
    // To avoid user confusion, the page download button downloads the currently playing track if available,
    // otherwise it falls back to the track displayed on the page.
    const trackToDownload = currentTrack || getTrackData(track);
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
          <div className="placeholder-bg" style={{ backgroundImage: `url(${thumb(tData.imageUrl, 200)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
            {currentTrack?.id == tData.id && isPlaying ? (
              <Pause size={24} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={24} fill="currentColor" strokeWidth={0} />
            )}
          </button>
        </div>
        <p className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: style === 'circle' ? 'center' : 'right' }}><CrawlLink href={`/track?id=${tData.id}`}>{tData.title}</CrawlLink></p>
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
        icon: <CirclePlus size={16} />
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
          ? <Check size={16} color="#1db954" />
          : <CirclePlus size={16} />
      },
      { 
        label: 'إضافة إلى قائمة الاستماع', 
        onClick: () => { addToQueue(itemData); showToast('تمت الإضافة إلى قائمة الاستماع'); },
        icon: <ListPlus size={16} />
      },
      { 
        label: 'الاستبعاد من "لمحة عن ذوقك"', 
        onClick: () => showToast('تم الاستبعاد مؤقتاً (ميزة تجريبية)'),
        icon: <CircleX size={16} />
      },
      { type: 'divider' },
      { 
        label: 'الانتقال إلى راديو الأغنية', 
        onClick: () => router.push(`/radio?ids=${itemData.id}`),
        icon: <Radio size={16} />
      },
      { 
        label: 'الانتقال إلى الألبوم', 
        onClick: () => router.push(`/search?q=${encodeURIComponent(itemData.artist)}`),
        icon: <Disc3 size={16} />
      },
      { 
        label: 'عرض لائحة الشكر', 
        onClick: () => setSelectedTrackForCredits(itemData),
        icon: <Music size={16} />
      },
      { 
        label: 'مشاركة', 
        onClick: () => { navigator.clipboard.writeText(window.location.origin + '/track?id=' + itemData.id); showToast('تم نسخ الرابط الحصري للمقطع'); },
        icon: <Share size={16} />
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
          <img src={thumb(currentTrackData.imageUrl, 240)} alt="Cover" className="track-page-cover" />
          <div className="track-page-header-info">
            <span className="track-page-type">مقطع</span>
            <h1 className="track-page-title-text">{currentTrackData.title}</h1>
          <div className="track-page-meta">
            <img src={thumb(currentTrackData.imageUrl, 24)} alt="Artist" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span>{currentTrackData.artist}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-base)' }}>{currentTrackData.plays} استماع</span>
          </div>
        </div>
      </div>

      <div className="track-page-controls-container">
        <button className="big-play-btn" onClick={() => handlePlay()}>
          {isCurrentPlaying ? (
            <Pause size={24} color="#000" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={24} color="#000" fill="currentColor" strokeWidth={0} />
          )}
        </button>

        {/* Shuffle Button */}
        <button className="control-icon-btn" onClick={() => setIsShuffle(!isShuffle)} style={{ color: isShuffle ? '#1db954' : '#b3b3b3' }} title="تشغيل عشوائي">
          <Shuffle size={24} />
        </button>

        {/* Add (Plus) Button */}
        <button className="control-icon-btn" onClick={() => setSelectedTrackToPlaylist(track)} style={{ color: '#b3b3b3' }} title="حفظ في المكتبة">
          <CirclePlus size={24} />
        </button>

        {/* Download Button */}
        <button className="control-icon-btn" onClick={handleDownload} disabled={isDownloading} style={{ color: isDownloading ? '#1db954' : '#b3b3b3' }} title="تنزيل">
          {isDownloading ? (
            <LoaderCircle size={24} className="sp-animate-spin" />
          ) : (
            <CircleArrowDown size={24} />
          )}
        </button>

        {/* More Options (Three Dots) Button */}
        <TrackContextMenu 
          track={getTrackData(track)}
          customButton={
            <Ellipsis size={32} />
          }
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
            <div className="track-list-grid-row track-list-grid-header" style={{ padding: '0 16px 8px 16px', color: 'var(--text-base)', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>#</div>
              <div>المحتوى</div>
              <div style={{ textAlign: 'right' }}>الاستماعات</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '16px' }}>
                <CirclePlus size={16} />
              </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
              {suggestedTracks.map((item, i) => {
                const tData = getTrackData(item);
                const isPlayingTrack = currentTrack?.id == tData.id;
                return (
                  <div className="track-list-row track-list-grid-row" key={tData.id} onClick={(e) => handlePlay(e, item)}>
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
                            <Pause size={16} fill="currentColor" strokeWidth={0} />
                          ) : (
                            <Play size={16} fill="currentColor" strokeWidth={0} />
                          )}
                        </button>
                      </span>
                    </div>
                    <div className="col-info">
                      <img src={thumb(tData.imageUrl, 40)} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="Track" />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '16px', fontWeight: 400, color: isPlayingTrack ? '#1db954' : 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><CrawlLink href={`/track?id=${tData.id}`} mode="passive">{tData.title}</CrawlLink></span>
                        <span style={{ fontSize: '14px', color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tData.artist}</span>
                      </div>
                    </div>
                    <div className="col-plays" style={{ alignSelf: 'center', textAlign: 'right' }}>
                      {(tData.plays || 0).toLocaleString()}
                    </div>
                    <div className="col-actions" style={{ alignSelf: 'center', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 8px' }}>3:45</span>
                      <TrackContextMenu track={tData} />
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

export default TrackDetails;
