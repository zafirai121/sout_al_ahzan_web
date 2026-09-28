// POST /api/admin/delete-track  { "id": 123 }
// Deletes a track row and its uploaded files. Replaces the old Supabase RPC
// delete_audio_track_admin, whose "secret" was shipped inside the app.
// Admin only (see cloudflare/server-api.js).
import { json, getCaller, db } from '../../../cloudflare/server-api.js';

const R2_PUBLIC_PREFIX = 'https://soutalahzan.com/';

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);
  if (!caller.isAdmin) return json({ error: 'forbidden' }, 403);

  const { id } = await request.json().catch(() => ({}));
  const trackId = Number(id);
  if (!Number.isInteger(trackId) || trackId <= 0) return json({ error: 'invalid id' }, 400);

  const res = await db(env, `audio_library?id=eq.${trackId}&select=id,file_url,image_url`, { method: 'DELETE' });
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
