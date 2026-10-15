// Library upkeep by this repository's own workflow (.github/workflows/library.yml,
// run on main), proving who it is with GitHub's OpenID Connect token (see
// cloudflare/github-oidc.js): adding tracks whose files are already in the
// bucket, removing tracks whose file is gone, and deleting uploads that never
// became a track. Whatever the workflow asks, each action checks here what
// makes it safe:
//
// POST { action: 'list', cursor }          → a page of the bucket: [[key, size, uploaded, etag, type]]
// POST { action: 'rows', table, from }     → a page of a table as the service role reads it
// POST { action: 'insert', rows }          → new audio_library rows (20 at most), each file and cover in the bucket
// POST { action: 'delete-tracks', ids }    → audio_library rows (20 at most) whose file is missing from the bucket
// POST { action: 'delete-uploads', keys }  → objects under user_uploads/ (12 at most) older than two days that no
//                                            track or profile points to, with their small copies
import { json, db } from '../../../cloudflare/server-api.js';
import { githubWorkflowCaller } from '../../../cloudflare/github-oidc.js';

const WORKFLOW = {
  audience: 'soutalahzan-library',
  repository: 'zafirai121/sout_al_ahzan_web',
  workflow: '.github/workflows/library.yml',
  ref: 'refs/heads/main',
};
const OWN = 'https://soutalahzan.com/';
const TABLES = ['audio_library', 'reciters', 'profiles', 'user_playlists'];
const FIELDS = ['title', 'file_name', 'reciter_name', 'reciter_id', 'image_url', 'file_url', 'category', 'duration', 'user_id'];
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

// The bucket key a link of ours points to (links may be stored encoded or not)
function keyOf(link) {
  if (typeof link !== 'string' || !link.startsWith(OWN)) return null;
  try { return decodeURIComponent(new URL(link).pathname.slice(1)) || null; } catch { return null; }
}

const pointedTo = async (env, column, url) => {
  const res = await db(env, `audio_library?select=id&${column}=eq.${encodeURIComponent(url)}&limit=1`);
  if (!res.ok) throw new Error(`audio_library: ${res.status}`);
  return (await res.json()).length > 0;
};

export async function onRequestPost({ request, env }) {
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
    const res = await db(env, 'audio_library?select=id,title', { method: 'POST', body: JSON.stringify(clean) });
    if (!res.ok) return json({ error: 'insert failed', detail: await res.text() }, 502);
    return json({ inserted: await res.json() });
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

  return json({ error: 'unknown action' }, 400);
}
