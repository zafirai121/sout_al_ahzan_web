"use client";

// A track's page: the track and what plays after it, then where it belongs
// (its release, its reciter, its category in other voices). The track shows as
// soon as it arrives; the lists below come in side by side.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleArrowDown, Heart, Link2, ListEnd, ListPlus, LoaderCircle, Pause, Pencil, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackEditor from '@/components/track/TrackEditor';
import { useAuth } from '@/context/AuthContext';
import { isOwner } from '@/lib/release_settings';
import { QuickTracks, Shelf, TrackCard } from '@/components/home/HomeParts';
import { formatDuration, getTrackData } from '@/utils/data_mapper';
import { CATEGORY_LIST, CATEGORY_VALUES, categoryCode } from '@/utils/categories';
import { downloadTrack } from '@/utils/download';
import { thumb } from '@/utils/image';
import { paletteStyle, usePalette } from '@/utils/palette';
import { countOf, LISTENS } from '@/utils/plural';
import { DbAudioTrack, DbReciter, Track } from '@/types';
import '@/components/home/home.css';
import '@/components/track/track.css';

const COLUMNS = 'id,title,reciter_name,reciter_id,file_url,image_url,category,album,duration,listen_count';
const byListens = { ascending: false, nullsFirst: false } as const;

type Row = DbAudioTrack & Record<string, any>;
type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; row: Row };
type Related = { reciter: DbReciter | null; release: Row[]; byReciter: Row[]; others: Row[] };
const NO_RELATED: Related = { reciter: null, release: [], byReciter: [], others: [] };

/** The tracks related to `row`, each list asked for at once. */
async function readRelated(row: Row): Promise<Related> {
  const id = row.id;
  const reciterId = row.reciter_id ? String(row.reciter_id) : '';
  const sameReciter = (q: any) => (reciterId ? q.eq('reciter_id', reciterId) : q.eq('reciter_name', row.reciter_name ?? ''));
  const otherReciter = (q: any) => (reciterId ? q.neq('reciter_id', reciterId) : q.neq('reciter_name', row.reciter_name ?? ''));
  const code = categoryCode(row.category);
  const list = async (q: any): Promise<Row[]> => {
    const { data, error } = await q;
    if (error) console.warn('related tracks:', error.message);
    return data ?? [];
  };

  const [reciter, release, byReciter, others] = await Promise.all([
    reciterId
      ? supabase.from('reciters').select('id,name,image_url').eq('id', reciterId).maybeSingle().then(({ data }) => data as DbReciter | null)
      : Promise.resolve(null),
    row.album
      ? list(sameReciter(supabase.from('audio_library').select(COLUMNS)).eq('album', row.album).order('id', { ascending: true }).limit(100))
      : Promise.resolve([]),
    list(sameReciter(supabase.from('audio_library').select(COLUMNS)).neq('id', id).order('listen_count', byListens).order('id', { ascending: false }).limit(20)),
    code
      ? list(otherReciter(supabase.from('audio_library').select(COLUMNS)).in('category', CATEGORY_VALUES[code]).order('listen_count', byListens).order('id', { ascending: false }).limit(12))
      : Promise.resolve([]),
  ]);
  return { reciter, release, byReciter, others };
}

