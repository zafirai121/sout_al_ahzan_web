// POST /api/link-reciter  { "ids": [123, ...] }  or  {}
// Puts tracks under their reciter's page (cloudflare/reciters.js): the reciter
// the library already has, or a page made for one new to it.
//   ids: those tracks (the uploader's own; the admin may give any).
//   none: every track still without a reciter page (the caller's own; the
//         admin's and the scheduled workflow's: any).
// The upload page and the desktop uploader call it for each track they add;
// .github/workflows/thumbs.yml runs it for all, for tracks added by apps
// that don't.
import { json, getCaller, db } from '../../cloudflare/server-api.js';
import { githubWorkflowCaller } from '../../cloudflare/github-oidc.js';
import { linkTracks } from '../../cloudflare/reciters.js';

const WORKFLOW = {
  audience: 'soutalahzan-thumbs',
  repository: 'zafirai121/sout_al_ahzan_web',
  workflow: '.github/workflows/thumbs.yml',
  ref: 'refs/heads/main',
};
const MAX_IDS = 200;

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const workflow = await githubWorkflowCaller(request, WORKFLOW).catch(() => false);
  const caller = workflow ? null : await getCaller(request);
  if (!workflow && !caller) return json({ error: 'not signed in' }, 401);
  if (caller?.isAnonymous) return json({ error: 'guest accounts cannot upload' }, 403);

  const body = await request.json().catch(() => ({}));
  let query;
  if (Array.isArray(body.ids) && body.ids.length) {
    const ids = [...new Set(body.ids.map(Number))].filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length || ids.length > MAX_IDS) return json({ error: 'invalid ids' }, 400);
    query = `id=in.(${ids.join(',')})`;
  } else {
    query = 'reciter_id=is.null&order=id.asc&limit=1000';
  }
  if (!workflow && !caller.isAdmin) query += `&user_id=eq.${encodeURIComponent(caller.uid)}`;

  const res = await db(env, `audio_library?select=id,reciter_name,reciter_id&${query}`);
  if (!res.ok) return json({ error: 'database read failed' }, 502);
  try {
    return json({ reciters: await linkTracks(env, await res.json()) });
  } catch (e) {
    return json({ error: 'database update failed', detail: String(e?.message ?? e) }, 502);
  }
}
