// Library upkeep by this repository's own workflow (.github/workflows/library.yml,
// run on main), proving who it is with GitHub's OpenID Connect token (see
// cloudflare/github-oidc.js): adding tracks whose files are already in the
// bucket, removing tracks whose file is gone, and deleting uploads that never
// became a track. Whatever the workflow asks, each action checks here what
// makes it safe:
//
// POST { action: 'list', cursor }          → a page of the bucket: [[key, size, uploaded, etag, type]]
// POST { action: 'rows', table, from }     → a page of a table as the service role reads it
// POST { action: 'insert', rows }          → new audio_library rows (20 at most), each file and cover in the bucket;
//                                            a row whose file a track already has is not added again
// POST { action: 'delete-tracks', ids }    → audio_library rows (20 at most) whose file is missing from the bucket
// POST { action: 'delete-uploads', keys }  → objects under user_uploads/ (12 at most) older than two days that no
//                                            track or profile points to, with their small copies
// POST { action: 'retitle', changes }      → new titles for audio_library rows (20 at most)
// POST { action: 'reciter', ids, reciter | like } → audio_library rows (20 at most) given the name and id of a
//                                            row of the reciters table, or of the track like; the rows as
//                                            they were kept in the bucket (backups/reciters/) first
// POST { action: 'recategorize', changes } → new categories for audio_library rows (100 at most), each one of the
//                                            apps' codes; the categories as they were kept in the bucket
//                                            (backups/categories/) first
// POST { action: 'album', changes }        → the album of audio_library rows (100 at most): { id, album } with
//                                            the album's name, or null for none; the albums as they were kept
//                                            in the bucket (backups/albums/) first
// POST { action: 'remove', items }         → audio_library rows (2 at most), each either a copy of another track
//                                            ({ id, keep }: same reciter; its likes, playlists and listens go to
//                                            the one kept) or a clip ({ id }: shorter than a minute); their file
//                                            and cover deleted when no other track uses them; the rows kept in
//                                            the bucket (backups/removed-tracks/) first
// POST { action: 'playlist', id, tracks }  → a playlist's tracks (after a removal)
// POST { action: 'backup', key }           → a row kept in the bucket before a change (backups/…json)
import { json, db } from '../../../cloudflare/server-api.js';
import { githubWorkflowCaller } from '../../../cloudflare/github-oidc.js';

const WORKFLOW = {
  audience: 'soutalahzan-library',
  repository: 'zafirai121/sout_al_ahzan_web',
  workflow: '.github/workflows/library.yml',
  ref: 'refs/heads/main',
};
const OWN = 'https://soutalahzan.com/';
const TABLES = ['audio_library', 'reciters', 'profiles', 'user_playlists', 'favorites'];
// The categories' codes, as the apps write and read them
const CATEGORIES = ['hussainiya_poems', 'naei', 'muwalid', 'dua', 'ziyarat', 'quran', 'nasheed', 'lectures', 'variety'];
const SHORT = 60; // seconds: a track shorter than this may be removed as a clip
const FIELDS = ['title', 'file_name', 'reciter_name', 'reciter_id', 'image_url', 'file_url', 'category', 'duration', 'user_id'];
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

// A track's length in seconds ("m:ss", "h:mm:ss" or a number)
function secondsOf(d) {
  if (d == null || d === '') return null;
  if (typeof d === 'number') return d;
  const parts = String(d).split(':').map(Number);
  return parts.some(Number.isNaN) ? null : parts.reduce((s, p) => s * 60 + p, 0);
}

// The bucket key a link of ours points to (links may be stored encoded or not)
// The bucket's files are linked through the site, its www name, or the bucket's own public address
const HOSTS = ['soutalahzan.com', 'www.soutalahzan.com', 'pub-8168942d67ae4c1fb48c404f11458b4a.r2.dev'];
function keyOf(link) {
  if (typeof link !== 'string') return null;
  try {
    const url = new URL(link);
    if (!HOSTS.includes(url.hostname)) return null;
    return decodeURIComponent(url.pathname.slice(1)) || null;
  } catch { return null; }
}
}

