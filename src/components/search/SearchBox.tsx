"use client";

// The search box in the top bar. Focused with nothing typed, the list under it
// (as wide as the box) shows what this browser searched for and opened
// lately, each one removable; typing shows the matching categories, reciters
// and tracks, and Enter (or its first line) the search page. The button at
// its end browses the categories (the search page with nothing asked).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { History, LayoutGrid, Search, Shapes, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { entryKey, forget, HistoryEntry, loadHistory, remember, saveHistory } from '@/lib/search_history';
import { searchPatterns, titleOrReciter } from '@/utils/arabic_search';
import { CATEGORY_LIST, foldArabic } from '@/utils/categories';
import { readableTitle } from '@/utils/data_mapper';
import { thumb } from '@/utils/image';
import { CATEGORY_ICONS } from '@/components/home/HomeParts';
import './search-box.css';

type Item = Extract<HistoryEntry, { kind: 'reciter' | 'track' | 'category' }>;
// A line of the list: something to open, or words to search for
type Row = { entry: HistoryEntry; fromHistory: boolean };

const NOT_A_RECITER = 'مجهول';
const CATEGORY_COLOR = new Map(CATEGORY_LIST.map(c => [c.id, c.color]));

const hrefOf = (e: HistoryEntry) =>
  e.kind === 'query' ? `/search?q=${encodeURIComponent(e.text)}`
    : e.kind === 'reciter' ? `/reciter?id=${e.id}`
    : e.kind === 'track' ? `/track?id=${e.id}`
    : `/category/${e.id}`;

// The categories whose name has what was typed
const categoriesFor = (text: string): Item[] => {
  const typed = foldArabic(text.trim());
  if (!typed) return [];
  return CATEGORY_LIST.filter(c => foldArabic(c.title).includes(typed))
    .slice(0, 2)
    .map(c => ({ kind: 'category', id: c.id, name: c.title, sub: 'قسم' }));
};

