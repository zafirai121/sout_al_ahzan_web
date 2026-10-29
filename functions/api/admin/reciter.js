// POST /api/admin/reciter — the site's owner (the admin role) only:
//   { action: 'photo', id, imageUrl } → the reciter's photo (null: none); their tracks' covers stay as they are
//   { action: 'merge', from, into }   → reciter [from]'s page merged into [into]'s: its tracks (on its page, or
//                                       carrying only its name) go there under [into]'s name, its name becomes
//                                       one of [into]'s (cloudflare/reciters.js), so no page is made for it
//                                       again, and its row is removed. The row and its tracks as they were are
//                                       kept in the bucket first (backups/reciters/merge-….json)
import { json, getCaller, db, isOwnImageUrl } from '../../../cloudflare/server-api.js';
import { ALIASES_KEY, NOT_A_RECITER, aliasesAfterMerge, readAliases } from '../../../cloudflare/reciters.js';

const AS_JSON = { httpMetadata: { contentType: 'application/json; charset=utf-8' } };
const BATCH = 200;

const idOf = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

async function reciterRow(env, id) {
  const res = await db(env, `reciters?id=eq.${id}&select=id,name,image_url`);
  if (!res.ok) throw new Error('database read failed');
  const [row] = await res.json();
  return row ?? null;
}

async function photo(env, body) {
  const id = idOf(body.id);
  if (!id) return json({ error: 'invalid id' }, 400);
  if (body.imageUrl !== null && !isOwnImageUrl(body.imageUrl)) return json({ error: 'invalid image url' }, 400);
  const res = await db(env, `reciters?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ image_url: body.imageUrl }) });
  if (!res.ok) return json({ error: 'database update failed', detail: await res.text() }, 502);
  const [reciter] = await res.json();
  return reciter ? json({ reciter }) : json({ error: 'reciter not found' }, 404);
}

async function merge(env, body) {
  const from = idOf(body.from);
  const into = idOf(body.into);
  if (!from || !into || from === into) return json({ error: 'invalid reciters' }, 400);
  const [gone, kept] = await Promise.all([reciterRow(env, from), reciterRow(env, into)]);
  if (!gone || !kept) return json({ error: 'reciter not found' }, 404);
  if (gone.name === NOT_A_RECITER || kept.name === NOT_A_RECITER) return json({ error: 'invalid reciters' }, 400);

  // Its tracks: on its page, or older ones carrying only its name
  const [onPage, byName] = await Promise.all([
    db(env, `audio_library?reciter_id=eq.${from}&select=id,reciter_id,reciter_name`),
    db(env, `audio_library?reciter_id=is.null&reciter_name=eq.${encodeURIComponent(gone.name)}&select=id,reciter_id,reciter_name`),
  ]);
  if (!onPage.ok || !byName.ok) return json({ error: 'database read failed' }, 502);
  const tracks = [...(await onPage.json()), ...(await byName.json())];
  await env.R2.put(`backups/reciters/merge-${from}-into-${into}-${Date.now()}.json`, JSON.stringify({ reciter: gone, into: kept, tracks }), AS_JSON);

  // Its name first, so a track sent meanwhile goes on the page kept
  await env.R2.put(ALIASES_KEY, JSON.stringify(aliasesAfterMerge(await readAliases(env), gone.name, from, into)), AS_JSON);

  const ids = tracks.map((t) => t.id);
  for (let i = 0; i < ids.length; i += BATCH) {
    const res = await db(env, `audio_library?id=in.(${ids.slice(i, i + BATCH).join(',')})`, {
      method: 'PATCH',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ reciter_id: into, reciter_name: kept.name }),
    });
    if (!res.ok) return json({ error: 'tracks update failed', detail: await res.text() }, 502);
  }

  // Its photo goes to the page kept when that one has none
  if (gone.image_url && !kept.image_url) {
    await db(env, `reciters?id=eq.${into}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ image_url: gone.image_url }) });
  }
  const removed = await db(env, `reciters?id=eq.${from}`, { method: 'DELETE', headers: { prefer: 'return=minimal' } });
  if (!removed.ok) return json({ error: 'reciter delete failed', detail: await removed.text() }, 502);
  return json({ merged: { from, into, name: kept.name, tracks: ids.length } });
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.R2) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);
  if (!caller.isAdmin) return json({ error: 'forbidden' }, 403);

  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'photo') return await photo(env, body);
    if (body.action === 'merge') return await merge(env, body);
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 502);
  }
}
