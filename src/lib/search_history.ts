// What this browser searched for and opened from the search box, newest
// first: the words searched, and the reciters, tracks and categories chosen
// from its suggestions. Kept in this browser only (localStorage).
// No values are imported, so the scripts' tests run it as it is.

export type HistoryEntry =
  | { kind: 'query'; text: string }
  | { kind: 'reciter' | 'track' | 'category'; id: string; name: string; sub?: string; image?: string };

const KEY = 'search-history';
const MAX = 10;
const ITEMS = ['reciter', 'track', 'category'];

const tidy = (text: string) => text.trim().replace(/\s+/g, ' ');

/** One entry's identity: the same words, or the same reciter, track or category. */
export const entryKey = (e: HistoryEntry) => (e.kind === 'query' ? `q:${tidy(e.text).toLowerCase()}` : `${e.kind}:${e.id}`);

/** The history with [entry] first and no copy of it further down; words left empty are not kept. */
export function remember(list: HistoryEntry[], entry: HistoryEntry, max = MAX): HistoryEntry[] {
  const kept = entry.kind === 'query' ? { kind: 'query' as const, text: tidy(entry.text) } : entry;
  if (kept.kind === 'query' && !kept.text) return list;
  const key = entryKey(kept);
  return [kept, ...list.filter(e => entryKey(e) !== key)].slice(0, max);
}

export const forget = (list: HistoryEntry[], key: string) => list.filter(e => entryKey(e) !== key);

/** The stored history, anything malformed left out. */
export function readHistory(raw: string | null): HistoryEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((e): e is HistoryEntry => {
    if (!e || typeof e !== 'object') return false;
    if (e.kind === 'query') return typeof e.text === 'string' && !!e.text.trim();
    return ITEMS.includes(e.kind) && typeof e.id === 'string' && typeof e.name === 'string';
  }).slice(0, MAX);
}

export function loadHistory(): HistoryEntry[] {
  try {
    return readHistory(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export function saveHistory(list: HistoryEntry[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
  } catch {
    // Private windows may refuse; the history is only a convenience
  }
}
