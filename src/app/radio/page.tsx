"use client";

// A station (/radio?ids=2, or ids=2,7,9 for several reciters together): fifty
// of their tracks picked at random from all of them, played one after another;
// another fifty at a press. With no reciter chosen, every reciter's station.
// Laid out as a reciter's page is (reciter.css): their colour behind it.

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Link2, ListEnd, ListPlus, Pause, Play, RefreshCw, Shuffle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/utils/usePageTitle';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { getTrackData } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { paletteStyle, usePalette } from '@/utils/palette';
import { totalTime } from '@/utils/duration';
import { countOf, listensOf, TRACKS } from '@/utils/plural';
import TrackRows from '@/components/TrackRows';
import { Shelf } from '@/components/home/HomeParts';
import { DbReciter, Track } from '@/types';
import '@/components/home/home.css';
import '@/components/reciter/reciter.css';
import '@/components/browse.css';
import './radio.css';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,duration,listen_count';
const SIZE = 50;
const NOT_A_RECITER = 'مجهول';

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Fifty of the reciters' tracks, any of them: their ids first (a thousand a request), then those fifty */
async function pick(reciterIds: string[]): Promise<Track[]> {
  const page = (from: number) =>
    supabase.from('audio_library').select('id', { count: 'exact' }).in('reciter_id', reciterIds).range(from, from + 999);
  const first = await page(0);
  if (first.error) throw first.error;
  const rest = await Promise.all(
    Array.from({ length: Math.ceil(((first.count ?? 0) - 1000) / 1000) }, (_, i) => page((i + 1) * 1000)),
  );
  const ids = [first, ...rest].flatMap(r => (r.data ?? []).map(row => row.id));
  const chosen = shuffled(ids).slice(0, SIZE);
  if (!chosen.length) return [];
  const { data, error } = await supabase.from('audio_library').select(COLUMNS).in('id', chosen);
  if (error) throw error;
  return shuffled((data ?? []).map(getTrackData).filter(t => t.audioUrl));
}

/** A station's card: the reciter's photo, "راديو" and their name */
function StationCard({ reciter }: { reciter: DbReciter }) {
  return (
    <Link href={`/radio?ids=${reciter.id}`} prefetch={false} className="home-reciter radio-card">
      <span className="radio-card-photo">
        <img src={thumb(reciter.image_url || '/cover-placeholder.svg', 320)} alt="" width={320} height={320} loading="lazy" decoding="async" />
        <span className="radio-card-badge">راديو</span>
      </span>
      <span className="home-reciter-name">{reciter.name}</span>
    </Link>
  );
}

/** Every reciter's station: the page when none is chosen */
function Stations() {
  const [reciters, setReciters] = useState<DbReciter[] | null>(null);
  useEffect(() => {
    supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER).order('name')
      .then(({ data }) => setReciters((data ?? []) as DbReciter[]));
  }, []);
  return (
    <div className="content-inner browse">
      <header className="browse-head">
        <h1>الراديو</h1>
        <p>اختر رادوداً، فتسمع من مقاطعه بلا توقف، مختارة لك عشوائياً في كل مرة.</p>
      </header>
      <div className="browse-grid">
        {reciters
          ? reciters.map(r => <StationCard key={r.id} reciter={r} />)
          : Array.from({ length: 12 }, (_, i) => <span key={i} className="browse-skeleton" aria-hidden="true" />)}
      </div>
    </div>
  );
}

type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; reciters: DbReciter[]; tracks: Track[] };

