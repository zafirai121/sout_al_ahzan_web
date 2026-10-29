"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Pencil, UserRoundPen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fetchReleaseSettings, isOwner, NO_SETTINGS, ReleaseSettings } from '@/lib/release_settings';
import { DbReciter } from '@/types';
import { COVER_PLACEHOLDER } from '@/utils/image';
import { paletteStyle, usePalette } from '@/utils/palette';
import { ReciterCard, Shelf } from '@/components/home/HomeParts';
import { AlbumCard, albumsOf, Entry, ReciterActions, ReciterHero, ReciterTop, ReciterTracks, toEntry } from '@/components/reciter/ReciterParts';
import ReleaseEditor from '@/components/reciter/ReleaseEditor';
import ReciterEditor from '@/components/reciter/ReciterEditor';
import '@/components/home/home.css';
import '@/components/reciter/reciter.css';

// Only what the page shows (lyrics and the rest stay on the track page)
const COLUMNS = 'id,title,reciter_name,file_url,image_url,category,album,duration,listen_count';

// Supabase returns at most 1000 rows a request, and a thousand rows take
// seconds to come. Ask how many there are while the first batch comes, then
// read the rest side by side (ordered by id, so batches neither overlap nor
// miss a row).
const BATCH = 300;
async function readTracks(match: (q: any) => any): Promise<any[]> {
  const batch = async (from: number): Promise<any[]> => {
    const { data, error } = await match(supabase.from('audio_library').select(COLUMNS))
      .order('id', { ascending: false })
      .range(from, from + BATCH - 1);
    if (error) throw error;
    return data ?? [];
  };
  const first = batch(0);
  const { count, error } = await match(supabase.from('audio_library').select('id', { count: 'exact', head: true }));
  if (error) throw error;
  const rest: Promise<any[]>[] = [];
  for (let from = BATCH; from < (count ?? 0); from += BATCH) rest.push(batch(from));
  return (await Promise.all([first, ...rest])).flat();
}

type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; reciter: DbReciter; entries: Entry[] };