// Whether any track (its file or cover) or reciter's picture points to this key, however the link is written
async function usedElsewhere(env, key, ...links) {
  // The key as each host links it, as is and encoded (a track may link the bucket's public address)
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const variants = [...new Set([...HOSTS.flatMap((h) => [`https://${h}/${key}`, `https://${h}/${encoded}`]), ...links.filter(Boolean)])];
  const list = variants.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',');
  const inTracks = await db(env, `audio_library?select=id&or=${encodeURIComponent(`(file_url.in.(${list}),image_url.in.(${list}))`)}&limit=1`);
  const inReciters = await db(env, `reciters?select=id&image_url=in.${encodeURIComponent(`(${list})`)}&limit=1`);
  if (!inTracks.ok || !inReciters.ok) return true; // when unsure, kept
  return (await inTracks.json()).length > 0 || (await inReciters.json()).length > 0;
}

const pointedTo = async (env, column, url) => {
  const res = await db(env, `audio_library?select=id&${column}=eq.${encodeURIComponent(url)}&limit=1`);
  if (!res.ok) throw new Error(`audio_library: ${res.status}`);
  return (await res.json()).length > 0;
};

export async function onRequestPost(context) {
  // An exception said in the answer (Cloudflare would show only its own error page)
  try {
    return await handle(context);
  } catch (e) {
    return json({ error: 'exception', detail: String(e?.stack || e).slice(0, 1500) }, 500);
  }
}

