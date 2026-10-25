"use client";

// Search: what the top bar's box asked for, reciters first (most searches are
// a reciter's name), then every matching track, most listened first. With
// nothing asked, the page is for browsing: the categories and every reciter.

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { searchPatterns, titleOrReciter } from '@/utils/arabic_search';
import { CATEGORY_LIST, categoryCode } from '@/utils/categories';
import { getTrackData } from '@/utils/data_mapper';
import { countOf, TRACKS } from '@/utils/plural';
import { CategoryTiles, ReciterCard } from '@/components/home/HomeParts';
import TrackRows from '@/components/TrackRows';
import { DbAudioTrack, DbReciter } from '@/types';
import '@/components/home/home.css';
import '@/components/search/search.css';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,album,duration,listen_count';
const PAGE = 50;
const CATEGORY_TITLE = new Map(CATEGORY_LIST.map(c => [c.id, c.title]));
// A name some uploads were filed under, not a reciter
const NOT_A_RECITER = 'مجهول';

type Tab = 'all' | 'tracks' | 'reciters';
type Found =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; tracks: DbAudioTrack[]; total: number; reciters: DbReciter[] };

// Every word must be in the title or the reciter's name, whichever way it is spelt
function trackQuery(words: string[], from: number) {
  let q = supabase.from('audio_library').select(COLUMNS, { count: 'exact' });
  for (const w of words) q = q.or(titleOrReciter(w));
  return q.order('listen_count', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).range(from, from + PAGE - 1);
}

