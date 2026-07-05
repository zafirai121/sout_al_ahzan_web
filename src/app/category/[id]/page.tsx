"use client";

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_MAP: Record<string, { title: string, dbCategories: string[], color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', dbCategories: ['hussainiya_poems', 'قصائد حسينية'], color: '#8400e7' },
  'muwalid': { title: 'مواليد', dbCategories: ['muwalid', 'مواليد'], color: '#509bf5' },
  'naei': { title: 'نعي', dbCategories: ['naei', 'نعي'], color: '#af2896' },
  'dua': { title: 'أدعية ومناجاة', dbCategories: ['dua', 'أدعية ومناجاة'], color: '#1db954' },
  'quran': { title: 'قرآن', dbCategories: ['quran', 'قرآن'], color: '#006450' },
  'lectures': { title: 'محاضرات', dbCategories: ['lectures', 'محاضرات'], color: '#e1118c' },
  'variety': { title: 'منوعات', dbCategories: ['variety', 'منوعات'], color: '#ff4632' },
  'nasheed': { title: 'أناشيد إسلامية', dbCategories: ['أناشيد', 'nasheed'], color: '#e91429' },
};

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
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
      imageUrl: item.image_url || item.imageUrl || item.thumbnail_url || 'https://via.placeholder.com/300',
      audioUrl: item.file_url || item.audio_url || item.audioUrl || ''
    });
  };

  return (
    <div className="content-inner" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: '150px', height: '150px', backgroundColor: categoryInfo.color, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center', padding: '16px' }}>{categoryInfo.title}</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>تصنيف</span>
          <h1 style={{ fontSize: '48px', color: '#fff', fontWeight: 'bold', margin: '8px 0' }}>{categoryInfo.title}</h1>
          <span style={{ color: '#b3b3b3', fontSize: '14px' }}>{items.length} مقطع</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b3b3b3' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid #1db954', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span>جاري التحميل...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="responsive-grid">
          {items.map(item => {
            const isPlayingTrack = currentTrack?.id == item.id && isPlaying;
            return (
              <div key={`cat-track-${item.id}`} className="card" onClick={() => router.push(`/track?id=${item.id}`)}>
                <div className="card-img-container">
                  <div className="placeholder-bg" style={{ backgroundImage: `url(${item.image_url || item.imageUrl || item.thumbnail_url || 'https://via.placeholder.com/300'})`, backgroundSize: 'cover' }}></div>
                  <button className="play-btn" onClick={(e) => handlePlay(e, item)}>
                    {isPlayingTrack ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                    )}
                  </button>
                </div>
                <p className="card-title" style={{ color: isPlayingTrack ? '#1db954' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                <p className="card-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reciter_name || 'فنان'}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: '#b3b3b3', padding: '40px 0', textAlign: 'center' }}>
          لا توجد مقاطع في هذا التصنيف حالياً.
        </div>
      )}
    </div>
  );
}
