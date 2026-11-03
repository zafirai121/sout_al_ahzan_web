// POST /api/admin/copy  { "id": 11784, "keep": 20471 } — the site's owner (the
// admin role) only: track [id] is the same recording as [keep] uploaded again,
// so it goes; its likes, listens and places in playlists go to [keep], and its
// file and cover when no other track uses them (cloudflare/copies.js). The row
// is kept in the bucket first (backups/removed-tracks/).
import { json, getCaller, db } from '../../../cloudflare/server-api.js';
import { movePlaylists, removeTrack } from '../../../cloudflare/copies.js';

const idOf = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.R2) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);
  if (!caller.isAdmin) return json({ error: 'forbidden' }, 403);

  const body = await request.json().catch(() => ({}));
  const id = idOf(body.id);
  const keep = idOf(body.keep);
  if (!id || !keep || id === keep) return json({ error: 'invalid tracks' }, 400);

  try {
    const read = await db(env, `audio_library?select=*&id=in.(${id},${keep})`);
    if (!read.ok) return json({ error: 'database read failed' }, 502);
    const rows = new Map((await read.json()).map((r) => [r.id, r]));
    const row = rows.get(id);
    const kept = rows.get(keep);
    if (!row || !kept) return json({ error: 'track not found' }, 404);
    // One reciter's: a copy is never another reciter's recording
    const sameReciter = row.reciter_id != null && kept.reciter_id != null
      ? row.reciter_id === kept.reciter_id
      : (row.reciter_name || '').trim() === (kept.reciter_name || '').trim();
    if (!sameReciter) return json({ error: 'not the same reciter' }, 400);

    const done = await removeTrack(env, row, kept);
    if (done.refused) return json({ error: done.refused }, 502);
    const playlists = await movePlaylists(env, id, keep);
    return json({ removed: id, kept: keep, likes: done.likes, files: done.files, playlists });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 502);
  }
}