export default function TrackClient() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const wantsEdit = params.get('edit') === '1';
  const { playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();

  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [related, setRelated] = useState<Related>(NO_RELATED);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState('');
  const [downloading, setDownloading] = useState(false);
  // The owner's edit: from the button, or opened at once from a ⋮ menu (?edit=1)
  const owner = isOwner(useAuth().user);
  const [editing, setEditing] = useState(false);
  const [editClosed, setEditClosed] = useState(false);

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setState({ status: 'missing' });
      return;
    }
    let live = true;
    setState({ status: 'loading' });
    setRelated(NO_RELATED);
    setNote('');
    (async () => {
      const { data: row, error } = await supabase.from('audio_library').select(`${COLUMNS},lyrics,occasion,year,location`).eq('id', id).maybeSingle();
      if (error) throw error;
      if (!live) return;
      if (!row) return setState({ status: 'missing' });
      setState({ status: 'ready', row });
      const found = await readRelated(row);
      if (live) setRelated(found);
    })().catch(e => {
      console.error('Failed to load track:', e);
      if (live) setState({ status: 'failed' });
    });
    return () => { live = false; };
  }, [id, attempt]);

  const row = state.status === 'ready' ? state.row : null;
  const track = useMemo(() => (row ? getTrackData(row) : null), [row]);
  // The header in the cover's colours, from the cover itself
  const palette = usePalette(track?.imageUrl);

  // Keep the tab title in sync with the SEO title set by functions/track.js
  useEffect(() => {
    if (track) document.title = `${track.title} - ${track.artist} | صوت الأحزان`;
  }, [track]);

  // What "play" plays: this track, the rest of its release from here on (then
  // its start), then the reciter's best known
  const queue = useMemo(() => {
    if (!track) return [];
    const at = related.release.findIndex(r => String(r.id) === track.id);
    const release = at >= 0 ? [...related.release.slice(at + 1), ...related.release.slice(0, at)] : related.release;
    const seen = new Set([track.id]);
    const rest: Track[] = [];
    for (const r of [...release, ...related.byReciter]) {
      const t = getTrackData(r);
      if (seen.has(t.id) || !t.audioUrl) continue;
      seen.add(t.id);
      rest.push(t);
    }
    return [track, ...rest].slice(0, 50);
  }, [track, related]);

  if (state.status === 'loading') {
    return (
      <div className="content-inner track-page" aria-busy="true">
        <p className="sr-only" role="status">جارٍ تحميل المقطع</p>
        <div className="hero-frame"><section className="track-hero track-hero--loading" aria-hidden="true" /></div>
      </div>
    );
  }

  if (state.status !== 'ready' || !track || !row) {
    const failed = state.status === 'failed';
    return (
      <div className="content-inner track-page track-missing">
        <h1>{failed ? 'تعذّر تحميل المقطع' : 'لم نجد هذا المقطع'}</h1>
        <p>{failed ? 'تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'ربما حُذف أو تغيّر رابطه. ابحث عنه باسمه أو باسم الرادود.'}</p>
        {failed ? (
          <button type="button" className="btn-gold" onClick={() => setAttempt(a => a + 1)}>إعادة المحاولة</button>
        ) : (
          <Link href="/search" prefetch={false} className="btn-gold">البحث في المكتبة</Link>
        )}
      </div>
    );
  }

  const playingThis = currentTrack?.id == track.id && isPlaying;
  const play = () => {
    if (currentTrack?.id == track.id) togglePlayPause();
    else if (track.audioUrl) playQueue(queue, 0);
  };
  const liked = isLiked(track.id);

  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote(n => (n === text ? '' : n)), 3000);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/track?id=${track.id}`);
      say('نُسخ رابط المقطع');
    } catch {
      say('تعذّر نسخ الرابط');
    }
  };
  const download = async () => {
    if (!track.audioUrl || downloading) return;
    setDownloading(true);
    setNote('جارٍ التنزيل…');
    const result = await downloadTrack(track.audioUrl, `${track.title} - ${track.artist}`);
    setDownloading(false);
    say(result === 'SUCCESS' ? 'نُزّل المقطع' : 'فُتح المقطع في نافذة جديدة لتنزيله منها');
  };

  const reciterId = row.reciter_id ? String(row.reciter_id) : '';
  const reciterHref = reciterId ? `/reciter?id=${reciterId}` : `/search?q=${encodeURIComponent(track.artist)}`;
  const reciterImage = related.reciter?.image_url;
  const code = categoryCode(row.category);
  const category = CATEGORY_LIST.find(c => c.id === code);
  const album = typeof row.album === 'string' ? row.album.trim() : '';
  const duration = formatDuration(row.duration);
  const listens = Number(row.listen_count) || 0;
  const lyrics = typeof row.lyrics === 'string' ? row.lyrics.trim() : '';
  const upNext = queue.slice(1, 6);
  const releaseRest = related.release.filter(r => String(r.id) !== track.id);

  return (
    <div className="content-inner track-page">
      <div className="hero-frame">
      <section className="track-hero" aria-labelledby="track-title" style={{ '--hero-tint': category?.color, ...paletteStyle(palette) } as React.CSSProperties}>
        <div className="track-hero-main">
          <img className="track-cover" src={thumb(track.imageUrl, 480)} alt="" width={232} height={232} />
          <div className="track-hero-text">
            <h1 id="track-title" className="track-title">{track.title}</h1>
            <Link href={reciterHref} prefetch={false} className="track-reciter">
              {reciterImage ? <img src={thumb(reciterImage, 96)} alt="" width={32} height={32} /> : null}
              <span>{track.artist}</span>
            </Link>
            <p className="track-facts">
              {category ? (
                <Link href={`/category/${category.id}`} prefetch={false} style={{ '--tile': category.color } as React.CSSProperties}>
                  {category.title}
                </Link>
              ) : null}
              {album ? (
                reciterId
                  ? <Link href={`/reciter?id=${reciterId}&album=${encodeURIComponent(album)}`} prefetch={false}>{album}</Link>
                  : <span>{album}</span>
              ) : null}
              {duration ? <span>{duration}</span> : null}
              {listens > 0 ? <span>{countOf(listens, LISTENS)}</span> : null}
            </p>
          </div>
          <div className="track-actions">
            <button type="button" className="btn-gold" onClick={play} disabled={!track.audioUrl}>
              {playingThis ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
              {!track.audioUrl ? 'الصوت غير متوفر' : playingThis ? 'إيقاف' : 'تشغيل'}
            </button>
            <button
              type="button"
              className={`track-icon-btn${liked ? ' is-on' : ''}`}
              onClick={() => toggleLike(track)}
              aria-pressed={liked}
              aria-label={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
              title={liked ? 'إزالة من الإعجابات' : 'أضف إلى الإعجابات'}
            >
              <Heart size={28} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="track-icon-btn" onClick={() => setAdding(true)} aria-label="أضف إلى قائمة تشغيل" title="أضف إلى قائمة تشغيل">
              <ListPlus size={28} />
            </button>
            <button
              type="button"
              className="track-icon-btn"
              onClick={() => { addToQueue(track); say('أُضيف إلى قائمة الانتظار'); }}
              disabled={!track.audioUrl}
              aria-label="أضف إلى قائمة الانتظار"
              title="أضف إلى قائمة الانتظار"
            >
              <ListEnd size={28} />
            </button>
            <button type="button" className="track-icon-btn" onClick={download} disabled={!track.audioUrl || downloading} aria-label="تنزيل المقطع" title="تنزيل المقطع">
              {downloading ? <LoaderCircle size={28} className="track-spin" /> : <CircleArrowDown size={28} />}
            </button>
            <button type="button" className="track-icon-btn" onClick={copyLink} aria-label="نسخ رابط المقطع" title="نسخ رابط المقطع">
              <Link2 size={28} />
            </button>
            {owner ? (
              <button type="button" className="reciter-edit" onClick={() => setEditing(true)}>
                <Pencil size={15} strokeWidth={2.5} />تعديل المقطع
              </button>
            ) : null}
            <span className="track-note" role="status">{note}</span>
          </div>
        </div>
        {upNext.length > 0 ? (
          <div className="track-hero-side">
            <h2 className="track-hero-side-title">يُشغَّل بعده</h2>
            <QuickTracks tracks={upNext} queue={queue} label={`ما يُشغَّل بعد ${track.title}`} />
          </div>
        ) : null}
      </section>
      </div>

      {lyrics ? (
        <section className="track-lyrics" aria-labelledby="track-lyrics-title">
          <h2 id="track-lyrics-title">الكلمات</h2>
          <p>{lyrics}</p>
        </section>
      ) : null}

      {releaseRest.length > 0 ? (
        <Shelf title={`من ${album}`} href={reciterId ? `/reciter?id=${reciterId}&album=${encodeURIComponent(album)}` : undefined}>
          {releaseRest.map(r => <TrackCard key={r.id} item={r} />)}
        </Shelf>
      ) : null}

      {related.byReciter.length > 0 ? (
        <Shelf title={`المزيد من ${track.artist}`} href={reciterHref}>
          {related.byReciter.map(r => <TrackCard key={r.id} item={r} />)}
        </Shelf>
      ) : null}

      {related.others.length > 0 && category ? (
        <Shelf title={`${category.title} بأصوات أخرى`} href={`/category/${category.id}`}>
          {related.others.map(r => <TrackCard key={r.id} item={r} />)}
        </Shelf>
      ) : null}

      {adding ? <AddToPlaylistModal track={track} onClose={() => setAdding(false)} /> : null}
      {owner && (editing || (wantsEdit && !editClosed)) ? (
        <TrackEditor
          row={state.row}
          onSaved={updated => {
            const next = { ...state.row, ...updated };
            setState({ status: 'ready', row: next });
            readRelated(next).then(setRelated);
            say('حُفظ التعديل');
          }}
          onClose={() => { setEditing(false); setEditClosed(true); }}
        />
      ) : null}
    </div>
  );
}
