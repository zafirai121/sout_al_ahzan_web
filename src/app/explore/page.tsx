"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePlayer } from '@/context/PlayerContext';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ExploreContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'recent';
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === 'reciters') {
          const { data, error } = await supabase
            .from('reciters')
            .select('*')
            .order('name')
            .limit(50);
          if (error) throw error;
          setItems(data || []);
        } else if (type === 'popular') {
          // Assuming we don't have play_count yet, just fetching audio_library with a random/different order
          const { data, error } = await supabase
            .from('audio_library')
            .select('*')
            .limit(50);
          if (error) throw error;
          setItems(data || []);
        } else {
          // recent
          const { data, error } = await supabase
            .from('audio_library')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          setItems(data || []);
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  const handleItemClick = (item: any) => {
    if (type === 'reciters') {
      window.location.href = `/reciter?id=${item.id}`;
    } else {
      playTrack({
        id: item.id,
        title: item.title,
        artist: item.reciter_name || 'غير معروف',
        imageUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || 'https://via.placeholder.com/150',
        audioUrl: item.audio_url || item.audioUrl || ''
      });
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'reciters': return 'كل الرواديد';
      case 'popular': return 'الأكثر استماعاً';
      default: return 'أحدث الإصدارات';
    }
  };

  return (
    <div className="content-inner" style={{ padding: '24px' }}>
      <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '24px', fontWeight: 'bold' }}>
        {getTitle()}
      </h2>

      {loading ? (
        <p style={{ color: '#b3b3b3' }}>جاري التحميل...</p>
      ) : items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
          {items.map((item) => (
            <div key={item.id} className="card" onClick={() => handleItemClick(item)}>
              <div className={`card-img-container ${type === 'reciters' ? 'circle' : ''}`}>
                <div className="placeholder-bg" style={{ backgroundImage: `url(${item.image_url || item.imageUrl || 'https://via.placeholder.com/150'})`, backgroundSize: 'cover' }}></div>
                <button className="play-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                </button>
              </div>
              <h3 className="card-title">{item.title || item.name}</h3>
              {type !== 'reciters' && (
                <p className="card-subtitle">{item.reciter_name || 'غير معروف'}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#b3b3b3' }}>لا توجد عناصر.</p>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
