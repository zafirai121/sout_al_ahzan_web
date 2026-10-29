// GET  /api/releases → the owner's choices for the releases: { covers, hidden, open }
//                      (cloudflare/release-settings.js), as kept in the bucket
// POST /api/releases → one change, by the site's owner (the admin role) only; the settings after it:
//   { action: 'rename', reciterId, ids, from, to } → a release's tracks (500 at most) given its new name;
//                                                    its cover and «جديد» card follow it
//   { action: 'move', reciterId, ids, album }      → tracks put in a release, or out of any (album null)
//   { action: 'cover' | 'hide' | 'open', … }       → see applyChange
// Before tracks change release, their releases as they were are kept in the
// bucket (backups/albums/owner-….json).
import { json, getCaller, db } from '../../cloudflare/server-api.js';
import { applyChange, cleanSettings, releaseName } from '../../cloudflare/release-settings.js';

const KEY = 'site/releases.json';
const MAX_IDS = 500;
const AS_JSON = { httpMetadata: { contentType: 'application/json; charset=utf-8' } };

async function readSettings(env) {
  const object = await env.R2.get(KEY);
  return cleanSettings(object ? await object.json().catch(() => null) : null);
}

const idsOf = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS) return null;
  const out = ids.map(Number);
  return out.every(id => Number.isInteger(id) && id > 0) ? [...new Set(out)] : null;
};

export async function onRequestGet({ env }) {
  const res = json(env.R2 ? await readSettings(env) : cleanSettings(null));
  res.headers.set('cache-control', 'no-store');
  return res;
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.R2) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);
  if (!caller.isAdmin) return json({ error: 'forbidden' }, 403);

  const change = await request.json().catch(() => null);
  if (!change || typeof change !== 'object') return json({ error: 'invalid change' }, 400);
  const settings = await readSettings(env);

  // The tracks' release changes: checked, kept as they were, then changed
  if (change.action === 'rename' || change.action === 'move') {
    const ids = idsOf(change.ids);
    if (!ids) return json({ error: 'invalid ids' }, 400);
    const album = change.action === 'rename' ? releaseName(change.to) : change.album === null ? null : releaseName(change.album);
    // Only a move may take tracks out of any release
    const outOfAny = change.action === 'move' && change.album === null;
    if (album === null && !outOfAny) return json({ error: 'invalid name' }, 400);
    const next = change.action === 'rename' ? applyChange(settings, change) : settings;
    if (!next) return json({ error: 'invalid change' }, 400);

    const tracks = `audio_library?id=in.(${ids.join(',')})`;
    const before = await db(env, `${tracks}&select=id,album`);
    if (!before.ok) return json({ error: 'database read failed' }, 502);
    await env.R2.put(`backups/albums/owner-${Date.now()}.json`, JSON.stringify(await before.json()), AS_JSON);

    const res = await db(env, tracks, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ album }) });
    if (!res.ok) return json({ error: 'database update failed', detail: await res.text() }, 502);
    if (next !== settings) await env.R2.put(KEY, JSON.stringify(next), AS_JSON);
    return json({ settings: next });
  }

  const next = applyChange(settings, change);
  if (!next) return json({ error: 'invalid change' }, 400);
  await env.R2.put(KEY, JSON.stringify(next), AS_JSON);
  return json({ settings: next });
}
