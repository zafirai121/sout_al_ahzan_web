// A track's reciter page: the reciters table's row of its name, made when the
// library has none yet, so every track shows under its reciter on the site
// (/reciter?id= lists the tracks whose reciter_id is that row's) and a reciter
// new to the library gets a page of their own. The database links a new
// track to a reciter it already has; it makes no page for a new one.
import { db as serviceDb } from './server-api.js';

export const NOT_A_RECITER = 'مجهول';

/** The reciters row named [name] ({ id, name, created }), made when there is none; null for no reciter. */
export async function reciterPage(env, name, db = serviceDb) {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean || clean === NOT_A_RECITER || clean.length > 200) return null;
  const find = async () => {
    const res = await db(env, `reciters?select=id,name&name=eq.${encodeURIComponent(clean)}&order=id.asc`);
    if (!res.ok) throw new Error(`reciters read: ${res.status}`);
    return res.json();
  };
  const [known] = await find();
  if (known) return { id: known.id, name: known.name, created: false };

  const made = await db(env, 'reciters', { method: 'POST', body: JSON.stringify({ name: clean }) });
  const [mine] = made.ok ? await made.json() : [];
  // Two tracks of a new reciter sent at once can each make a page: the first
  // made stays, and the other is taken back before anything points to it
  const [first] = await find();
  if (!first) throw new Error(`reciters write: ${made.status}`);
  if (mine && mine.id !== first.id) await db(env, `reciters?id=eq.${mine.id}`, { method: 'DELETE' });
  return { id: first.id, name: first.name, created: !!mine && mine.id === first.id };
}

/**
 * Puts [tracks] ({ id, reciter_name, reciter_id }) under their reciters' pages,
 * making the pages that are missing. What each reciter got:
 * { id, name, created, tracks, moved } (moved: the tracks that were not on it).
 */
export async function linkTracks(env, tracks, db = serviceDb) {
  const byName = new Map();
  for (const t of tracks) {
    const name = (t.reciter_name ?? '').trim();
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(t);
  }
  const out = [];
  for (const [name, list] of byName) {
    const page = await reciterPage(env, name, db);
    if (!page) continue;
    const moved = list.filter((t) => String(t.reciter_id ?? '') !== String(page.id)).map((t) => t.id);
    if (moved.length) {
      const res = await db(env, `audio_library?id=in.(${moved.join(',')})`, {
        method: 'PATCH',
        body: JSON.stringify({ reciter_id: page.id }),
        headers: { prefer: 'return=minimal' },
      });
      if (!res.ok) throw new Error(`tracks update: ${res.status}`);
    }
    out.push({ id: page.id, name: page.name, created: page.created, tracks: list.map((t) => t.id), moved });
  }
  return out;
}
