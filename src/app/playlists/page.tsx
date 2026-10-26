"use client";

// The listener's playlists: all of them (/playlists), or one (/playlists?id=…,
// "likes" for the tracks they liked). Kept in this browser, and in their
// account when signed in (PlaylistContext). One playlist is laid out as a
// reciter's page is, in gold: a header with its cover and name, a bar that
// plays it, its tracks.

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ellipsis, Heart, ListEnd, ListMusic, Pause, Pencil, Play, Plus, Shuffle, Trash2 } from 'lucide-react';
import { usePlaylists } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import DropdownMenu from '@/components/DropdownMenu';
import TrackRows from '@/components/TrackRows';
import { getTrackData } from '@/utils/data_mapper';
import { COVER_PLACEHOLDER, thumb } from '@/utils/image';
import { totalTime } from '@/utils/duration';
import { countOf, TRACKS } from '@/utils/plural';
import { Track } from '@/types';
import '@/components/playlist/playlist.css';

const LIKES = 'likes';

// "لا مقاطع بعد" for an empty list, as the library in the sidebar says
const tracksIn = (n: number) => (n ? countOf(n, TRACKS) : 'لا مقاطع بعد');

// "12 تشرين الأول 2026", the months as they are named in Iraq
const day = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const dateOf = (iso: unknown) => {
  const d = typeof iso === 'string' ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? day.format(d) : '';
};

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The likes' heart in gold; a playlist's covers, four together when it has four */
function Cover({ tracks, likes, big }: { tracks: Track[]; likes?: boolean; big?: boolean }) {
  if (likes) {
    return <span className="pls-cover is-likes"><Heart size={big ? 96 : 56} fill="currentColor" strokeWidth={0} /></span>;
  }
  const covers = [...new Set(tracks.map(t => t.imageUrl).filter((u): u is string => !!u && u !== COVER_PLACEHOLDER))];
  if (covers.length >= 4) {
    return (
      <span className="pls-cover is-grid">
        {covers.slice(0, 4).map(u => <img key={u} src={thumb(u, big ? 240 : 160)} alt="" />)}
      </span>
    );
  }
  if (covers.length) return <span className="pls-cover"><img src={thumb(covers[0], big ? 480 : 320)} alt="" /></span>;
  return <span className="pls-cover is-empty"><ListMusic size={big ? 88 : 56} /></span>;
}

