// POST /api/upload?kind=audio|image&ext=mp3 — stores a user's upload in the
// Cloudflare R2 bucket behind soutalahzan.com (same bucket and path layout as
// the Flutter app: user_uploads/<userId>/<kind>_<timestamp>_<random>.<ext>).
//
// R2 is reached through a Pages binding named R2 (Settings → Bindings), so no
// R2 keys ever ship to the browser. The caller must send its Supabase session
// token; it is verified against Supabase before anything is written.
import { SUPABASE_URL, SUPABASE_KEY } from '../../cloudflare/seo.js';

const PUBLIC_BASE = 'https://soutalahzan.com';

const LIMITS = {
  audio: { maxBytes: 100 * 1024 * 1024, types: /^audio\//, exts: ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus', 'flac'] },
  image: { maxBytes: 10 * 1024 * 1024, types: /^image\/(jpeg|png|webp|gif)$/, exts: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

async function getUserId(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return typeof user?.id === 'string' ? user.id : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.R2) return json({ error: 'R2 binding is not configured' }, 500);

  const params = new URL(request.url).searchParams;
  const kind = params.get('kind');
  const rule = LIMITS[kind];
  if (!rule) return json({ error: 'kind must be audio or image' }, 400);

  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!rule.types.test(contentType)) return json({ error: `unsupported file type: ${contentType}` }, 415);

  const size = Number(request.headers.get('content-length'));
  if (!size) return json({ error: 'content-length required' }, 411);
  if (size > rule.maxBytes) return json({ error: 'file too large' }, 413);

  const userId = await getUserId(request);
  if (!userId) return json({ error: 'not signed in' }, 401);

  const requestedExt = (params.get('ext') || '').toLowerCase();
  const ext = rule.exts.includes(requestedExt) ? requestedExt : rule.exts[0];
  const random = crypto.randomUUID().slice(0, 12);
  const key = `user_uploads/${userId}/${kind}_${Date.now()}_${random}.${ext}`;

  await env.R2.put(key, request.body, { httpMetadata: { contentType } });

  return json({ url: `${PUBLIC_BASE}/${key}` });
}