function Station({ ids }: { ids: string[] }) {
  const { playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const { saveList } = usePlaylists();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [round, setRound] = useState(0);
  const [others, setOthers] = useState<DbReciter[]>([]);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');
  const key = ids.join(',');

  useEffect(() => {
    let live = true;
    setState(s => (s.status === 'ready' ? s : { status: 'loading' }));
    setSaved(false);
    Promise.all([
      supabase.from('reciters').select('id,name,image_url').in('id', ids),
      pick(ids),
    ]).then(([{ data, error }, tracks]) => {
      if (error) throw error;
      // In the order the address names them: the first is the station's
      const rows = (data ?? []) as DbReciter[];
      const found = ids.map(id => rows.find(r => String(r.id) === id)).filter((r): r is DbReciter => !!r);
      if (live) setState(found.length ? { status: 'ready', reciters: found, tracks } : { status: 'missing' });
    }).catch(e => {
      console.error('Radio failed:', e);
      if (live) setState({ status: 'failed' });
    });
    return () => { live = false; };
    // The ids are in the key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, round]);

  // Other stations: eight other reciters, different each visit
  useEffect(() => {
    supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER).not('image_url', 'is', null)
      .then(({ data }) => setOthers(shuffled(((data ?? []) as DbReciter[]).filter(r => !ids.includes(String(r.id)))).slice(0, 8)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(''), 2500);
    return () => clearTimeout(t);
  }, [note]);

  const main = state.status === 'ready' ? state.reciters[0] : null;
  const palette = usePalette(main?.image_url);
  usePageTitle(main ? `راديو ${main.name}` : null);

  const tracks = useMemo(() => (state.status === 'ready' ? state.tracks : []), [state]);

  if (state.status === 'loading') {
    return (
      <div className="content-inner reciter-page" aria-busy="true">
        <div className="hero-frame reciter-hero-frame"><section className="reciter-hero" aria-hidden="true" /></div>
      </div>
    );
  }
  if (state.status !== 'ready') {
    const failed = state.status === 'failed';
    return (
      <div className="content-inner browse">
        <div className="browse-empty">
          <p>{failed ? 'تعذّر تحميل المحطة. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'لم نجد هذه المحطة.'}</p>
          {failed
            ? <button type="button" className="btn-gold" onClick={() => setRound(r => r + 1)}>إعادة المحاولة</button>
            : <Link href="/radio" prefetch={false} className="btn-gold">كل المحطات</Link>}
        </div>
      </div>
    );
  }

  const { reciters } = state;
  const name = `راديو ${reciters[0].name}`;
  const withOthers = reciters.slice(1).map(r => r.name);
  const time = totalTime(tracks.map(t => t.duration));
  const playingHere = isPlaying && tracks.some(t => t.id == currentTrack?.id);

  const playAll = () => (tracks.some(t => t.id == currentTrack?.id) ? togglePlayPause() : playQueue(tracks, 0));
  const queueAll = () => {
    tracks.forEach(addToQueue);
    setNote(`أُضيف ${countOf(tracks.length, TRACKS)} إلى قائمة الانتظار`);
  };
  const save = () => {
    saveList(name, tracks, `radio:${key}`);
    setSaved(true);
    setNote('حُفظت المحطة في مكتبتك قائمةَ تشغيل');
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => setNote('نُسخ رابط المحطة'), () => {});
  };

  return (
    <div className="content-inner reciter-page" style={paletteStyle(palette)}>
      <div className="hero-frame reciter-hero-frame">
        <section className="reciter-hero" aria-labelledby="radio-name">
          {/* The station's reciters together: the first large, the others beside it */}
          <span className={`radio-cover${reciters.length > 1 ? ' is-many' : ''}`} aria-hidden="true">
            {reciters.slice(0, 3).map((r, i) => (
              <img key={r.id} className={i === 0 ? 'is-main' : `is-side is-side-${i}`} src={thumb(r.image_url || '/cover-placeholder.svg', 320)} alt="" />
            ))}
          </span>
          <div className="reciter-hero-text">
            <span className="reciter-kind">راديو</span>
            <h1 id="radio-name" className={`reciter-name${name.length > 16 ? ' is-long' : ''}`}>{name}</h1>
            <p className="reciter-facts">
              {withOthers.length ? <strong>مع {withOthers.join(' و')}</strong> : null}
              <span>{countOf(tracks.length, TRACKS)} مختارة عشوائياً</span>
              {time ? <span>{time}</span> : null}
            </p>
          </div>
        </section>
      </div>

      <section className="reciter-tracks" aria-labelledby="radio-tracks">
        <h2 id="radio-tracks" className="sr-only">مقاطع المحطة</h2>
        <div className="reciter-bar">
          <div className="reciter-actions">
            <button type="button" className="reciter-play" onClick={playAll} disabled={!tracks.length} aria-label={playingHere ? 'إيقاف' : `تشغيل ${name}`} title={playingHere ? 'إيقاف' : 'تشغيل'}>
              {playingHere ? <Pause size={26} fill="currentColor" strokeWidth={0} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
            </button>
            <button type="button" className="reciter-icon-btn" onClick={() => playQueue(shuffled(tracks), 0)} disabled={!tracks.length} aria-label="تشغيل عشوائي" title="تشغيل عشوائي">
              <Shuffle size={30} />
            </button>
            <button type="button" className="reciter-icon-btn" onClick={() => setRound(r => r + 1)} aria-label="اختيار خمسين مقطعاً آخر" title="مقاطع أخرى">
              <RefreshCw size={28} />
            </button>
            <button type="button" className="reciter-icon-btn" onClick={queueAll} disabled={!tracks.length} aria-label="أضف المقاطع إلى قائمة الانتظار" title="أضف الكل إلى قائمة الانتظار">
              <ListEnd size={30} />
            </button>
            <button type="button" className="reciter-icon-btn" onClick={save} disabled={saved || !tracks.length} aria-label={saved ? 'حُفظت في مكتبتك' : 'احفظها في مكتبتك قائمة تشغيل'} title={saved ? 'حُفظت في مكتبتك' : 'احفظها في مكتبتك'}>
              {saved ? <Check size={30} /> : <ListPlus size={30} />}
            </button>
            <button type="button" className="reciter-icon-btn" onClick={copyLink} aria-label="نسخ رابط المحطة" title="نسخ رابط المحطة">
              <Link2 size={30} />
            </button>
            <span className="reciter-copied" role="status">{note}</span>
          </div>
        </div>
        <TrackRows
          queue={tracks}
          asideTitle="الاستماعات"
          rows={tracks.map(t => ({ track: t, sub: t.artist, aside: t.plays ? listensOf(t.plays) : '' }))}
        />
      </section>

      {others.length ? (
        <Shelf title="محطات أخرى" href="/radio">
          {others.map(r => <StationCard key={r.id} reciter={r} />)}
        </Shelf>
      ) : null}
    </div>
  );
}

function RadioContent() {
  const params = useSearchParams();
  const ids = (params.get('ids') ?? '').split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s));
  return ids.length ? <Station key={ids.join(',')} ids={ids} /> : <Stations />;
}

export default function RadioPage() {
  return (
    <Suspense fallback={<div className="content-inner" />}>
      <RadioContent />
    </Suspense>
  );
}
