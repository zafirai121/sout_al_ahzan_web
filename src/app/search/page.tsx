"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';

const supabaseUrl = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const supabaseAnonKey = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = [
  { id: 'hussainiya_poems', title: 'قصائد حسينية', color: '#8400e7' },
  { id: 'muwalid', title: 'مواليد', color: '#509bf5' },
  { id: 'naei', title: 'نعي', color: '#af2896' },
  { id: 'dua', title: 'أدعية ومناجاة', color: '#1db954' },
  { id: 'quran', title: 'قرآن', color: '#006450' },
  { id: 'lectures', title: 'محاضرات', color: '#e1118c' },
  { id: 'variety', title: 'منوعات', color: '#ff4632' },
  { id: 'nasheed', title: 'أناشيد إسلامية', color: '#e91429' },
];

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'playlists' | 'artists'>('all');
  const [reciterResults, setReciterResults] = useState<any[]>([]);
  const { playTrack, playQueue, currentTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();

  useEffect(() => {
    // Reset filter when query changes
    setActiveFilter('all');

    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Split query into individual words
        const words = query.split(' ').filter(w => w.trim());
        if (words.length === 0) return;

        // 1. Search audio_library: every word must match either title or reciter_name
        let audioQuery = supabase.from('audio_library').select('*');
        words.forEach(word => {
          audioQuery = audioQuery.or(`title.ilike.%${word}%,reciter_name.ilike.%${word}%`);
        });
        audioQuery = audioQuery.limit(30);

        // 2. Search reciters table: every word must match reciter name
        let reciterQuery = supabase.from('reciters').select('*');
        words.forEach(word => {
          reciterQuery = reciterQuery.ilike('name', `%${word}%`);
        });
        reciterQuery = reciterQuery.limit(5);

        // Run both queries in parallel
        const [audioRes, reciterRes] = await Promise.all([
          audioQuery,
          reciterQuery
        ]);

        setResults(audioRes.data || []);
        setReciterResults(reciterRes.data || []);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
        setReciterResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id?.toString(),
      title: track.title || 'بدون عنوان',
      artist: track.reciter_name || 'غير معروف',
      imageUrl: track.image_url || track.imageUrl || track.thumbnail_url || 'https://via.placeholder.com/150',
      audioUrl: track.file_url || track.audio_url || track.audioUrl || ''
    });
  };

  const handlePlayAll = () => {
    if (results.length === 0) return;
    playQueue(results.map(track => ({
      id: track.id?.toString(),
      title: track.title || 'بدون عنوان',
      artist: track.reciter_name || 'غير معروف',
      imageUrl: track.image_url || track.imageUrl || track.thumbnail_url || '',
      audioUrl: track.file_url || track.audio_url || track.audioUrl || ''
    })), 0);
  };

  // ✅ Conditional return AFTER all hooks
  if (!query) {
    return (
      <div className="content-inner" style={{ padding: '16px' }}>
        {/* Mobile-only search input */}
        <div className="mobile-search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8196 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.53225 6.4259 3.27893 10.533 3.27893C14.6401 3.27893 17.94 6.53225 17.94 10.5579C17.94 14.5836 14.6401 17.8369 10.533 17.8369C6.4259 17.8369 3.12598 14.5836 3.12598 10.5579Z"/></svg>
          <input
            type="text"
            placeholder="البحث عن قصيدة أو رادود..."
            onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`); }}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '16px', fontWeight: 'bold', marginTop: '8px' }}>تصفح الكل</h2>
        <div className="categories-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="category-card" style={{ backgroundColor: cat.color }}
              onClick={() => router.push(`/category/${cat.id}`)}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{cat.title}</h3>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(0,0,0,0.2)', position: 'absolute', bottom: '-16px', right: '-16px', transform: 'rotate(25deg)', borderRadius: '8px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filterButtons: { key: 'all' | 'songs' | 'playlists' | 'artists', label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'songs', label: 'الأغاني' },
    { key: 'playlists', label: 'قوائم الأغاني' },
    { key: 'artists', label: 'الفنانون' },
  ];

  return (
    <div className="content-inner" style={{ padding: '24px' }}>
      {/* Filter Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setActiveFilter(btn.key)}
            style={{
              background: activeFilter === btn.key ? '#fff' : '#242424',
              color: activeFilter === btn.key ? '#000' : '#fff',
              padding: '6px 16px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b3b3b3', padding: '40px 0' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid #1db954', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ margin: 0 }}>جاري البحث عن "{query}"...</p>
        </div>
      ) : results.length > 0 ? (
        <>
          {/* Play All bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <button onClick={handlePlayAll} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1ed760', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
            </button>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
              {results.length} نتيجة لـ "{query}"
            </span>
          </div>

          {activeFilter === 'playlists' ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#b3b3b3', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#b3b3b3" style={{ marginBottom: '16px' }}><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8196 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.53225 6.4259 3.27893 10.533 3.27893C14.6401 3.27893 17.94 6.53225 17.94 10.5579C17.94 14.5836 14.6401 17.8369 10.533 17.8369C6.4259 17.8369 3.12598 14.5836 3.12598 10.5579Z"/></svg>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>لا توجد نتائج في هذا القسم</p>
              <p style={{ fontSize: '14px' }}>حاول البحث في قسم "الأغاني" أو جرب كلمات مختلفة.</p>
            </div>
          ) : activeFilter === 'artists' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
              {reciterResults.length > 0 ? reciterResults.map(reciter => (
                <div key={reciter.id} style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.3s' }}
                  onClick={() => window.location.href = `/reciter?id=${reciter.id}`}>
                  <img src={reciter.image_url || reciter.imageUrl || 'https://via.placeholder.com/150'} alt={reciter.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{reciter.name}</h3>
                  <span style={{ color: '#b3b3b3', fontSize: '14px' }}>فنان</span>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#b3b3b3', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '18px' }}>لم يتم العثور على فنان بهذا الاسم</p>
                </div>
              )}
            </div>
          ) : (
            <div className="search-results-wrapper">

              {/* Top Result Card - Prioritize Reciter if exists, else first track */}
              {activeFilter === 'all' && (
                <div className="search-top-result">
                  <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '16px', fontWeight: 'bold' }}>أفضل نتيجة</h2>
                  {reciterResults.length > 0 ? (
                    <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}
                      className="card"
                      onClick={() => window.location.href = `/reciter?id=${reciterResults[0].id}`}>
                      <img
                        src={reciterResults[0].image_url || reciterResults[0].imageUrl || 'https://via.placeholder.com/150'}
                        alt="cover"
                        style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                      />
                      <h1 style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>{reciterResults[0].name}</h1>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ backgroundColor: '#333', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '16px', fontWeight: 'bold' }}>فنان</span>
                      </div>
                    </div>
                  ) : results.length > 0 ? (
                    <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}
                    className="card"
                    onClick={() => handlePlayTrack(results[0])}>
                    <img
                      src={results[0].image_url || results[0].imageUrl || results[0].thumbnail_url || 'https://via.placeholder.com/150'}
                      alt="cover"
                      style={{ width: '100px', height: '100px', borderRadius: '8px', marginBottom: '16px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    />
                    <h1 style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>{results[0].title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ color: '#b3b3b3', fontSize: '14px' }}>{results[0].reciter_name || 'فنان'}</span>
                      <span style={{ backgroundColor: '#333', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '16px', fontWeight: 'bold' }}>مقطع</span>
                    </div>
                    <button className="play-btn" style={{ position: 'absolute', bottom: '20px', left: '20px', width: '48px', height: '48px', opacity: 1, transform: 'none' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                    </button>
                  </div>
                  ) : null}
                </div>
              )}

              {/* Songs List */}
              <div className="search-songs-list">
                <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '16px', fontWeight: 'bold' }}>الأغاني</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {results.slice(0, activeFilter === 'songs' ? 20 : 4).map((item) => {
                    const isPlayingTrack = currentTrack?.id === item.id;
                    return (
                    <div
                      key={item.id}
                      className="track-list-row"
                      onClick={() => handlePlayTrack(item)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        {isPlayingTrack && (
                          <div className={`audio-visualizer ${isPlaying ? 'playing' : ''}`}>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                          </div>
                        )}
                        <img
                          src={item.image_url || item.imageUrl || item.thumbnail_url || 'https://via.placeholder.com/40'}
                          alt="cover"
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ color: isPlayingTrack ? '#1db954' : '#fff', fontSize: '15px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                          <span style={{ color: '#b3b3b3', fontSize: '13px' }}>{item.reciter_name || 'فنان'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginRight: '8px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleLike({ id: item.id?.toString(), title: item.title, artist: item.reciter_name, imageUrl: item.image_url || item.imageUrl || item.thumbnail_url || '', audioUrl: item.file_url || item.audio_url || item.audioUrl || '' }); }}
                          style={{ color: isLiked(item.id?.toString()) ? '#1db954' : '#b3b3b3', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            {isLiked(item.id?.toString()) ? (
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            ) : (
                              <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#b3b3b3' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#b3b3b3" style={{ marginBottom: '24px', opacity: 0.5 }}><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8196 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.53225 6.4259 3.27893 10.533 3.27893C14.6401 3.27893 17.94 6.53225 17.94 10.5579C17.94 14.5836 14.6401 17.8369 10.533 17.8369C6.4259 17.8369 3.12598 14.5836 3.12598 10.5579Z"/></svg>
          <h3 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>لا توجد نتائج</h3>
          <p style={{ fontSize: '16px' }}>لم يتم العثور على أي نتائج لـ "{query}".</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>تحقق من التهجئة أو جرب كلمات بحث مختلفة.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="content-inner" style={{ padding: '24px', color: '#b3b3b3' }}>جاري التحميل...</div>}>
      <SearchResults />
    </Suspense>
  );
}