async function handle({ request, env }) {
  if (!env.R2 || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);
  if (!(await githubWorkflowCaller(request, WORKFLOW))) return json({ error: 'forbidden' }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'invalid body' }, 400);

  if (body.action === 'list') {
    const page = await env.R2.list({ cursor: body.cursor || undefined, limit: 1000, include: ['httpMetadata'] });
    return json({
      objects: page.objects.map((o) => [o.key, o.size, o.uploaded.toISOString(), o.etag, o.httpMetadata?.contentType || '']),
      cursor: page.truncated ? page.cursor : null,
    });
  }

  if (body.action === 'rows') {
    if (!TABLES.includes(body.table)) return json({ error: 'invalid table' }, 400);
    const from = Math.max(0, Number(body.from) || 0);
    const res = await db(env, `${body.table}?select=*&order=id.asc`, { headers: { range: `${from}-${from + 999}` } });
    // Passed on as it comes (no parsing here: the workflow reads it)
    return new Response(await res.text(), { status: res.ok ? 200 : 502, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  if (body.action === 'insert') {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length || rows.length > 20) return json({ error: '1 to 20 rows' }, 400);
    const clean = [];
    for (const row of rows) {
      const r = {};
      for (const f of FIELDS) if (row[f] !== undefined) r[f] = row[f];
      if (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 300) return json({ error: 'invalid title', row }, 400);
      const file = keyOf(r.file_url);
      if (!file || !(await env.R2.head(file))) return json({ error: 'file not in the bucket', row }, 400);
      if (r.image_url != null) {
        const cover = keyOf(r.image_url);
        if (!cover || !(await env.R2.head(cover))) return json({ error: 'cover not in the bucket', row }, 400);
      }
      clean.push(r);
    }
    // Already added (a call that timed out after the insert, then sent again): not twice
    const list = clean.map((r) => `"${r.file_url}"`).join(',');
    const have = await db(env, `audio_library?select=id,title,file_url&file_url=in.(${encodeURIComponent(list)})`);
    if (!have.ok) return json({ error: 'read failed', detail: await have.text() }, 502);
    const there = await have.json();
    const fresh = clean.filter((r) => !there.some((t) => t.file_url === r.file_url));
    if (!fresh.length) return json({ inserted: [], already: there.map(({ id, title }) => ({ id, title })) });
    const res = await db(env, 'audio_library?select=id,title', { method: 'POST', body: JSON.stringify(fresh) });
    if (!res.ok) return json({ error: 'insert failed', detail: await res.text() }, 502);
    return json({ inserted: await res.json(), already: there.map(({ id, title }) => ({ id, title })) });
  }

  if (body.action === 'delete-tracks') {
    const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length || ids.length > 20) return json({ error: '1 to 20 ids' }, 400);
    const res = await db(env, `audio_library?select=id,file_url&id=in.(${ids.join(',')})`);
    if (!res.ok) return json({ error: 'read failed', detail: await res.text() }, 502);
    const gone = [];
    const kept = [];
    for (const row of await res.json()) {
      const key = keyOf(row.file_url);
      // Only a track whose file was in our bucket and is no longer there
      if (key && !(await env.R2.head(key))) gone.push(row.id); else kept.push(row.id);
    }
    if (gone.length) {
      const del = await db(env, `audio_library?id=in.(${gone.join(',')})`, { method: 'DELETE' });
      if (!del.ok) return json({ error: 'delete failed', detail: await del.text() }, 502);
    }
    return json({ deleted: gone, kept });
  }

  if (body.action === 'delete-uploads') {
    const keys = Array.isArray(body.keys) ? body.keys : [];
    if (!keys.length || keys.length > 12) return json({ error: '1 to 12 keys' }, 400);
    const remove = [];
    const kept = [];
    for (const key of keys) {
      if (typeof key !== 'string' || !key.startsWith('user_uploads/') || key.includes('..')) { kept.push([key, 'not an upload']); continue; }
      const head = await env.R2.head(key);
      if (!head) { kept.push([key, 'not found']); continue; }
      if (Date.now() - head.uploaded.getTime() < TWO_DAYS) { kept.push([key, 'too recent']); continue; }
      const url = `${OWN}${key}`;
      if ((await pointedTo(env, 'file_url', url)) || (await pointedTo(env, 'image_url', url))) { kept.push([key, 'a track uses it']); continue; }
      if (/\/image_/.test(key)) {
        const res = await db(env, `profiles?select=id&avatar_url=eq.${encodeURIComponent(url)}&limit=1`);
        if (!res.ok || (await res.json()).length) { kept.push([key, 'a profile may use it']); continue; }
      }
      remove.push(key);
    }
    if (remove.length) await env.R2.delete([...remove, ...remove.map((k) => `thumbs/640/${k}`)]);
    return json({ deleted: remove, kept });
  }

  if (body.action === 'reciter') {
    // Tracks credited to a reciter under another name: given the name (and id) of a row of
    // the reciters table (reciter), or else of one of the library's tracks (like)
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length || ids.length > 20 || ids.some((n) => !Number.isInteger(n)) || !(Number.isInteger(body.like) || body.reciter != null)) {
      return json({ error: '1 to 20 ids, and a reciter or a track like them' }, 400);
    }
    let to;
    if (body.reciter != null) {
      const r = await db(env, `reciters?select=id,name&id=eq.${encodeURIComponent(body.reciter)}`);
      if (!r.ok) return json({ error: 'read failed', detail: await r.text() }, 502);
      const row = (await r.json())[0];
      if (!row || !row.name) return json({ error: 'no such reciter' }, 400);
      to = { reciter_name: row.name, reciter_id: row.id };
    }
    const read = await db(env, `audio_library?select=id,reciter_name,reciter_id&id=in.(${[...ids, ...(to ? [] : [body.like])].join(',')})`);
    if (!read.ok) return json({ error: 'read failed', detail: await read.text() }, 502);
    const rows = await read.json();
    if (!to) {
      const like = rows.find((r) => r.id === body.like);
      if (!like || !like.reciter_name) return json({ error: 'the track like them is not there' }, 400);
      to = { reciter_name: like.reciter_name, reciter_id: like.reciter_id };
    }
    const was = rows.filter((r) => ids.includes(r.id));
    await env.R2.put(`backups/reciters/${new Date().toISOString().slice(0, 10)}/${ids[0]}-${ids.length}.json`,
      JSON.stringify(was), { httpMetadata: { contentType: 'application/json' } });
    const res = await db(env, `audio_library?id=in.(${ids.join(',')})`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify(to) });
    if (!res.ok) return json({ error: 'update failed', detail: await res.text() }, 502);
    return json({ moved: was.map((r) => r.id), reciter: to.reciter_name });
  }

  if (body.action === 'retitle') {
    const changes = Array.isArray(body.changes) ? body.changes : [];
    if (!changes.length || changes.length > 20) return json({ error: '1 to 20 changes' }, 400);
    const done = [];
    for (const { id, title } of changes) {
      if (!Number.isInteger(id) || typeof title !== 'string' || !title.trim() || title.length > 300) return json({ error: 'invalid change', id }, 400);
      const res = await db(env, `audio_library?id=eq.${id}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ title: title.trim() }) });
      if (!res.ok) return json({ error: 'update failed', id, detail: await res.text() }, 502);
      done.push(id);
    }
    return json({ retitled: done });
  }

  if (body.action === 'recategorize') {
    const changes = Array.isArray(body.changes) ? body.changes : [];
    if (!changes.length || changes.length > 100) return json({ error: '1 to 100 changes' }, 400);
    if (changes.some(({ id, category }) => !Number.isInteger(id) || !CATEGORIES.includes(category))) return json({ error: 'invalid change' }, 400);
    // The categories as they were, kept in the bucket first
    const ids = changes.map((c) => c.id);
    const read = await db(env, `audio_library?select=id,category&id=in.(${ids.join(',')})`);
    if (!read.ok) return json({ error: 'read failed', detail: await read.text() }, 502);
    const was = await read.json();
    await env.R2.put(`backups/categories/${new Date().toISOString().slice(0, 10)}/${ids[0]}-${ids.length}.json`,
      JSON.stringify(was), { httpMetadata: { contentType: 'application/json' } });
    // One update for each category
    const byCategory = new Map();
    for (const { id, category } of changes) byCategory.set(category, [...(byCategory.get(category) || []), id]);
    for (const [category, list] of byCategory) {
      const res = await db(env, `audio_library?id=in.(${list.join(',')})`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ category }) });
      if (!res.ok) return json({ error: 'update failed', category, detail: await res.text() }, 502);
    }
    return json({ recategorized: was.map((r) => r.id) });
  }

  if (body.action === 'album') {
    const changes = Array.isArray(body.changes) ? body.changes : [];
    if (!changes.length || changes.length > 100) return json({ error: '1 to 100 changes' }, 400);
    const valid = ({ id, album }) => Number.isInteger(id) && (album === null || (typeof album === 'string' && album.trim() && album.length <= 150));
    if (!changes.every(valid)) return json({ error: 'invalid change' }, 400);
    // The albums as they were, kept in the bucket first
    const ids = changes.map((c) => c.id);
    const read = await db(env, `audio_library?select=id,album&id=in.(${ids.join(',')})`);
    if (!read.ok) return json({ error: 'read failed', detail: await read.text() }, 502);
    const was = await read.json();
    await env.R2.put(`backups/albums/${new Date().toISOString().slice(0, 10)}/${ids[0]}-${ids.length}.json`,
      JSON.stringify(was), { httpMetadata: { contentType: 'application/json' } });
    // One update for each album
    const byAlbum = new Map();
    for (const { id, album } of changes) {
      const name = album === null ? null : album.trim();
      byAlbum.set(name, [...(byAlbum.get(name) || []), id]);
    }
    for (const [album, list] of byAlbum) {
      const res = await db(env, `audio_library?id=in.(${list.join(',')})`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ album }) });
      if (!res.ok) return json({ error: 'update failed', album, detail: await res.text() }, 502);
    }
    return json({ albums: was.map((r) => r.id) });
  }

  if (body.action === 'remove') {
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length || items.length > 2) return json({ error: '1 or 2 items' }, 400);
    const ids = [...new Set(items.flatMap((x) => [x.id, x.keep]).filter((n) => Number.isInteger(n) && n > 0))];
    const read = await db(env, `audio_library?select=*&id=in.(${ids.join(',')})`);
    if (!read.ok) return json({ error: 'read failed', detail: await read.text() }, 502);
    const byId = new Map((await read.json()).map((r) => [r.id, r]));
    const removed = [];
    const refused = [];
    for (const { id, keep } of items) {
      const row = byId.get(id);
      if (!row) { refused.push([id, 'not found']); continue; }
      if (keep != null) {
        const kept = byId.get(keep);
        if (!kept || keep === id) { refused.push([id, 'the track to keep is not there']); continue; }
        if ((kept.reciter_name || '') !== (row.reciter_name || '')) { refused.push([id, 'not the same reciter']); continue; }
      } else if (!(secondsOf(row.duration) < SHORT)) {
        refused.push([id, 'not a short clip']);
        continue;
      }
      // The row as it was, kept in the bucket first
      await env.R2.put(`backups/removed-tracks/${new Date().toISOString().slice(0, 10)}/${id}.json`,
        JSON.stringify({ removed: row, keptInstead: keep ?? null, at: new Date().toISOString() }), { httpMetadata: { contentType: 'application/json' } });
      // Likes: to the one kept (each listener once), else gone
      const likes = await db(env, `favorites?select=user_id&poem_id=eq.cloud_${id}`);
      const likers = likes.ok ? (await likes.json()).map((l) => l.user_id) : [];
      if (keep != null && likers.length) {
        const add = await db(env, 'favorites?on_conflict=user_id,poem_id', {
          method: 'POST',
          headers: { prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(likers.map((u) => ({ user_id: u, poem_id: `cloud_${keep}` }))),
        });
        if (!add.ok) { refused.push([id, `likes not moved: ${await add.text()}`]); continue; }
      }
      if (likers.length) await db(env, `favorites?poem_id=eq.cloud_${id}`, { method: 'DELETE' });
      // Its listens counted for the one kept
      if (keep != null && row.listen_count) {
        const kept = byId.get(keep);
        kept.listen_count = (kept.listen_count || 0) + row.listen_count;
        await db(env, `audio_library?id=eq.${keep}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ listen_count: kept.listen_count }) });
      }
      const del = await db(env, `audio_library?id=eq.${id}`, { method: 'DELETE' });
      if (!del.ok) { refused.push([id, `delete failed: ${await del.text()}`]); continue; }
      // Its file and cover, when no other track uses them
      const files = [];
      for (const link of [row.file_url, row.image_url]) {
        const key = keyOf(link);
        if (!key || key.startsWith('thumbs/') || key.startsWith('backups/')) continue;
        if (await usedElsewhere(env, key, link)) continue;
        files.push(key, `thumbs/640/${key}`);
      }
      if (files.length) await env.R2.delete(files);
      removed.push({ id, keep: keep ?? null, likes: likers.length, files: files.filter((k) => !k.startsWith('thumbs/')).length });
    }
    return json({ removed, refused });
  }

  if (body.action === 'backup') {
    // A row kept before it was changed or removed (backups/…json), to read it back
    const key = typeof body.key === 'string' ? body.key : '';
    if (!key.startsWith('backups/') || !key.endsWith('.json') || key.includes('..')) return json({ error: 'a backups/…json key' }, 400);
    const o = await env.R2.get(key);
    if (!o) return json({ error: 'not found', key }, 404);
    return new Response(await o.text(), { headers: { 'content-type': 'application/json' } });
  }

  if (body.action === 'playlist') {
    const tracks = Array.isArray(body.tracks) ? body.tracks : null;
    if (typeof body.id !== 'string' && !Number.isInteger(body.id)) return json({ error: 'invalid id' }, 400);
    if (!tracks || tracks.some((t) => !((typeof t === 'string' && t.length <= 60) || Number.isInteger(t)))) return json({ error: 'invalid tracks' }, 400);
    const res = await db(env, `user_playlists?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ tracks }) });
    if (!res.ok) return json({ error: 'update failed', detail: await res.text() }, 502);
    return json({ ok: true });
  }

  return json({ error: 'unknown action' }, 400);
}
