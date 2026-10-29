"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Plus, RotateCcw, X } from 'lucide-react';
import { canBeCover, changeReleases, ReleaseChange, ReleaseSettings, uploadCover } from '@/lib/release_settings';
import { COVER_PLACEHOLDER, thumb } from '@/utils/image';
import { foldArabic } from '@/utils/categories';
import { countOf, TRACKS } from '@/utils/plural';
import type { Album, Entry } from '@/components/reciter/ReciterParts';
import '@/components/add-to-playlist.css';

// In the "انقله إلى" list: out of every release
const OUT = '\u0000out';
const FOUND = 20;

/**
 * The owner's tools for a reciter's releases, one release at a time: its
 * name, its cover, its tracks (moved to another release or out of any, or
 * brought in from the reciter's other tracks), and the reciter's «جديد» card
 * on the homepage.
 */
export default function ReleaseEditor({ reciterId, entries, albums, first, settings, onSettings, onTracks, onClose }: {
  reciterId: string;
  entries: Entry[];
  albums: Album[];
  /** The release it opens on */
  first: string;
  settings: ReleaseSettings;
  onSettings: (next: ReleaseSettings) => void;
  /** These tracks are now in [album] ('' for none) */
  onTracks: (ids: number[], album: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(first || albums[0]?.name || '');
  const album = albums.find(a => a.name === name) ?? albums[0];
  const [newName, setNewName] = useState(album?.name ?? '');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ text: string; error?: boolean } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Its tracks' pictures that can be its cover, the newest first
  const pictures = useMemo(() => {
    if (!album) return [];
    const urls = [...album.entries].reverse().map(e => e.track.imageUrl).filter((u): u is string => !!u && u !== COVER_PLACEHOLDER && canBeCover(u));
    return [...new Set(urls)].slice(0, 12);
  }, [album]);

  // The reciter's other tracks matching the search, to bring into this release
  const found = useMemo(() => {
    const words = foldArabic(query.trim());
    if (!words || !album) return [];
    return entries.filter(e => e.album !== album.name && e.key.includes(words)).sort((a, b) => b.id - a.id).slice(0, FOUND);
  }, [query, entries, album]);

  const pick = (next: string) => {
    setName(next);
    setNewName(next);
    setQuery('');
    setSaid(null);
  };

  const save = async (change: ReleaseChange, done: string) => {
    setBusy(true);
    setSaid(null);
    const result = await changeReleases(change);
    setBusy(false);
    if ('error' in result) {
      setSaid({ text: result.error, error: true });
      return false;
    }
    onSettings(result.settings);
    setSaid({ text: done });
    return true;
  };

  if (!album) return null;
  const chosenCover = settings.covers[reciterId]?.[album.name];
  const hidden = settings.hidden.includes(reciterId);
  const opens = settings.open[reciterId];

  const rename = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = newName.trim();
    if (!to || to === album.name) return;
    const ids = album.entries.map(x => x.id);
    if (await save({ action: 'rename', reciterId, ids, from: album.name, to }, `صار اسم الإصدار «${to}»`)) {
      onTracks(ids, to);
      setName(to);
    }
  };

  const move = async (ids: number[], target: string) => {
    const into = target === OUT ? null : target;
    const done = into ? `نُقل إلى «${into}»` : 'أُخرج من الإصدارات';
    if (await save({ action: 'move', reciterId, ids, album: into }, done)) onTracks(ids, into ?? '');
  };

  const setCover = (imageUrl: string | null) =>
    save({ action: 'cover', reciterId, album: album.name, imageUrl }, imageUrl ? 'تغيّر الغلاف' : 'عاد الغلاف إلى صورة آخر مقطع');

  const upload = async (picked: File | undefined) => {
    if (!picked) return;
    setBusy(true);
    setSaid({ text: 'جارٍ رفع الصورة…' });
    const result = await uploadCover(picked);
    setBusy(false);
    if ('error' in result) setSaid({ text: result.error, error: true });
    else await setCover(result.url);
  };

  return (
    <div className="pl-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pl-modal rel-modal" role="dialog" aria-modal="true" aria-labelledby="rel-title">
        <header className="pl-head">
          <h2 id="rel-title" className="pl-title">تعديل الإصدارات</h2>
          <button type="button" className="pl-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="rel-body">
          <label className="rel-pick">
            <span>الإصدار</span>
            <select value={album.name} onChange={e => pick(e.target.value)} disabled={busy}>
              {albums.map(a => <option key={a.name} value={a.name}>{a.name} ({countOf(a.entries.length, TRACKS)})</option>)}
            </select>
          </label>

          <section className="rel-part" aria-labelledby="rel-name">
            <h3 id="rel-name">اسم الإصدار</h3>
            <form className="rel-row" onSubmit={rename}>
              <input value={newName} onChange={e => setNewName(e.target.value)} maxLength={300} aria-label="اسم الإصدار الجديد" />
              <button type="submit" className="rel-btn" disabled={busy || !newName.trim() || newName.trim() === album.name}>احفظ الاسم</button>
            </form>
            <p className="rel-note">إن كتبت اسم إصدار آخر للرادود، يُضمّ هذا الإصدار إليه.</p>
          </section>

          <section className="rel-part" aria-labelledby="rel-cover">
            <h3 id="rel-cover">الغلاف</h3>
            <div className="rel-covers">
              {pictures.map(url => (
                <button
                  key={url}
                  type="button"
                  className={`rel-cover${url === album.cover ? ' is-chosen' : ''}`}
                  onClick={() => setCover(url)}
                  disabled={busy || url === album.cover}
                  aria-label="اجعلها الغلاف"
                  aria-pressed={url === album.cover}
                >
                  <img src={thumb(url, 160)} alt="" width={80} height={80} loading="lazy" />
                </button>
              ))}
              {chosenCover && !pictures.includes(chosenCover) ? (
                <span className="rel-cover is-chosen"><img src={thumb(chosenCover, 160)} alt="الغلاف الحالي" width={80} height={80} /></span>
              ) : null}
              <button type="button" className="rel-cover rel-cover--add" onClick={() => file.current?.click()} disabled={busy}>
                <ImagePlus size={22} />
                <span>ارفع صورة</span>
              </button>
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            {chosenCover ? (
              <button type="button" className="rel-link" onClick={() => setCover(null)} disabled={busy}>
                <RotateCcw size={14} />صورة آخر مقطع غلافاً
              </button>
            ) : (
              <p className="rel-note">الغلاف الآن صورة آخر مقطع في الإصدار.</p>
            )}
          </section>

          <section className="rel-part" aria-labelledby="rel-tracks">
            <h3 id="rel-tracks">المقاطع ({countOf(album.entries.length, TRACKS)})</h3>
            <ul className="rel-tracks">
              {album.entries.map(e => (
                <li key={e.id} className="rel-track">
                  <span className="rel-track-title">{e.track.title}</span>
                  <select value="" onChange={ev => move([e.id], ev.target.value)} disabled={busy} aria-label={`انقل «${e.track.title}»`}>
                    <option value="" disabled>انقله إلى…</option>
                    {albums.filter(a => a.name !== album.name).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    <option value={OUT}>خارج الإصدارات</option>
                  </select>
                </li>
              ))}
            </ul>
            <input
              className="rel-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث في مقاطع الرادود الأخرى لتضيفها هنا"
              aria-label="ابحث في مقاطع الرادود الأخرى"
            />
            {found.length > 0 ? (
              <ul className="rel-tracks">
                {found.map(e => (
                  <li key={e.id} className="rel-track">
                    <span className="rel-track-title">
                      {e.track.title}
                      <small>{e.album ? `في «${e.album}»` : 'بلا إصدار'}</small>
                    </span>
                    <button type="button" className="rel-btn" onClick={() => move([e.id], album.name)} disabled={busy}>
                      <Plus size={14} strokeWidth={3} />أضف
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? <p className="rel-note">لا مقاطع أخرى بهذا الاسم.</p> : null}
          </section>

          <section className="rel-part" aria-labelledby="rel-home">
            <h3 id="rel-home">بطاقة «جديد» في الرئيسية</h3>
            <label className="rel-check">
              <input
                type="checkbox"
                checked={!hidden}
                onChange={e => save({ action: 'hide', reciterId, hidden: !e.target.checked }, e.target.checked ? 'تظهر البطاقة في الرئيسية' : 'أُخفيت البطاقة من الرئيسية')}
                disabled={busy}
              />
              تظهر بطاقة هذا الرادود في «أحدث الإصدارات»
            </label>
            {opens === album.name ? (
              <button type="button" className="rel-link" onClick={() => save({ action: 'open', reciterId, album: null }, 'البطاقة تفتح إصدار أحدث مقطع')} disabled={busy}>
                <RotateCcw size={14} />البطاقة تفتح هذا الإصدار، أعدها لإصدار أحدث مقطع
              </button>
            ) : (
              <>
                <button type="button" className="rel-btn" onClick={() => save({ action: 'open', reciterId, album: album.name }, 'البطاقة تفتح هذا الإصدار')} disabled={busy}>
                  اجعل البطاقة تفتح هذا الإصدار
                </button>
                <p className="rel-note">{opens ? `تفتح الآن «${opens}».` : 'تفتح الآن إصدار أحدث مقطع.'}</p>
              </>
            )}
          </section>
        </div>

        <p className={`rel-status${said?.error ? ' is-error' : ''}`} role={said?.error ? 'alert' : 'status'}>{said?.text ?? ''}</p>
      </div>
    </div>
  );
}