async function suggestionsFor(text: string): Promise<Item[]> {
  const words = searchPatterns(text);
  if (words.length === 0) return [];
  let tracks = supabase.from('audio_library').select('id,title,reciter_name,image_url');
  for (const w of words) tracks = tracks.or(titleOrReciter(w));
  let reciters = supabase.from('reciters').select('id,name,image_url').neq('name', NOT_A_RECITER);
  for (const w of words) reciters = reciters.filter('name', 'imatch', w);
  const [t, r] = await Promise.all([
    tracks.order('listen_count', { ascending: false, nullsFirst: false }).limit(5),
    reciters.limit(3),
  ]);
  return [
    ...(r.data ?? []).map(x => ({ kind: 'reciter' as const, id: String(x.id), name: x.name, sub: 'رادود', image: x.image_url || '' })),
    ...(t.data ?? []).map(x => ({ kind: 'track' as const, id: String(x.id), name: readableTitle(x.title || ''), sub: x.reciter_name || 'مقطع', image: x.image_url || '' })),
  ];
}

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [found, setFound] = useState<{ text: string; items: Item[] } | null>(null);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();

  // Closed by a click anywhere else
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  // Ctrl+K, or "/" outside a text box, goes to the search box
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const inField = (e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"]');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !inField)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  // What matches, a moment after typing stops
  useEffect(() => {
    if (typed.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      suggestionsFor(typed)
        .then(items => { if (live) setFound({ text: typed, items }); })
        .catch(() => { if (live) setFound({ text: typed, items: [] }); });
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [typed]);

  const rows: Row[] = useMemo(() => {
    if (!typed) return history.map(entry => ({ entry, fromHistory: true }));
    const items = [...categoriesFor(typed), ...(found?.text === typed ? found.items : [])];
    return [{ entry: { kind: 'query', text: typed }, fromHistory: false }, ...items.map(entry => ({ entry, fromHistory: false }))];
  }, [typed, history, found]);
  const waiting = typed.length >= 2 && found?.text !== typed;

  const keep = (next: HistoryEntry[]) => {
    setHistory(next);
    saveHistory(next);
  };

  const go = (entry: HistoryEntry) => {
    keep(remember(loadHistory(), entry));
    setOpen(false);
    setActive(-1);
    input.current?.blur();
    // The words searched stay in the box, over their results
    setQuery(entry.kind === 'query' ? entry.text : '');
    router.push(hrefOf(entry));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (rows.length === 0) return;
      // -1 is the box itself: past the last line, back to what was typed
      const next = active + (e.key === 'ArrowDown' ? 1 : -1);
      setActive(next < -1 ? rows.length - 1 : next >= rows.length ? -1 : next);
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && rows[active]) go(rows[active].entry);
      else if (typed) go({ kind: 'query', text: typed });
    }
  };

  const browsing = pathname === '/search' && !typed;

  return (
    <div className={`sb${open ? ' is-open' : ''}`} ref={box} role="search">
      <div className="sb-bar">
        <button type="button" className="sb-icon" onClick={() => (typed ? go({ kind: 'query', text: typed }) : input.current?.focus())} aria-label="ابحث" tabIndex={-1}>
          <Search size={22} />
        </button>
        <input
          ref={input}
          type="text"
          value={query}
          placeholder="ابحث عن قصيدة أو رادود أو قسم"
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => { setHistory(loadHistory()); setOpen(true); }}
          onKeyDown={onKey}
          aria-label="ابحث عن قصيدة أو رادود أو قسم"
          role="combobox"
          aria-expanded={open}
          aria-controls="sb-list"
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `sb-row-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button type="button" className="sb-icon sb-clear" onClick={() => { setQuery(''); setActive(-1); input.current?.focus(); }} aria-label="امسح ما كُتب">
            <X size={20} />
          </button>
        ) : null}
        <span className="sb-divider" aria-hidden="true" />
        <Link href="/search" prefetch={false} className={`sb-icon sb-browse${browsing ? ' is-on' : ''}`} aria-label="تصفّح الأقسام" title="تصفّح الأقسام" onClick={() => setOpen(false)}>
          <LayoutGrid size={21} />
        </Link>
      </div>

      {open ? (
        <div className="sb-panel" id="sb-list" role="listbox" aria-label={typed ? 'اقتراحات البحث' : 'عمليات البحث الأخيرة'}>
          {!typed && rows.length > 0 ? <p className="sb-head">عمليات البحث الأخيرة</p> : null}

          {rows.map(({ entry, fromHistory }, i) => (
            <div
              key={entryKey(entry)}
              id={`sb-row-${i}`}
              role="option"
              aria-selected={i === active}
              className={`sb-row${i === active ? ' is-active' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(entry)}
            >
              <Art entry={entry} fromHistory={fromHistory} />
              <span className="sb-text">
                <span className="sb-name">{entry.kind === 'query' ? (fromHistory ? entry.text : `ابحث عن «${entry.text}»`) : entry.name}</span>
                {entry.kind !== 'query' && entry.sub ? <span className="sb-sub">{entry.sub}</span> : null}
              </span>
              {fromHistory ? (
                <button
                  type="button"
                  className="sb-remove"
                  aria-label={`احذف «${entry.kind === 'query' ? entry.text : entry.name}» من السجل`}
                  onClick={e => { e.stopPropagation(); keep(forget(history, entryKey(entry))); setActive(-1); }}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ))}

          {waiting ? <p className="sb-note" role="status">جارٍ البحث…</p> : null}
          {typed.length >= 2 && !waiting && rows.length === 1 ? <p className="sb-note">لا اقتراحات، اضغط Enter لترى كل النتائج.</p> : null}

          {!typed && rows.length > 0 ? (
            <button type="button" className="sb-forget" onMouseDown={e => e.preventDefault()} onClick={() => keep([])}>
              مسح سجل البحث
            </button>
          ) : null}

          {/* Nothing searched yet: the categories, to start from */}
          {!typed && rows.length === 0 ? (
            <div className="sb-start">
              <p className="sb-head">تصفّح الأقسام</p>
              <div className="sb-chips">
                {CATEGORY_LIST.map(c => {
                  const Icon = CATEGORY_ICONS[c.id] ?? Shapes;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="sb-chip"
                      style={{ '--tile': c.color } as React.CSSProperties}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => go({ kind: 'category', id: c.id, name: c.title, sub: 'قسم' })}
                    >
                      <Icon size={15} />{c.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Each line's picture: the reciter round, the track square, the category in its colour, words as an icon. */
function Art({ entry, fromHistory }: { entry: HistoryEntry; fromHistory: boolean }) {
  if (entry.kind === 'query') {
    return <span className="sb-art sb-art--icon">{fromHistory ? <History size={18} /> : <Search size={18} />}</span>;
  }
  if (entry.kind === 'category') {
    const Icon = CATEGORY_ICONS[entry.id] ?? Shapes;
    return <span className="sb-art sb-art--category" style={{ '--tile': CATEGORY_COLOR.get(entry.id) } as React.CSSProperties}><Icon size={18} /></span>;
  }
  return (
    <span className={`sb-art sb-art--${entry.kind}`}>
      <img src={thumb(entry.image || '/cover-placeholder.svg', 96)} alt="" width={44} height={44} loading="lazy" decoding="async" />
    </span>
  );
}
