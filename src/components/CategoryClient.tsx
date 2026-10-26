"use client";

import React, { useEffect, useMemo, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { supabase } from '@/lib/supabase';
import { getTrackData, readableTitle } from '@/utils/data_mapper';
import TrackContextMenu from './TrackContextMenu';
import TrackRows from './TrackRows';
import { thumb } from '@/utils/image';
import CrawlLink from '@/components/CrawlLink';
import { countOf, TRACKS } from '@/utils/plural';
import { Link2, ListEnd, Pause, Play, Shuffle } from 'lucide-react';
import './category.css';

const CATEGORY_MAP: Record<string, { title: string, dbCategories: string[], color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', dbCategories: ['hussainiya_poems', 'قصائد حسينية', 'لطميات وقصائد', 'لطمية', 'latmiya', 'nazla', 'shoor', 'شور'], color: '#7A1F2B' },
  'muwalid': { title: 'مواليد', dbCategories: ['muwalid', 'مواليد'], color: '#1F6B4F' },
  'naei': { title: 'نعي', dbCategories: ['naei', 'نعي'], color: '#5B2A4E' },
  'dua': { title: 'أدعية ومناجاة', dbCategories: ['dua', 'أدعية ومناجاة', 'adhkar'], color: '#1D5560' },
  'quran': { title: 'قرآن', dbCategories: ['quran', 'قرآن'], color: '#2D5B3F' },
  'ziyarat': { title: 'زيارات', dbCategories: ['ziyarat', 'زيارات'], color: '#8A5A16' },
  'lectures': { title: 'محاضرات', dbCategories: ['lectures', 'محاضرات'], color: '#2E3A6B' },
  'variety': { title: 'منوعات', dbCategories: ['variety', 'منوعات'], color: '#3D4A57' },
  'nasheed': { title: 'أناشيد إسلامية', dbCategories: ['أناشيد', 'nasheed', 'anasheed'], color: '#8A4B26' },
};

/** The list in a new order, every order as likely */
function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function CategoryClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const categoryInfo = CATEGORY_MAP[id] || { title: 'تصنيف غير معروف', dbCategories: [id], color: '#333' };

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();

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

  // The tracks as the shared list shows them, and those that can be played, in order
  const tracks = useMemo(() => items.map(getTrackData), [items]);
  const queue = useMemo(() => tracks.filter(t => t.audioUrl), [tracks]);
  const fromHere = queue.some(t => t.id == currentTrack?.id);
  const playingHere = fromHere && isPlaying;

  // What the buttons beside play did, said for a moment
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(''), 2500);
    return () => clearTimeout(t);
  }, [note]);

  const playAll = () => {
    if (fromHere) togglePlayPause();
    else if (queue.length) playQueue(queue, 0);
  };
  const queueAll = () => {
    queue.forEach(addToQueue);
    setNote(`أُضيف ${countOf(queue.length, TRACKS)} إلى قائمة الانتظار`);
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => setNote('نُسخ رابط القسم'), () => {});
  };

  const handlePlay = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (currentTrack?.id == item.id) {
      togglePlayPause();
      return;
    }
    playTrack({
      id: item.id?.toString(),
      title: readableTitle(item.title || 'بدون عنوان'),
      artist: item.reciter_name || 'غير معروف',
      imageUrl: item.image_url || item.imageUrl || item.thumbnail_url || '/cover-placeholder.svg',
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
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{countOf(items.length, TRACKS)}</span>
            </div>
          </div>
        </div>

        {/* Play, and beside it: shuffle, everything to the queue, the page's link */}
        <div className="category-actions">
          <button type="button" className="big-play-btn" onClick={playAll} disabled={!queue.length} aria-label={playingHere ? 'إيقاف' : `تشغيل ${categoryInfo.title}`}>
            {playingHere ? (
              <Pause size={24} color="#000" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={24} color="#000" fill="currentColor" strokeWidth={0} />
            )}
          </button>
          <button type="button" className="category-icon-btn" onClick={() => playQueue(shuffled(queue), 0)} disabled={!queue.length} aria-label={`تشغيل ${categoryInfo.title} عشوائياً`} title="تشغيل عشوائي">
            <Shuffle size={28} />
          </button>
          <button type="button" className="category-icon-btn" onClick={queueAll} disabled={!queue.length} aria-label="أضف كل المقاطع إلى قائمة الانتظار" title="أضف الكل إلى قائمة الانتظار">
            <ListEnd size={28} />
          </button>
          <button type="button" className="category-icon-btn" onClick={copyLink} aria-label="نسخ رابط القسم" title="نسخ رابط القسم">
            <Link2 size={28} />
          </button>
          <span className="category-note" role="status">{note}</span>
        </div>

        {loading ? (
          <div style={{ padding: '0 24px', color: '#b3b3b3' }}>جاري التحميل...</div>
        ) : items.length > 0 ? (
          <div className="category-list">
            {/* The shared list: on hover the number gives way to play in its own place, nothing moves */}
            <TrackRows
              queue={queue}
              asideTitle="الاستماعات"
              rows={tracks.map(t => ({ track: t, sub: t.artist, aside: t.plays ?? 0 }))}
            />

            {/* Fans also like section */}
            {items.length > 5 && (
              <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '24px' }}>المعجبون يحبون أيضاً</h2>
                <div className="cards-row">
                  {items.slice(0, 8).reverse().map(item => (
                    <div key={`fan-${item.id}`} className="card" onClick={(e) => handlePlay(e, item)}>
                      <div className="card-img-container">
                        <img className="placeholder-bg" src={thumb(item.image_url || item.imageUrl || item.thumbnail_url || '/cover-placeholder.svg', 200)} alt="" loading="lazy" />
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
                          <p className="card-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><CrawlLink href={`/track?id=${item.id}`} mode="passive">{readableTitle(item.title || '')}</CrawlLink></p>
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
