"use client";

import React, { useEffect, useMemo, useState, use } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { supabase } from '@/lib/supabase';
import { getTrackData } from '@/utils/data_mapper';
import TrackRows from './TrackRows';
import { Shelf, TrackCard } from '@/components/home/HomeParts';
import { countOf, TRACKS } from '@/utils/plural';
import { Link2, ListEnd, Pause, Play, Shuffle } from 'lucide-react';
import '@/components/home/home.css';
import './category.css';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,duration,listen_count';
// The newest fifty first, fifty more with each «عرض المزيد»
const PAGE = 50;

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
  // The homepage's «مواليد وأفراح»: the births and the nasheeds together
  'afrah': { title: 'مواليد وأفراح', dbCategories: ['muwalid', 'مواليد', 'أناشيد', 'nasheed', 'anasheed'], color: '#1F6B4F' },
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
  const [total, setTotal] = useState(0);
  const [top, setTop] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const { playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  // The newest first, a page at a time, with how many there are in all
  const page = (from: number) => supabase.from('audio_library').select(COLUMNS, { count: 'exact' })
    .in('category', categoryInfo.dbCategories).order('id', { ascending: false }).range(from, from + PAGE - 1);

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.all([
      page(0),
      // Their most listened, for the row under the list
      supabase.from('audio_library').select(COLUMNS).in('category', categoryInfo.dbCategories)
        .order('listen_count', { ascending: false, nullsFirst: false }).limit(10),
    ]).then(([list, best]) => {
      if (list.error) throw list.error;
      if (!live) return;
      setItems(list.data ?? []);
      setTotal(list.count ?? 0);
      setTop(best.data ?? []);
    }).catch(error => console.error("Error fetching category:", error))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // The category's spellings come from its id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMore = async () => {
    if (more) return;
    setMore(true);
    const { data } = await page(items.length);
    setMore(false);
    if (data) setItems(list => [...list, ...data]);
  };

  // The tracks as the shared list shows them, and those that can be played, in order
  const tracks = useMemo(() => items.map(getTrackData), [items]);
  const queue = useMemo(() => tracks.filter(t => t.audioUrl), [tracks]);
  const topTracks = useMemo(() => top.map(getTrackData).filter(t => t.audioUrl), [top]);
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

  return (
    <div className="content-inner" style={{ padding: 0, backgroundColor: 'var(--bg-panel)', minHeight: '100%' }}>
      <div style={{ backgroundImage: `linear-gradient(to bottom, ${categoryInfo.color} 0%, var(--bg-panel) 450px, transparent 450px)` }}>
        <div className="track-page-header-container" style={{ background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.5) 100%)' }}>
          <div style={{ width: '232px', height: '232px', backgroundColor: categoryInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 60px rgba(0,0,0,0.5)', marginLeft: '24px' }}>
             <span aria-hidden="true" style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center', padding: '16px' }}>{categoryInfo.title}</span>
          </div>
          <div className="track-page-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '232px', paddingBottom: '16px' }}>
            <span className="track-page-type" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>تصنيف</span>
            <h1 className="track-page-title-text" style={{ fontSize: '48px', color: '#fff', fontWeight: 'bold', margin: '0 0 16px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{categoryInfo.title}</h1>
            <div className="track-page-meta">
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? '' : countOf(total, TRACKS)}</span>
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

            {items.length < total ? (
              <div className="category-more">
                <button type="button" className="btn-outline" onClick={loadMore} disabled={more}>
                  {more ? 'جارٍ التحميل…' : 'عرض المزيد'}
                </button>
                <span>بقي {countOf(total - items.length, TRACKS)}</span>
              </div>
            ) : null}

            {/* Not the list again: what is listened to most in it */}
            {topTracks.length >= 4 ? (
              <div className="category-top">
                <Shelf title={`الأكثر استماعاً في ${categoryInfo.title}`}>
                  {topTracks.map(t => <TrackCard key={t.id} item={t} queue={topTracks} />)}
                </Shelf>
              </div>
            ) : null}
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