function PlaylistView({ id, fresh }: { id: string; fresh: boolean }) {
  const router = useRouter();
  const { playlists, likedTracks, libraryLoaded, removeTrackFromPlaylist, deletePlaylist, renamePlaylist } = usePlaylists();
  const { playQueue, addToQueue, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  const likes = id === LIKES;
  const playlist = likes ? null : playlists.find(p => p.id === id) ?? null;
  const stored = likes ? likedTracks : playlist?.tracks;
  // As the player wants them, with what the list keeps of each: when it was
  // added, and the id it was stored under (older lists kept it as a number)
  const items = useMemo(
    () => (stored ?? []).map(t => ({ track: getTrackData(t), addedAt: t.addedAt, storedId: t.id })),
    [stored],
  );
  const tracks = useMemo(() => items.map(i => i.track), [items]);
  const queue = useMemo(() => tracks.filter(t => t.audioUrl), [tracks]);

  const [renaming, setRenaming] = useState(fresh);
  const [deleting, setDeleting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // What a button did, said for a moment
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(''), 2500);
    return () => clearTimeout(t);
  }, [note]);

  useEffect(() => {
    if (renaming) nameRef.current?.select();
  }, [renaming]);
  // Only once: reopened later, the list is no longer new
  useEffect(() => {
    if (fresh) window.history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
  }, [fresh, id]);

  if (!libraryLoaded) {
    return (
      <div className="content-inner pls-page" aria-busy="true">
        <div className="pls-hero-frame"><section className="pls-hero" aria-hidden="true" /></div>
      </div>
    );
  }

  if (!likes && !playlist) {
    return (
      <div className="content-inner pls-page pls-missing">
        <h1>لم نجد هذه القائمة</h1>
        <p>ربما حُذفت، أو هي في مكتبة حساب آخر.</p>
        <Link href="/playlists" prefetch={false} className="btn-gold">قوائم التشغيل</Link>
      </div>
    );
  }

  const name = likes ? 'الإعجابات' : playlist!.name;
  const time = totalTime(tracks.map(t => t.duration));
  const playingHere = isPlaying && queue.some(t => t.id == currentTrack?.id);

  const playAll = () => {
    if (queue.some(t => t.id == currentTrack?.id)) togglePlayPause();
    else if (queue.length) playQueue(queue, 0);
  };
  const queueAll = () => {
    queue.forEach(addToQueue);
    setNote(`أُضيف ${countOf(queue.length, TRACKS)} إلى قائمة الانتظار`);
  };
  const saveName = () => {
    const next = nameRef.current?.value.trim() ?? '';
    if (next && next !== name) renamePlaylist(id, next);
    setRenaming(false);
  };

  return (
    <div className="content-inner pls-page">
      <div className="pls-hero-frame">
        <section className="pls-hero" aria-labelledby="pls-name">
          <Cover tracks={tracks} likes={likes} big />
          <div className="pls-hero-text">
            <span className="pls-kind">قائمة تشغيل</span>
            {renaming ? (
              <form onSubmit={e => { e.preventDefault(); saveName(); }}>
                <input
                  ref={nameRef}
                  id="pls-name"
                  className="pls-name pls-name-input"
                  defaultValue={name}
                  maxLength={100}
                  aria-label="اسم القائمة"
                  onBlur={saveName}
                  onKeyDown={e => { if (e.key === 'Escape') setRenaming(false); }}
                />
              </form>
            ) : (
              <h1 id="pls-name" className={`pls-name${name.length > 16 ? ' is-long' : ''}`}>{name}</h1>
            )}
            <p className="pls-facts">
              <strong>{tracksIn(tracks.length)}</strong>
              {time ? <span>{time}</span> : null}
            </p>
          </div>
        </section>
      </div>

      <section className="pls-body" aria-label="المقاطع">
        <div className="pls-bar">
          <button
            type="button"
            className="pls-play"
            onClick={playAll}
            disabled={!queue.length}
            aria-label={playingHere ? 'إيقاف' : `تشغيل ${name}`}
            title={playingHere ? 'إيقاف' : 'تشغيل'}
          >
            {playingHere ? <Pause size={26} fill="currentColor" strokeWidth={0} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
          </button>
          <button type="button" className="pls-icon-btn" onClick={() => playQueue(shuffled(queue), 0)} disabled={!queue.length} aria-label={`تشغيل ${name} عشوائياً`} title="تشغيل عشوائي">
            <Shuffle size={30} />
          </button>
          <button type="button" className="pls-icon-btn" onClick={queueAll} disabled={!queue.length} aria-label="أضف كل المقاطع إلى قائمة الانتظار" title="أضف الكل إلى قائمة الانتظار">
            <ListEnd size={30} />
          </button>
          {likes ? null : (
            <DropdownMenu
              label={`خيارات ${name}`}
              buttonContent={<span className="pls-icon-btn" title="المزيد"><Ellipsis size={30} /></span>}
              menuStyle={{ minWidth: '220px' }}
              items={[
                { label: 'تغيير الاسم', onClick: () => setRenaming(true), rightIcon: <Pencil size={18} /> },
                { label: 'حذف القائمة', onClick: () => setDeleting(true), rightIcon: <Trash2 size={18} /> },
              ]}
            />
          )}
          <span className="pls-note" role="status">{note}</span>
        </div>

        {deleting ? (
          <div className="pls-confirm" role="alertdialog" aria-labelledby="pls-confirm-text">
            <p id="pls-confirm-text">تُحذف «{name}» من مكتبتك، ولا تُحذف مقاطعها من الموقع.</p>
            <button type="button" className="pls-danger" onClick={() => { deletePlaylist(id); router.push('/playlists'); }}>حذف القائمة</button>
            <button type="button" className="btn-outline" onClick={() => setDeleting(false)}>إلغاء</button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <TrackRows
            queue={queue}
            asideTitle="تاريخ الإضافة"
            rows={items.map(({ track, addedAt, storedId }) => ({
              track,
              sub: track.artist,
              aside: dateOf(addedAt),
              menu: likes ? undefined : [
                { label: 'إزالة من هذه القائمة', onClick: () => removeTrackFromPlaylist(id, storedId), rightIcon: <Trash2 size={18} /> },
              ],
            }))}
          />
        ) : (
          <div className="pls-empty">
            <p>{likes ? 'لم تُعجب بمقطع بعد. اضغط ⋮ بجانب أي مقطع واختر «حفظ في المفضلة».' : 'القائمة فارغة. اضغط ⋮ بجانب أي مقطع واختر «أضف إلى قائمة تشغيل».'}</p>
            <Link href="/explore" prefetch={false} className="btn-outline">تصفّح المقاطع</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function PlaylistIndex() {
  const router = useRouter();
  const { playlists, likedTracks, createPlaylist } = usePlaylists();
  const covers = useMemo(() => new Map(playlists.map(p => [p.id, p.tracks.map(getTrackData)])), [playlists]);

  // A new list opens with its name ready to be changed
  const newList = () => router.push(`/playlists?id=${createPlaylist(`قائمتي ${playlists.length + 1}`)}&new=1`);

  return (
    <div className="content-inner pls-index">
      <header className="pls-index-head">
        <h1>قوائم التشغيل</h1>
        <button type="button" className="btn-gold" onClick={newList}><Plus size={18} /> قائمة جديدة</button>
      </header>
      <div className="pls-grid">
        <Link href={`/playlists?id=${LIKES}`} prefetch={false} className="pls-card">
          <Cover tracks={[]} likes />
          <span className="pls-card-name">الإعجابات</span>
          <span className="pls-card-sub">{tracksIn(likedTracks.length)}</span>
        </Link>
        {playlists.map(p => (
          <Link key={p.id} href={`/playlists?id=${p.id}`} prefetch={false} className="pls-card">
            <Cover tracks={covers.get(p.id) ?? []} />
            <span className="pls-card-name">{p.name}</span>
            <span className="pls-card-sub">{tracksIn(p.tracks.length)}</span>
          </Link>
        ))}
      </div>
      {playlists.length === 0 ? (
        <p className="pls-hint">اجمع في قائمة ما تحب أن تسمعه معاً: أنشئ قائمة، ثم أضف إليها من زر ⋮ بجانب أي مقطع.</p>
      ) : null}
    </div>
  );
}

function PlaylistsContent() {
  const params = useSearchParams();
  const id = params.get('id');
  return id ? <PlaylistView key={id} id={id} fresh={params.get('new') === '1'} /> : <PlaylistIndex />;
}

export default function PlaylistsPage() {
  return (
    <Suspense fallback={<div className="content-inner" />}>
      <PlaylistsContent />
    </Suspense>
  );
}
