"use client";

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTrackData, formatDuration } from '@/utils/data_mapper';
import TrackContextMenu from './TrackContextMenu';
import { thumb } from '@/utils/image';
import CrawlLink from '@/components/CrawlLink';
import { CirclePlus, Pause, Play } from 'lucide-react';

const CATEGORY_MAP: Record<string, { title: string, dbCategories: string[], color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', dbCategories: ['hussainiya_poems', 'قصائد حسينية', 'لطميات وقصائد', 'لطمية', 'latmiya', 'nazla'], color: '#8400e7' },
  'muwalid': { title: 'مواليد', dbCategories: ['muwalid', 'مواليد'], color: '#509bf5' },
  'naei': { title: 'نعي', dbCategories: ['naei', 'نعي'], color: '#af2896' },
  'dua': { title: 'أدعية ومناجاة', dbCategories: ['dua', 'أدعية ومناجاة'], color: '#1db954' },
  'quran': { title: 'قرآن', dbCategories: ['quran', 'قرآن'], color: '#006450' },
  'lectures': { title: 'محاضرات', dbCategories: ['lectures', 'محاضرات'], color: '#e1118c' },
  'variety': { title: 'منوعات', dbCategories: ['variety', 'منوعات'], color: '#ff4632' },
  'nasheed': { title: 'أناشيد إسلامية', dbCategories: ['أناشيد', 'nasheed', 'anasheed'], color: '#e91429' },
};

export default function CategoryClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const categoryInfo = CATEGORY_MAP[id] || { title: 'تصنيف غير معروف', dbCategories: [id], color: '#333' };
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  useEffect(() => {
    const fetchCategoryTracks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audio_library')
          .select('*')
          .in('category', categoryInfo.dbCategories)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTracks();
  }, [id, categoryInfo.dbCategories]);

  const handlePlay = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (currentTrack?.id == item.id) {
      togglePlayPause();
      return;
    }
    playTrack({
      id: item.id?.toString(),
      title: item.title || 'بدون عنوان',
      artist: item.reciter_name || 'غير معروف',
      imageUrl: item.image_url || item.imageUrl || item.thumbnail_url || '/icon.png',
      audioUrl: item.file_url || item.audio_url || item.audioUrl || ''
    });
  };

  return (
    <div className="content-inner" style={{ padding: 0, backgroundColor: 'var(--bg-panel)', minHeight: '100%' }}>
      <div style={{ backgroundImage: `linear-gradient(to bottom, ${categoryInfo.color} 0%, var(--bg-panel) 450px, transparent 450px)` }}>
        <div className="track-page-header-container" style={{ background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.5) 100%)' }}>
          <div style={{ width: '232px', height: '232px', backgroundColor: categoryInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 60px rgba(0,0,0,0.5)', marginLeft: '24px' }}>
             <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center', padding: '16px' }}>{categoryInfo.title}</h1>
          </div>
          <div className="track-page-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '232px', paddingBottom: '16px' }}>
            <span className="track-page-type" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>تصنيف</span>
            <h1 className="track-page-title-text" style={{ fontSize: '48px', color: '#fff', fontWeight: 'bold', margin: '0 0 16px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{categoryInfo.title}</h1>
            <div className="track-page-meta">
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{items.length} مقطع</span>
            </div>
          </div>
        </div>

        <div className="track-page-controls-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button className="big-play-btn" onClick={(e) => {
            if (items.length > 0) handlePlay(e, items[0]);
          }}>
            {isPlaying && currentTrack && items.some(i => i.id == currentTrack.id) ? (
              <Pause size={24} color="#000" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={24} color="#000" fill="currentColor" strokeWidth={0} />
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '0 24px', color: '#b3b3b3' }}>جاري التحميل...</div>
        ) : items.length > 0 ? (
          <div style={{ padding: '0 24px' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px', gap: '16px', color: '#b3b3b3', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ textAlign: 'center' }}>#</span>
              <span>المحتوى</span>
              <span>الاستماعات</span>
              <span style={{ textAlign: 'left', paddingLeft: '16px' }}>
                <CirclePlus size={16} />
              </span>
            </div>

            {items.map((item, index) => {
              const isPlayingTrack = currentTrack?.id == item.id;
              return (
                <div key={item.id} className="track-list-row" onClick={(e) => handlePlay(e, item)} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px', gap: '16px', padding: '8px 0', alignItems: 'center', borderRadius: '4px', cursor: 'pointer' }}>
                  {isPlayingTrack ? (
                    <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                      <div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div>
                    </div>
                  ) : (
                    <span className="index-number" style={{ color: '#b3b3b3', textAlign: 'center' }}>{index + 1}</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={thumb(item.image_url || item.imageUrl || item.thumbnail_url || '/icon.png', 40)} alt={item.title} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: isPlayingTrack ? '#1db954' : '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><CrawlLink href={`/track?id=${item.id}`} mode="passive">{item.title}</CrawlLink></span>
                      <span style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reciter_name || 'فنان'}</span>
                    </div>
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                    {item.listen_count || 0}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ paddingLeft: '16px' }}>{formatDuration(item.duration)}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <TrackContextMenu track={getTrackData(item)} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Fans also like section */}
            {items.length > 5 && (
              <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '24px' }}>المعجبون يحبون أيضاً</h2>
                <div className="cards-row">
                  {items.slice(0, 8).reverse().map(item => (
                    <div key={`fan-${item.id}`} className="card" onClick={(e) => handlePlay(e, item)}>
                      <div className="card-img-container">
                        <div className="placeholder-bg" style={{ backgroundImage: `url(${thumb(item.image_url || item.imageUrl || item.thumbnail_url || '/icon.png', 200)})`, backgroundSize: 'cover' }}></div>
                        <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
                          {currentTrack?.id == item.id && isPlaying ? (
                            <Pause size={24} fill="currentColor" strokeWidth={0} />
                          ) : (
                            <Play size={24} fill="currentColor" strokeWidth={0} />
                          )}
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <p className="card-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><CrawlLink href={`/track?id=${item.id}`} mode="passive">{item.title}</CrawlLink></p>
                          <p className="card-subtitle" style={{ margin: 0, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reciter_name || 'فنان'}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                          <TrackContextMenu track={getTrackData(item)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#b3b3b3', padding: '40px', textAlign: 'center' }}>
            لا توجد مقاطع في هذا التصنيف حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
