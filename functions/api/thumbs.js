// Small copies of the covers: thumbs/640/<the cover's key> in the R2 bucket
// behind soutalahzan.com, a WebP whose shorter side is 640 px (or the cover's
// own size when smaller). The website and the apps show it wherever a cover
// is drawn up to 640 real pixels wide (cards, lists, the mini player) and the
// cover itself above that; a cover without one yet is shown as stored.
//
// Who may write them: this repository's own workflow (.github/workflows/
// thumbs.yml, run on main), for any cover, proving who it is with GitHub's
// OpenID Connect token (see cloudflare/github-oidc.js); and the signed-in
// person who has just uploaded a cover, for theirs only (user_uploads/<their
// id>/), so the copy is there before anyone sees the track. Only the workflow
// may list them.
//
// GET  /api/thumbs?cursor=…           → { keys: [cover keys that have one], cursor }
// POST /api/thumbs?for=<cover URL>    body: the WebP (or JPEG) → { key }
import { json, getCaller } from '../../cloudflare/server-api.js';
import { githubWorkflowCaller } from '../../cloudflare/github-oidc.js';

const OWN = 'https://soutalahzan.com/';
const PREFIX = 'thumbs/640/';
const MAX_BYTES = 1024 * 1024;
const WORKFLOW = {
  audience: 'soutalahzan-thumbs',
  repository: 'zafirai121/sout_al_ahzan_web',
  workflow: '.github/workflows/thumbs.yml',
  ref: 'refs/heads/main',
};

export async function onRequestGet({ request, env }) {
  if (!env.R2) return json({ error: 'R2 binding is not configured' }, 500);
  if (!(await githubWorkflowCaller(request, WORKFLOW))) return json({ error: 'forbidden' }, 403);
  const cursor = new URL(request.url).searchParams.get('cursor') || undefined;
  const page = await env.R2.list({ prefix: PREFIX, cursor, limit: 1000 });
  return json({ keys: page.objects.map((o) => o.key.slice(PREFIX.length)), cursor: page.truncated ? page.cursor : null });
}

const TYPES = {
  'image/webp': (b) => tag(b, 0) === 'RIFF' && tag(b, 8) === 'WEBP',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};
const tag = (bytes, from) => String.fromCharCode(...bytes.slice(from, from + 4));

async function mayStore(request, key) {
  if (await githubWorkflowCaller(request, WORKFLOW)) return true;
  const caller = await getCaller(request).catch(() => null);
  return !!caller && !caller.isAnonymous && key.startsWith(`user_uploads/${caller.uid}/`);
}

export async function onRequestPost({ request, env }) {
  if (!env.R2) return json({ error: 'R2 binding is not configured' }, 500);

  // The cover it is the small copy of: one of ours, stored in the bucket
  const forUrl = new URL(request.url).searchParams.get('for') || '';
  if (!forUrl.startsWith(OWN)) return json({ error: 'not one of our covers' }, 400);
  let key;
  try {
    key = decodeURIComponent(new URL(forUrl).pathname.slice(1));
  } catch {
    return json({ error: 'invalid cover url' }, 400);
  }
  if (!key || key.startsWith(PREFIX) || key.startsWith('cdn-cgi/')) return json({ error: 'invalid cover url' }, 400);
  if (!(await mayStore(request, key))) return json({ error: 'forbidden' }, 403);
  const cover = await env.R2.head(key);
  if (!cover) return json({ error: 'cover not found' }, 404);

  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!TYPES[type]) return json({ error: 'a WebP or JPEG image is expected' }, 415);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return json({ error: 'invalid size' }, 413);
  if (!TYPES[type](bytes)) return json({ error: 'not the image it says' }, 415);

  await env.R2.put(PREFIX + key, bytes, {
    httpMetadata: { contentType: type, cacheControl: 'public, max-age=2592000' },
    customMetadata: { cover: cover.etag },
  });
  return json({ key: PREFIX + key });
}