function Results({ query }: { query: string }) {
  const { playQueue } = usePlayer();
  const [found, setFound] = useState<Found>({ status: 'loading' });
  const [tab, setTab] = useState<Tab>('all');
  const [attempt, setAttempt] = useState(0);
  const [more, setMore] = useState(false);
  const words = useMemo(() => searchPatterns(query), [query]);

  useEffect(() => {
    let live = true;
    setFound({ status: 'loading' });
    setTab('all');
    let reciters = supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER);
    for (const w of words) reciters = reciters.filter('name', 'imatch', w);
    Promise.all([trackQuery(words, 0), reciters.order('name').limit(24)])
      .then(([t, r]) => {
        if (t.error) throw t.error;
        if (live) setFound({ status: 'ready', tracks: (t.data ?? []) as DbAudioTrack[], total: t.count ?? 0, reciters: (r.data ?? []) as DbReciter[] });
      })
      .catch(e => {
        console.error('Search failed:', e);
        if (live) setFound({ status: 'failed' });
      });
    return () => { live = false; };
  }, [words, attempt]);

  const tracks = found.status === 'ready' ? found.tracks : [];
  const list = useMemo(() => tracks.map(row => ({ row, track: getTrackData(row) })), [tracks]);
  const queue = useMemo(() => list.map(e => e.track).filter(t => t.audioUrl), [list]);

  const loadMore = async () => {
    if (found.status !== 'ready' || more) return;
    setMore(true);
    const { data } = await trackQuery(words, found.tracks.length);
    setMore(false);
    if (data) setFound({ ...found, tracks: [...found.tracks, ...(data as DbAudioTrack[])] });
  };

  if (found.status === 'loading') {
    return (
      <div className="search-skeleton" aria-busy="true">
        <p className="sr-only" role="status">جارٍ البحث عن «{query}»</p>
        {Array.from({ length: 8 }, (_, i) => <span key={i} aria-hidden="true" />)}
      </div>
    );
  }

  if (found.status === 'failed') {
    return (
      <div className="search-empty">
        <p>تعذّر البحث. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
        <button type="button" className="btn-gold" onClick={() => setAttempt(a => a + 1)}>إعادة المحاولة</button>
      </div>
    );
  }

  const { total, reciters } = found;
  if (total === 0 && reciters.length === 0) {
    return (
      <>
        <div className="search-empty">
          <p>لا نتائج لـ «{query}».</p>
          <p className="search-empty-hint">جرّب كلمة واحدة من العنوان، أو اسم الرادود وحده.</p>
        </div>
        <CategoryTiles />
      </>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'الكل', count: total + reciters.length },
    { id: 'tracks', label: 'المقاطع', count: total },
    { id: 'reciters', label: 'الرواديد', count: reciters.length },
  ];
  const showReciters = reciters.length > 0 && tab !== 'tracks';
  const showTracks = total > 0 && tab !== 'reciters';

  return (
    <>
      <div className="search-tabs" role="group" aria-label="نوع النتائج">
        {tabs.filter(t => t.count > 0).map(t => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} <span>{t.count}</span>
          </button>
        ))}
      </div>

      {showReciters ? (
        <section className="search-section" aria-labelledby="search-reciters">
          <header className="home-shelf-header">
            <h2 id="search-reciters">الرواديد</h2>
            {tab === 'all' && reciters.length > 6 ? (
              <button type="button" className="home-show-all" onClick={() => setTab('reciters')}>عرض الكل</button>
            ) : null}
          </header>
          <div className="search-reciters">
            {(tab === 'all' ? reciters.slice(0, 6) : reciters).map(r => <ReciterCard key={r.id} item={r} />)}
          </div>
        </section>
      ) : null}

      {showTracks ? (
        <section className="search-section" aria-labelledby="search-tracks">
          <header className="home-shelf-header">
            <div>
              <h2 id="search-tracks">المقاطع</h2>
              <p className="home-shelf-subtitle">{countOf(total, TRACKS)}، الأكثر استماعاً أولاً</p>
            </div>
            {queue.length > 0 ? (
              <button type="button" className="btn-gold" onClick={() => playQueue(queue, 0)}>
                <Play size={18} fill="currentColor" strokeWidth={0} />
                تشغيل النتائج
              </button>
            ) : null}
          </header>
          <TrackRows
            queue={queue}
            asideTitle="القسم"
            rows={list.map(({ row, track }) => ({
              track,
              sub: row.reciter_id
                ? <Link href={`/reciter?id=${row.reciter_id}`} prefetch={false}>{track.artist}</Link>
                : track.artist,
              aside: CATEGORY_TITLE.get(categoryCode(row.category)) ?? '',
            }))}
          />
          {tracks.length < total ? (
            <div className="search-more">
              <button type="button" className="btn-outline" onClick={loadMore} disabled={more}>
                {more ? 'جارٍ التحميل…' : 'عرض المزيد'}
              </button>
              <span>بقي {countOf(total - tracks.length, TRACKS)}</span>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

/** With nothing asked: the categories, and every reciter by name. */
function Browse() {
  const [reciters, setReciters] = useState<DbReciter[] | null>(null);
  useEffect(() => {
    supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER).order('name')
      .then(({ data }) => setReciters((data ?? []) as DbReciter[]));
  }, []);

  return (
    <>
      <CategoryTiles />
      <section className="search-section" aria-labelledby="search-all-reciters">
        <header className="home-shelf-header">
          <h2 id="search-all-reciters">كل الرواديد</h2>
        </header>
        {reciters === null ? (
          <div className="search-skeleton search-skeleton--grid" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
          </div>
        ) : (
          <div className="search-reciters">
            {reciters.map(r => <ReciterCard key={r.id} item={r} />)}
          </div>
        )}
      </section>
    </>
  );
}

function SearchContent() {
  const query = (useSearchParams().get('q') ?? '').trim();

  return (
    <div className="content-inner search-page">
      <header className="search-head">
        <h1>{query ? <>نتائج البحث عن «{query}»</> : 'ابحث وتصفّح'}</h1>
        {query ? null : <p>اكتب اسم قصيدة أو رادود في مربع البحث أعلى الصفحة، أو تصفّح الأقسام والرواديد.</p>}
      </header>
      {query && searchPatterns(query).length > 0 ? <Results key={query} query={query} /> : <Browse />}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="content-inner search-page" />}>
      <SearchContent />
    </Suspense>
  );
}
