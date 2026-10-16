// The apps' feedback card (the end of their home screen): a listener rates the
// app (1–5 stars), picks what they liked (or what should be better), writes a
// word if they like, and can like the app.
//   GET  /api/feedback → { ratings, average, stars: [1★..5★], likes }  (public)
//   POST /api/feedback { device, stars, liked, tags, comment, platform, version }
//        → the same numbers. One record per device (the app's own random id,
//        nothing about the listener), a later one replacing it.
//   POST /api/feedback { action: 'list' } with the site's admin session
//        → { summary, records } (the newest first), for the owner to read.
// The records are one object in R2 under a key made from the service key (the
// bucket is public to whoever knows a key); the numbers are an object of their own.
import { json, getCaller } from '../../cloudflare/server-api.js';

const TAGS = ['sound', 'library', 'easy', 'design', 'speed', 'offline'];
const SUMMARY = 'feedback/summary.json';
const MAX_RECORDS = 50000;

async function recordsKey(env) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`feedback:${env.SUPABASE_SERVICE_ROLE_KEY}`));
  return `feedback/${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40)}.json`;
}

function summarize(records) {
  const stars = [0, 0, 0, 0, 0];
  let likes = 0;
  for (const r of Object.values(records)) {
    if (r.stars) stars[r.stars - 1]++;
    if (r.liked) likes++;
  }
  const ratings = stars.reduce((a, n) => a + n, 0);
  const sum = stars.reduce((a, n, i) => a + n * (i + 1), 0);
  return { ratings, average: ratings ? Math.round((sum / ratings) * 10) / 10 : 0, stars, likes };
}

const numbers = (summary) =>
  new Response(JSON.stringify(summary), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=120' },
  });

export async function onRequestGet({ env }) {
  const obj = env.R2 ? await env.R2.get(SUMMARY) : null;
  return numbers(obj ? await obj.json() : summarize({}));
}

export async function onRequestPost({ request, env }) {
  if (!env.R2 || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'invalid body' }, 400);
  const key = await recordsKey(env);

  if (body.action === 'list') {
    const caller = await getCaller(request);
    if (!caller?.isAdmin) return json({ error: 'forbidden' }, 403);
    const obj = await env.R2.get(key);
    const records = obj ? await obj.json() : {};
    const list = Object.entries(records).map(([device, r]) => ({ device, ...r })).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    return json({ summary: summarize(records), records: list });
  }

  const { device, stars = 0, liked = false, tags = [], comment = '', platform = '', version = '' } = body;
  if (typeof device !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(device)) return json({ error: 'invalid device' }, 400);
  if (!Number.isInteger(stars) || stars < 0 || stars > 5) return json({ error: 'invalid stars' }, 400);
  if (typeof liked !== 'boolean') return json({ error: 'invalid liked' }, 400);
  if (!Array.isArray(tags) || tags.length > TAGS.length || tags.some((t) => !TAGS.includes(t))) return json({ error: 'invalid tags' }, 400);
  if (typeof comment !== 'string' || comment.length > 1000) return json({ error: 'invalid comment' }, 400);
  if (typeof platform !== 'string' || !/^[a-z-]{0,20}$/.test(platform)) return json({ error: 'invalid platform' }, 400);
  if (typeof version !== 'string' || version.length > 20) return json({ error: 'invalid version' }, 400);

  // Read, change, write only if nobody wrote in between (else again)
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const obj = await env.R2.get(key);
    const records = obj ? await obj.json() : {};
    const before = records[device];
    if (!before && Object.keys(records).length >= MAX_RECORDS) return json({ error: 'full' }, 503);
    const text = comment.trim();
    if (!stars && !liked && !text) delete records[device];
    else records[device] = { stars, liked, tags: [...new Set(tags)], comment: text, platform, version, created: before?.created || now, updated: now };
    const put = await env.R2.put(key, JSON.stringify(records), {
      httpMetadata: { contentType: 'application/json', cacheControl: 'private, no-store' },
      ...(obj ? { onlyIf: { etagMatches: obj.etag } } : {}),
    });
    if (!put) continue;
    const summary = summarize(records);
    await env.R2.put(SUMMARY, JSON.stringify(summary), { httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=120' } });
    return numbers(summary);
  }
  return json({ error: 'busy, try again' }, 503);
}
