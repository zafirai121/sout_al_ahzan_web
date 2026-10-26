"use client";

// The listener's library beside every page: their likes, their folders and
// playlists (the newest first or by name, as they choose), and the reciters and
// tracks they heard lately. A playlist's or a folder's options open on a right
// click or on its ⋯ button; a playlist is dragged into a folder, or out of it.

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlaylists, Playlist, PlaylistFolder } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import { thumb } from '@/utils/image';
import { countOf, PLAYLISTS, TRACKS } from '@/utils/plural';
import { useRecentReciters } from '@/utils/recent_reciters';
import { ArrowDownUp, Check, ChevronDown, Ellipsis, Folder, FolderInput, FolderOutput, FolderPlus, Heart, Library, ListMusic, Music, Pencil, Pin, Plus, Search, Trash2, Upload, UserRound, X } from 'lucide-react';
import './AuthModal.css';
import './sidebar.css';

type Filter = 'playlists' | 'reciters' | null;
type Sort = 'recent' | 'name';
const SORT_KEY = 'soutalahzan_library_sort';
const RECENT_SHOWN = 5; // the tracks heard lately, under the rest
const DRAG_TYPE = 'text/x-sawt-playlist';
// The page of all their playlists, with a search of its own: from a playlist's page
// (/playlists?id=…) the static site's router takes "/playlists" for that same page
const ALL_PLAYLISTS = '/playlists?view=all';

interface MenuItem {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean; // one of a choice (the order), ticked when it is the one chosen
  divider?: boolean; // a line above it
}
interface Menu { key: string; label: string; items: MenuItem[]; x: number; y: number }

type Dialog =
  | { kind: 'new-playlist' }
  | { kind: 'new-folder'; move?: string } // move: the playlist that goes into it
  | { kind: 'rename-playlist' | 'rename-folder'; id: string; name: string }
  | { kind: 'delete-playlist'; id: string; name: string };

const NAMING = {
  'new-playlist': { title: 'إنشاء قائمة تشغيل', hint: 'اسم القائمة', action: 'إنشاء' },
  'new-folder': { title: 'إنشاء مجلد', hint: 'اسم المجلد', action: 'إنشاء' },
  'rename-playlist': { title: 'تغيير اسم القائمة', hint: 'اسم القائمة', action: 'حفظ' },
  'rename-folder': { title: 'تغيير اسم المجلد', hint: 'اسم المجلد', action: 'حفظ' },
};

const coverOf = (p: Playlist): string | null => {
  const t = p.tracks[0];
  return t ? (t.thumbnailUrl || t.thumbnail_url || t.imageUrl || t.image_url || null) : null;
};

// A button's menu opens under it, from its reading-side corner
const under = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.right, y: r.bottom + 6 };
};

