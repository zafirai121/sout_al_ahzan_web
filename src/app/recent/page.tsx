"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RecentPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecent = async () => {
      // Fetch newest tracks added to library
      const { data } = await supabase.from('audio_library').select('*').order('id', { ascending: false }).limit(20);
      if (data) setTracks(data);
      setLoading(false);
    };
    fetchRecent();
  }, []);

  return (
    <div style={{ padding: '40px', color: '#fff' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>أحدث الإصدارات والمقاطع</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#b3b3b3' }}>جاري التحميل...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
          {tracks.map(t => (
            <div key={t.id} onClick={() => router.push(`/track?id=${t.id}`)} style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}>
              <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#333', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                <img src={t.image_url || t.thumbnail_url || t.imageUrl} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
              <div style={{ color: '#b3b3b3', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.reciter_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
