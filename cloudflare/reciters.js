// A track's reciter page: the reciters table's row of its name, made when the
// library has none yet, so every track shows under its reciter on the site
// (/reciter?id= lists the tracks whose reciter_id is that row's) and a reciter
// new to the library gets a page of their own. The database links a new
// track to a reciter it already has; it makes no page for a new one.
//
// A name is matched however it is written ("كرار أبو غنيم", "كرار ابو غنيم",
// "الرادود كرار ابو غنيم" are one reciter), so no reciter gets two pages, and
// the track takes the spelling of the page it goes on.
import { db as serviceDb } from './server-api.js';

export const NOT_A_RECITER = 'مجهول';

// Words before a name that say what someone is, not who (as in the apps' TrackGuess)
const HONORIFICS = new Set([
  'الرادود', 'الملا', 'ملا', 'السيد', 'سيد', 'الشيخ', 'شيخ', 'الحاج', 'حاج', 'المنشد', 'القاري', 'الخطيب',
]);

/**
 * A reciter's name as compared: no tashkeel, one alef, ه for ة, ي for ى, no
 * titles, no "ال" at the words' starts and no spaces ("حسين الفيصل" and
 * "حسين فيصل" alike). The same as the apps' looseKey(nameKey()).
 */
export function reciterKey(name) {
  const words = String(name ?? '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const named = words.filter((w) => !HONORIFICS.has(w));
  return (named.length ? named : words).map((w) => (w.startsWith('ال') ? w.slice(2) : w)).join('');
}

// Names merged into another reciter's page by the site's owner
// (functions/api/admin/reciter.js), kept in the bucket: { key of the name: id
// of the page }. A track sent with such a name goes on that page, and no page
// is made for the name again.
export const ALIASES_KEY = 'site/reciter-aliases.json';

export async function readAliases(env) {
  if (!env?.R2) return {};
  try {
    const object = await env.R2.get(ALIASES_KEY);
    const aliases = object ? await object.json() : null;
    return aliases && typeof aliases === 'object' ? aliases : {};
  } catch {
    return {};
  }
}

/** The aliases once [fromName]'s page ([fromId]) is merged into [intoId]'s: its name goes there, and so do the names that went to it. */
export function aliasesAfterMerge(aliases, fromName, fromId, intoId) {
  const out = Object.fromEntries(Object.entries(aliases).map(([key, id]) => [key, Number(id) === Number(fromId) ? intoId : id]));
  const key = reciterKey(fromName) || String(fromName ?? '').trim();
  if (key) out[key] = intoId;
  return out;
}

async function allReciters(env, db) {
  const res = await db(env, 'reciters?select=id,name&order=id.asc');
  if (!res.ok) throw new Error(`reciters read: ${res.status}`);
  return res.json();
}

/** The oldest of [reciters] with [key] (the page kept when one has two). */
const pageOf = (reciters, key) => reciters.find((r) => r.name !== NOT_A_RECITER && (reciterKey(r.name) || r.name) === key);

/** The reciters row named [name], however written ({ id, name, created }), made when there is none; null for no reciter. */
export async function reciterPage(env, name, db = serviceDb) {
  const clean = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  if (!clean || clean === NOT_A_RECITER || clean.length > 200) return null;
  const key = reciterKey(clean) || clean;
  const reciters = await allReciters(env, db);
  const merged = (await readAliases(env))[key];
  const known = (merged && reciters.find((r) => Number(r.id) === Number(merged))) || pageOf(reciters, key);
  if (known) return { id: known.id, name: known.name, created: false };

  const made = await db(env, 'reciters', { method: 'POST', body: JSON.stringify({ name: clean }) });
  const [mine] = made.ok ? await made.json() : [];
  // Two tracks of a new reciter sent at once (written alike or not) can each
  // make a page: the first made stays, and the other is taken back before
  // anything points to it
  const first = pageOf(await allReciters(env, db), key);
  if (!first) throw new Error(`reciters write: ${made.status}`);
  if (mine && mine.id !== first.id) await db(env, `reciters?id=eq.${mine.id}`, { method: 'DELETE' });
  return { id: first.id, name: first.name, created: !!mine && mine.id === first.id };
}

/**
 * Puts [tracks] ({ id, reciter_name, reciter_id }) under their reciters' pages,
 * making the pages that are missing; a track whose reciter was written
 * otherwise takes the page's spelling. What each reciter got:
 * { id, name, created, tracks, moved } (moved: the tracks changed).
 */
export async function linkTracks(env, tracks, db = serviceDb) {
  const byKey = new Map();
  for (const t of tracks) {
    const name = (t.reciter_name ?? '').trim();
    const key = reciterKey(name) || name;
    if (!byKey.has(key)) byKey.set(key, { name, list: [] });
    byKey.get(key).list.push(t);
  }
  const out = [];
  for (const { name, list } of byKey.values()) {
    const page = await reciterPage(env, name, db);
    if (!page) continue;
    const moved = list
      .filter((t) => String(t.reciter_id ?? '') !== String(page.id) || (t.reciter_name ?? '').trim() !== page.name)
      .map((t) => t.id);
    if (moved.length) {
      const res = await db(env, `audio_library?id=in.(${moved.join(',')})`, {
        method: 'PATCH',
        body: JSON.stringify({ reciter_id: page.id, reciter_name: page.name }),
        headers: { prefer: 'return=minimal' },
      });
      if (!res.ok) throw new Error(`tracks update: ${res.status}`);
    }
    out.push({ id: page.id, name: page.name, created: page.created, tracks: list.map((t) => t.id), moved });
  }
  return out;
}