/** A small menu at a point, left of it (the page reads right to left) and kept on the screen */
function LibraryMenu({ menu, returnTo, onClose }: { menu: Menu; returnTo: React.RefObject<HTMLElement | null>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ left: menu.x, top: menu.y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setAt({
      left: Math.max(8, Math.min(menu.x - width, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(menu.y, window.innerHeight - height - 8)),
    });
  }, [menu]);

  // Focus on its first option, and back on what opened it once it closes
  useLayoutEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const opener = returnTo;
    return () => { if (opener.current?.isConnected) opener.current.focus(); };
  }, [returnTo]);

  useEffect(() => {
    // A press beside it closes it; one on a button that opens a menu is left to that button's
    // click, which closes this one or opens its own
    const beside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!ref.current?.contains(target) && !target.closest?.('.sidebar [aria-haspopup="menu"]')) onClose();
    };
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const options = [...(ref.current?.querySelectorAll<HTMLElement>('button') ?? [])];
      const now = options.indexOf(document.activeElement as HTMLElement);
      options[(now + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus();
    };
    const gone = () => onClose();
    document.addEventListener('mousedown', beside);
    document.addEventListener('keydown', keys);
    window.addEventListener('resize', gone);
    window.addEventListener('blur', gone);
    return () => {
      document.removeEventListener('mousedown', beside);
      document.removeEventListener('keydown', keys);
      window.removeEventListener('resize', gone);
      window.removeEventListener('blur', gone);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="lib-menu" role="menu" aria-label={menu.label} style={at}>
      {menu.items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider ? <div className="lib-menu-line" role="separator" /> : null}
          <button
            type="button"
            role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.checked}
            className={`lib-menu-item${item.danger ? ' is-danger' : ''}`}
            onClick={() => { onClose(); item.onClick(); }}
          >
            <span className="lib-menu-icon">{item.checked === undefined ? item.icon : item.checked ? <Check size={16} /> : null}</span>
            <span className="lib-menu-text">
              <span>{item.label}</span>
              {item.hint ? <small>{item.hint}</small> : null}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/** A window over the page: it closes on Escape, on a click beside it, or on its ✕ */
function LibraryDialog({ title, returnTo, onClose, children }: {
  title: string;
  returnTo: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const keys = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', keys);
    return () => document.removeEventListener('keydown', keys);
  }, [onClose]);

  useLayoutEffect(() => {
    const opener = returnTo;
    return () => { if (opener.current?.isConnected) opener.current.focus(); };
  }, [returnTo]);

  return (
    <div className="auth-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal-container lib-dialog" role="dialog" aria-modal="true" aria-labelledby="lib-dialog-title">
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        <h2 id="lib-dialog-title" className="auth-modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function NameForm({ initial, hint, action, onSubmit, onCancel }: {
  initial: string;
  hint: string;
  action: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  const ok = name.trim().length > 0;
  return (
    <form className="lib-dialog-form" onSubmit={e => { e.preventDefault(); if (ok) onSubmit(name.trim()); }}>
      <input
        className="auth-input"
        value={name}
        onChange={e => setName(e.target.value)}
        onFocus={e => e.currentTarget.select()}
        placeholder={hint}
        aria-label={hint}
        maxLength={100}
        autoFocus
      />
      <div className="lib-dialog-actions">
        <button type="submit" className="btn-gold" disabled={!ok}>{action}</button>
        <button type="button" className="btn-outline" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  );
}

function MoreButton({ label, open, onOpen }: { label: string; open: boolean; onOpen: (el: HTMLElement) => void }) {
  return (
    <button
      type="button"
      className="lib-more"
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={open}
      title="خيارات"
      onClick={e => onOpen(e.currentTarget)}
    >
      <Ellipsis size={18} />
    </button>
  );
}

export default function SideBar() {
  const {
    playlists, folders, likedTracks, createPlaylist, renamePlaylist, deletePlaylist,
    createFolder, renameFolder, deleteFolder, movePlaylistToFolder,
  } = usePlaylists();
  const { recentTracks } = usePlayer();
  const reciters = useRecentReciters();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>(null);
  const [sort, setSort] = useState<Sort>('recent');
  const [open, setOpen] = useState<string[]>([]); // the folders shown open
  const [menu, setMenu] = useState<Menu | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dragged, setDragged] = useState<string | null>(null); // the playlist being dragged
  const [dropOn, setDropOn] = useState<string | null>(null); // the folder ('' the library) it is dragged over
  const opener = useRef<HTMLElement | null>(null); // what opened the menu: focused again when it closes

  // The order they chose, kept in this browser
  useEffect(() => {
    try {
      if (localStorage.getItem(SORT_KEY) === 'name') setSort('name');
    } catch (e) {}
  }, []);
  const chooseSort = (next: Sort) => {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch (e) {}
  };
  // The lists keep the order they were made in: the newest are last
  const sorted = <T extends { name: string }>(list: T[]) =>
    sort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar')) : [...list].reverse();

  const closeMenu = useCallback(() => setMenu(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const openUnder = (el: HTMLElement, key: string, label: string, items: MenuItem[]) => {
    opener.current = el;
    setMenu(m => (m?.key === key ? null : { key, label, items, ...under(el) }));
  };
  const openAtPointer = (e: React.MouseEvent<HTMLElement>, key: string, label: string, items: MenuItem[]) => {
    e.preventDefault();
    const row = e.currentTarget.querySelector<HTMLElement>('.lib-row') ?? e.currentTarget;
    // From the keyboard's menu key there is no pointer: it opens under the row
    const at = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : under(row);
    opener.current = row;
    setMenu({ key, label, items, ...at });
  };

  const createItems: MenuItem[] = [
    { label: 'رفع مقطع', hint: 'شارك مقاطعك مع المستمعين', icon: <Upload size={20} />, onClick: () => router.push('/upload') },
    { label: 'قائمة تشغيل', hint: 'اجمع فيها المقاطع التي تختارها', icon: <ListMusic size={20} />, onClick: () => setDialog({ kind: 'new-playlist' }) },
    { label: 'مجلّد', hint: 'رتّب فيه قوائمك', icon: <Folder size={20} />, divider: true, onClick: () => setDialog({ kind: 'new-folder' }) },
  ];
  const sortItems: MenuItem[] = [
    { label: 'الأحدث', checked: sort === 'recent', onClick: () => chooseSort('recent') },
    { label: 'أبجدياً', checked: sort === 'name', onClick: () => chooseSort('name') },
  ];
  const playlistItems = (p: Playlist): MenuItem[] => [
    { label: 'تغيير الاسم', icon: <Pencil size={16} />, onClick: () => setDialog({ kind: 'rename-playlist', id: p.id, name: p.name }) },
    ...folders.filter(f => f.id !== p.folderId).map(f => ({
      label: `نقل إلى «${f.name}»`, icon: <FolderInput size={16} />, onClick: () => movePlaylistToFolder(p.id, f.id),
    })),
    { label: 'نقل إلى مجلد جديد', icon: <FolderPlus size={16} />, onClick: () => setDialog({ kind: 'new-folder', move: p.id }) },
    ...(p.folderId ? [{ label: 'إخراج من المجلد', icon: <FolderOutput size={16} />, onClick: () => movePlaylistToFolder(p.id, null) }] : []),
    { label: 'حذف القائمة', icon: <Trash2 size={16} />, danger: true, divider: true, onClick: () => setDialog({ kind: 'delete-playlist', id: p.id, name: p.name }) },
  ];
  const folderItems = (f: PlaylistFolder): MenuItem[] => [
    { label: 'تغيير الاسم', icon: <Pencil size={16} />, onClick: () => setDialog({ kind: 'rename-folder', id: f.id, name: f.name }) },
    { label: 'حذف المجلد', hint: 'تبقى قوائمه في مكتبتك', icon: <Trash2 size={16} />, danger: true, divider: true, onClick: () => deleteFolder(f.id) },
  ];

  const named = (name: string) => {
    if (!dialog) return;
    if (dialog.kind === 'new-playlist') {
      router.push(`/playlists?id=${createPlaylist(name)}`);
    } else if (dialog.kind === 'new-folder') {
      const id = createFolder(name);
      if (dialog.move) {
        movePlaylistToFolder(dialog.move, id);
        setOpen(o => [...o, id]);
      }
    } else if (dialog.kind === 'rename-playlist') {
      renamePlaylist(dialog.id, name);
    } else if (dialog.kind === 'rename-folder') {
      renameFolder(dialog.id, name);
    }
    setDialog(null);
  };

  const removePlaylist = (id: string) => {
    deletePlaylist(id);
    setDialog(null);
    // Its own page has nothing left to show
    if (window.location.pathname.startsWith('/playlists') && new URLSearchParams(window.location.search).get('id') === id) router.push(ALL_PLAYLISTS);
  };

  // A playlist dragged onto a folder goes into it; onto the library itself, out of its folder.
  // Where it already is takes nothing
  const dropTarget = (folderId: string | null) => {
    const accepts = (e: React.DragEvent) => {
      const p = playlists.find(x => x.id === dragged);
      if (!p) return false;
      e.stopPropagation();
      if ((p.folderId ?? null) === folderId) {
        setDropOn(null);
        return false;
      }
      e.preventDefault();
      return true;
    };
    return {
      onDragOver: (e: React.DragEvent) => {
        if (!accepts(e)) return;
        e.dataTransfer.dropEffect = 'move';
        setDropOn(folderId ?? '');
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropOn(d => (d === (folderId ?? '') ? null : d));
      },
      onDrop: (e: React.DragEvent) => {
        if (!accepts(e) || !dragged) return;
        setDropOn(null);
        movePlaylistToFolder(dragged, folderId);
      },
    };
  };

  const playlistRow = (p: Playlist) => {
    const cover = coverOf(p);
    const key = `playlist:${p.id}`;
    const label = `خيارات «${p.name}»`;
    return (
      <li
        key={p.id}
        className="lib-item"
        draggable
        onDragStart={e => {
          e.dataTransfer.setData(DRAG_TYPE, p.id); // a drag carries something, or some browsers start none
          e.dataTransfer.effectAllowed = 'move';
          setDragged(p.id);
        }}
        onDragEnd={() => { setDragged(null); setDropOn(null); }}
        onContextMenu={e => openAtPointer(e, key, label, playlistItems(p))}
      >
        <Link href={`/playlists?id=${p.id}`} prefetch={false} className="lib-row" draggable={false}>
          <span className="lib-cover">
            {cover ? <img src={thumb(cover, 96)} alt="" loading="lazy" draggable={false} /> : <ListMusic size={22} />}
          </span>
          <span className="lib-text">
            <span className="lib-name">{p.name}</span>
            <span className="lib-sub">قائمة تشغيل • {p.tracks.length ? countOf(p.tracks.length, TRACKS) : 'فارغة'}</span>
          </span>
        </Link>
        <MoreButton label={label} open={menu?.key === key} onOpen={el => openUnder(el, key, label, playlistItems(p))} />
      </li>
    );
  };

  const folderRow = (f: PlaylistFolder) => {
    const inside = sorted(playlists.filter(p => p.folderId === f.id));
    const isOpen = open.includes(f.id);
    const key = `folder:${f.id}`;
    const label = `خيارات مجلد «${f.name}»`;
    return (
      <li key={f.id} className={`lib-folder${dropOn === f.id ? ' is-drop' : ''}`} {...dropTarget(f.id)}>
        <div className="lib-item" onContextMenu={e => openAtPointer(e, key, label, folderItems(f))}>
          <button
            type="button"
            className="lib-row"
            aria-expanded={isOpen}
            onClick={() => setOpen(o => (isOpen ? o.filter(id => id !== f.id) : [...o, f.id]))}
          >
            <span className="lib-cover is-folder"><Folder size={24} /></span>
            <span className="lib-text">
              <span className="lib-name is-strong">{f.name}</span>
              <span className="lib-sub">مجلّد • {inside.length ? countOf(inside.length, PLAYLISTS) : 'فارغ'}</span>
            </span>
            <ChevronDown size={16} className={`lib-chevron${isOpen ? ' is-open' : ''}`} aria-hidden="true" />
          </button>
          <MoreButton label={label} open={menu?.key === key} onOpen={el => openUnder(el, key, label, folderItems(f))} />
        </div>
        {isOpen ? (
          <ul className="lib-nested">
            {inside.map(playlistRow)}
            {inside.length ? null : <li className="lib-note">اسحب قائمة إلى هنا، أو انقلها إليه من خياراتها</li>}
          </ul>
        ) : null}
      </li>
    );
  };

  const showLists = filter !== 'reciters';
  const showReciters = filter !== 'playlists';
  const showRecent = filter === null && recentTracks.length > 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-header lib-header">
        <Link href={ALL_PLAYLISTS} prefetch={false} className="lib-title">
          <Library size={24} />
          <span>مكتبتك الصوتية</span>
        </Link>
        <div className="lib-actions">
          <button
            type="button"
            className="lib-icon"
            aria-label="إنشاء"
            title="إنشاء"
            aria-haspopup="menu"
            aria-expanded={menu?.key === 'create'}
                  onClick={e => openUnder(e.currentTarget, 'create', 'إنشاء', createItems)}
          >
            <Plus size={18} />
          </button>
          <Link href="/search" prefetch={false} className="lib-icon" aria-label="ابحث" title="ابحث">
            <Search size={18} />
          </Link>
        </div>
      </div>

      <div className="lib-chips" role="group" aria-label="ما يظهر في مكتبتك">
        {(['playlists', 'reciters'] as const).map(f => (
          <button key={f} type="button" className={`lib-chip${filter === f ? ' is-on' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(filter === f ? null : f)}>
            {f === 'playlists' ? 'قوائم التشغيل' : 'الرواديد'}
          </button>
        ))}
      </div>

      <div className={`sidebar-content lib-content${dropOn === '' ? ' is-drop' : ''}`} {...dropTarget(null)}>
        {showLists ? (
          <>
            <div className="lib-bar">
              <button
                type="button"
                className="lib-sort"
                aria-label={`ترتيب القوائم: ${sort === 'name' ? 'أبجدياً' : 'الأحدث'}`}
                aria-haspopup="menu"
                aria-expanded={menu?.key === 'sort'}
                          onClick={e => openUnder(e.currentTarget, 'sort', 'ترتيب القوائم', sortItems)}
              >
                <ArrowDownUp size={14} aria-hidden="true" />
                <span>{sort === 'name' ? 'أبجدياً' : 'الأحدث'}</span>
              </button>
            </div>
            <ul className="lib-list">
              <li className="lib-item">
                <Link href="/playlists?id=likes" prefetch={false} className="lib-row">
                  <span className="lib-cover is-likes"><Heart size={22} fill="currentColor" strokeWidth={0} /></span>
                  <span className="lib-text">
                    <span className="lib-name is-strong">الإعجابات</span>
                    <span className="lib-sub">
                      <Pin size={13} className="lib-pin" aria-hidden="true" />
                      قائمة تشغيل • {likedTracks.length ? countOf(likedTracks.length, TRACKS) : 'لا مقاطع بعد'}
                    </span>
                  </span>
                </Link>
              </li>
              {sorted(folders).map(folderRow)}
              {sorted(playlists.filter(p => !p.folderId)).map(playlistRow)}
            </ul>
          </>
        ) : null}

        {showReciters && (reciters.length > 0 || filter === 'reciters') ? (
          <section aria-labelledby="lib-reciters">
            <h3 id="lib-reciters" className="lib-heading">رواديد استمعت إليهم</h3>
            {reciters.length ? (
              <ul className="lib-list">
                {reciters.map(r => (
                  <li key={r.id} className="lib-item">
                    <Link href={`/reciter?id=${r.id}`} prefetch={false} className="lib-row">
                      <span className="lib-cover is-round">
                        {r.image_url ? <img src={thumb(r.image_url, 96)} alt="" loading="lazy" /> : <UserRound size={22} />}
                      </span>
                      <span className="lib-text">
                        <span className="lib-name">{r.name}</span>
                        <span className="lib-sub">رادود</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lib-empty">استمع إلى المقاطع، فيظهر هنا رواديدها.</p>
            )}
          </section>
        ) : null}

        {showRecent ? (
          <section aria-labelledby="lib-recent">
            <h3 id="lib-recent" className="lib-heading">استمعت إليها مؤخراً</h3>
            <ul className="lib-list">
              {recentTracks.slice(0, RECENT_SHOWN).map(t => (
                <li key={t.id} className="lib-item">
                  <Link href={`/track?id=${t.id}`} prefetch={false} className="lib-row">
                    <span className="lib-cover">
                      {t.imageUrl ? <img src={thumb(t.imageUrl, 96)} alt="" loading="lazy" /> : <Music size={22} />}
                    </span>
                    <span className="lib-text">
                      <span className="lib-name">{t.title}</span>
                      <span className="lib-sub">مقطع • {t.artist}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {menu ? <LibraryMenu key={`${menu.key}@${menu.x},${menu.y}`} menu={menu} returnTo={opener} onClose={closeMenu} /> : null}

      {dialog?.kind === 'delete-playlist' ? (
        <LibraryDialog title="حذف القائمة؟" returnTo={opener} onClose={closeDialog}>
          <p className="lib-dialog-text">ستُحذف «{dialog.name}» من مكتبتك، ولا يمكن التراجع عن ذلك.</p>
          <div className="lib-dialog-actions">
            <button type="button" className="btn-outline lib-danger" onClick={() => removePlaylist(dialog.id)}>حذف</button>
            <button type="button" className="btn-outline" onClick={closeDialog} autoFocus>إلغاء</button>
          </div>
        </LibraryDialog>
      ) : dialog ? (
        <LibraryDialog title={NAMING[dialog.kind].title} returnTo={opener} onClose={closeDialog}>
          <NameForm
            initial={'name' in dialog ? dialog.name : ''}
            hint={NAMING[dialog.kind].hint}
            action={NAMING[dialog.kind].action}
            onSubmit={named}
            onCancel={closeDialog}
          />
        </LibraryDialog>
      ) : null}
    </aside>
  );
}
