// POST /api/admin/delete-track  { "id": 123 }
// Deletes a track row and its uploaded files. Replaces the old Supabase RPC
// delete_audio_track_admin, whose "secret" was shipped inside the app.
//
// Only the admin account may call it: the caller sends its Firebase ID token,
// which is verified cryptographically, and its verified email must match.
// Needs a Pages secret SUPABASE_SERVICE_ROLE_KEY (Settings → Variables and
// Secrets) — it never leaves the server.
import { SUPABASE_URL } from '../../../cloudflare/seo.js';
import { isFirebaseToken, verifyFirebaseClaims } from '../../../cloudflare/firebase-auth.js';

const ADMIN_EMAILS = ['zafir.4k@gmail.com'];
const R2_PUBLIC_PREFIX = 'https://soutalahzan.com/';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const claims = isFirebaseToken(token) ? await verifyFirebaseClaims(token) : null;
  if (!claims) return json({ error: 'not signed in' }, 401);
  if (claims.email_verified !== true || !ADMIN_EMAILS.includes(String(claims.email).toLowerCase())) {
    return json({ error: 'forbidden' }, 403);
  }

  const { id } = await request.json().catch(() => ({}));
  const trackId = Number(id);
  if (!Number.isInteger(trackId) || trackId <= 0) return json({ error: 'invalid id' }, 400);

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    prefer: 'return=representation',
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/audio_library?id=eq.${trackId}&select=id,file_url,image_url`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) return json({ error: 'database delete failed', detail: await res.text() }, 502);
  const [row] = await res.json();
  if (!row) return json({ error: 'track not found' }, 404);

  // Remove the uploaded files from R2 (only user uploads, never shared assets)
  const removed = [];
  for (const url of [row.file_url, row.image_url]) {
    if (env.R2 && typeof url === 'string' && url.startsWith(`${R2_PUBLIC_PREFIX}user_uploads/`)) {
      const key = decodeURIComponent(url.slice(R2_PUBLIC_PREFIX.length));
      await env.R2.delete(key);
      removed.push(key);
    }
  }

  return json({ deleted: trackId, filesRemoved: removed });
}