export default function ReciterClient() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const album = params.get('album') ?? '';

  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [others, setOthers] = useState<DbReciter[]>([]);
  const tracksRef = useRef<HTMLElement>(null);
  // The owner's choices for the releases (their covers), and their tools for them
  const [settings, setSettings] = useState<ReleaseSettings>(NO_SETTINGS);
  const [editing, setEditing] = useState(false);
  const [editingReciter, setEditingReciter] = useState(false);
  const owner = isOwner(useAuth().user);

  useEffect(() => {
    fetchReleaseSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setState({ status: 'missing' });
      return;
    }
    let live = true;
    setState({ status: 'loading' });
    (async () => {
      // The reciter and their tracks side by side: the id is all both need
      const [{ data: reciter, error }, byId] = await Promise.all([
        supabase.from('reciters').select('id,name,image_url').eq('id', id).maybeSingle(),
        readTracks(q => q.eq('reciter_id', id)),
      ]);
      if (error) throw error;
      if (!reciter) return live && setState({ status: 'missing' });
      let rows = byId;
      // Older uploads may carry only the name
      if (rows.length === 0) rows = await readTracks(q => q.ilike('reciter_name', `%${reciter.name}%`));
      if (live) setState({ status: 'ready', reciter, entries: rows.map(toEntry) });
    })().catch(e => {
      console.error('Failed to load reciter:', e);
      if (live) setState({ status: 'failed' });
    });
    return () => { live = false; };
  }, [id, attempt]);

  // Other reciters: the ones after this one, so each page shows different neighbours
  useEffect(() => {
    if (!id) return;
    supabase.from('reciters').select('id,name,image_url').not('image_url', 'is', null).neq('image_url', '').order('id')
      .then(({ data }) => {
        if (!data) return;
        const at = data.findIndex(r => String(r.id) === id);
        setOthers([...data.slice(at + 1), ...data.slice(0, Math.max(at, 0))].slice(0, 12));
      });
  }, [id]);

  // Keep the tab title in sync with the SEO title set by functions/reciter.js
  const name = state.status === 'ready' ? state.reciter.name : '';
  useEffect(() => {
    if (name) document.title = `${name} | صوت الأحزان`;
  }, [name]);

  const entries = state.status === 'ready' ? state.entries : null;
  const covers = settings.covers[id];
  const albums = useMemo(
    () => (entries ? albumsOf(entries).map(a => (covers?.[a.name] ? { ...a, cover: covers[a.name] } : a)) : []),
    [entries, covers],
  );

  // Tracks the owner put in another release, or out of any
  const onTracks = (ids: number[], into: string) => setState(s => (s.status === 'ready'
    ? { ...s, entries: s.entries.map(e => (ids.includes(e.id) ? { ...e, album: into } : e)) }
    : s));

  // Reciters added without a photo fall back to the cover of one of their tracks
  const imageUrl = state.status === 'ready'
    ? state.reciter.image_url
      || state.entries.find(e => e.track.imageUrl && e.track.imageUrl !== COVER_PLACEHOLDER)?.track.imageUrl
      || COVER_PLACEHOLDER
    : null;
  // The header and the bar under it in their photo's colour, read from the photo
  const palette = usePalette(imageUrl);

  // The chosen release lives in the address, so a link to it can be shared
  const openAlbum = (next: string) => {
    const query = new URLSearchParams(params.toString());
    if (next) query.set('album', next);
    else query.delete('album');
    window.history.replaceState(null, '', `?${query.toString()}`);
    if (next) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      tracksRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="content-inner reciter-page" aria-busy="true">
        <p className="sr-only" role="status">جارٍ تحميل صفحة الرادود</p>
        <div className="hero-frame reciter-hero-frame"><section className="reciter-hero reciter-hero--loading" aria-hidden="true" /></div>
        <div className="reciter-skeleton" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => <span key={i} />)}
        </div>
      </div>
    );
  }

  if (state.status !== 'ready') {
    const failed = state.status === 'failed';
    return (
      <div className="content-inner reciter-page reciter-missing">
        <h1>{failed ? 'تعذّر تحميل صفحة الرادود' : 'لم نجد هذا الرادود'}</h1>
        <p>{failed ? 'تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'ربما تغيّر رابط الصفحة. تجد كل الرواديد في صفحة الاستكشاف.'}</p>
        {failed ? (
          <button type="button" className="btn-gold" onClick={() => setAttempt(a => a + 1)}>إعادة المحاولة</button>
        ) : (
          <Link href="/explore?type=reciters" prefetch={false} className="btn-gold">تصفّح الرواديد</Link>
        )}
      </div>
    );
  }

  const { reciter } = state;
  const currentAlbum = albums.some(a => a.name === album) ? album : '';

  return (
    <div className="content-inner reciter-page" style={paletteStyle(palette)}>
      <ReciterHero name={reciter.name} imageUrl={imageUrl ?? COVER_PLACEHOLDER} entries={state.entries} albums={albums} />

      {/* Their tracks first, under the bar that plays them; the most listened and the releases below, above the other reciters */}
      <section className="reciter-tracks" ref={tracksRef} aria-labelledby="reciter-tracks-title">
        <h2 id="reciter-tracks-title" className="sr-only">{currentAlbum || `مقاطع ${reciter.name}`}</h2>
        <ReciterTracks
          name={reciter.name}
          entries={state.entries}
          albums={albums}
          album={currentAlbum}
          onAlbum={openAlbum}
          actions={(
            <>
              <ReciterActions id={String(reciter.id)} name={reciter.name} entries={state.entries} />
              {owner ? (
                <button type="button" className="reciter-edit" onClick={() => setEditingReciter(true)}>
                  <UserRoundPen size={15} strokeWidth={2.5} />تعديل الرادود
                </button>
              ) : null}
            </>
          )}
        />
      </section>

      <ReciterTop name={reciter.name} entries={state.entries} />

      {albums.length > 0 ? (
        <Shelf
          title="الإصدارات"
          outlined
          action={owner ? (
            <button type="button" className="reciter-edit" onClick={() => setEditing(true)}>
              <Pencil size={15} strokeWidth={2.5} />تعديل الإصدارات
            </button>
          ) : null}
        >
          {albums.map(a => <AlbumCard key={a.name} album={a} active={a.name === currentAlbum} onOpen={openAlbum} />)}
        </Shelf>
      ) : null}

      {owner && editingReciter ? (
        <ReciterEditor
          reciter={reciter}
          entries={state.entries}
          onPhoto={url => setState(s => (s.status === 'ready' ? { ...s, reciter: { ...s.reciter, image_url: url ?? '' } } : s))}
          onClose={() => setEditingReciter(false)}
        />
      ) : null}

      {owner && editing ? (
        <ReleaseEditor
          reciterId={String(reciter.id)}
          entries={state.entries}
          albums={albums}
          first={currentAlbum}
          settings={settings}
          onSettings={setSettings}
          onTracks={onTracks}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {others.length > 0 ? (
        <Shelf title="رواديد آخرون" href="/explore?type=reciters">
          {others.map(r => <ReciterCard key={r.id} item={r} />)}
        </Shelf>
      ) : null}
    </div>
  );
}
