"use client";

// Everything of one kind, a page at a time: the newest tracks (?type=recent,
// the default), the most listened (?type=popular), or every reciter
// (?type=reciters). The homepage's «عرض الكل» lead here.

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/utils/usePageTitle';
import { getTrackData } from '@/utils/data_mapper';
import { TrackCard, ReciterCard } from '@/components/home/HomeParts';
import { DbAudioTrack, DbReciter } from '@/types';
import '@/components/home/home.css';
import '@/components/browse.css';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,duration,listen_count';
const PAGE = 48;
// A name some uploads were filed under, not a reciter
const NOT_A_RECITER = 'مجهول';

type Kind = 'recent' | 'popular' | 'reciters';
const KINDS: Record<Kind, { title: string; lead: string }> = {
  recent: { title: 'أحدث الإصدارات', lead: 'آخر ما أُضيف إلى المنصة، الأحدث أولاً.' },
  popular: { title: 'الأكثر استماعاً', lead: 'المقاطع التي استمع إليها الناس أكثر من غيرها.' },
  reciters: { title: 'كل الرواديد', lead: 'رواديد المنصة ومنشدوها، بترتيب الحروف.' },
};

function tracksPage(kind: Kind, from: number) {
  const q = supabase.from('audio_library').select(COLUMNS);
  const ordered = kind === 'popular'
    ? q.order('listen_count', { ascending: false, nullsFirst: false }).order('id', { ascending: false })
    : q.order('id', { ascending: false });
  return ordered.range(from, from + PAGE - 1);
}

function ExploreContent() {
  const params = useSearchParams();
  const raw = params.get('type');
  const kind: Kind = raw === 'popular' || raw === 'reciters' ? raw : 'recent';
  const { title, lead } = KINDS[kind];

  const [tracks, setTracks] = useState<DbAudioTrack[]>([]);
  const [reciters, setReciters] = useState<DbReciter[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [more, setMore] = useState(false);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  usePageTitle(title);

  useEffect(() => {
    let live = true;
    setStatus('loading');
    setTracks([]);
    setReciters([]);
    setDone(false);
    const request = kind === 'reciters'
      ? supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER).order('name')
        .then(({ data, error }) => { if (error) throw error; if (live) setReciters((data ?? []) as DbReciter[]); })
      : tracksPage(kind, 0)
        .then(({ data, error }) => {
          if (error) throw error;
          if (!live) return;
          setTracks((data ?? []) as DbAudioTrack[]);
          setDone((data ?? []).length < PAGE);
        });
    request.then(() => live && setStatus('ready'), (e: unknown) => {
      console.error('Explore failed:', e);
      if (live) setStatus('failed');
    });
    return () => { live = false; };
  }, [kind, attempt]);

  // Play goes on through the cards that can be played, in their order
  const queue = useMemo(() => tracks.map(getTrackData).filter(t => t.audioUrl), [tracks]);

  const loadMore = async () => {
    if (more) return;
    setMore(true);
    const { data } = await tracksPage(kind, tracks.length);
    setMore(false);
    if (!data) return;
    setTracks(t => [...t, ...(data as DbAudioTrack[])]);
    if (data.length < PAGE) setDone(true);
  };

  return (
    <div className="content-inner browse">
      <header className="browse-head">
        <h1>{title}</h1>
        <p>{lead}</p>
      </header>

      {status === 'loading' ? (
        <div className="browse-grid" aria-busy="true">
          {Array.from({ length: 12 }, (_, i) => <span key={i} className="browse-skeleton" aria-hidden="true" />)}
        </div>
      ) : status === 'failed' ? (
        <div className="browse-empty">
          <p>تعذّر تحميل الصفحة. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
          <button type="button" className="btn-gold" onClick={() => setAttempt(a => a + 1)}>إعادة المحاولة</button>
        </div>
      ) : kind === 'reciters' ? (
        <div className="browse-grid">
          {reciters.map(r => <ReciterCard key={r.id} item={r} />)}
        </div>
      ) : (
        <>
          <div className="browse-grid">
            {tracks.map(t => <TrackCard key={t.id} item={t} queue={queue} />)}
          </div>
          {!done ? (
            <div className="browse-more">
              <button type="button" className="btn-outline" onClick={loadMore} disabled={more}>
                {more ? 'جارٍ التحميل…' : 'عرض المزيد'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="content-inner" />}>
      <ExploreContent />
    </Suspense>
  );
}
