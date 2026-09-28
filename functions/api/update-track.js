// POST /api/update-track  { "id": 123, "fields": { "title": "...", ... } }
// Edits a track's details. The uploader may edit their own tracks; the admin
// may edit any. Only the fields below can change — never file_url, user_id,
// listen counts or status.
import { json, getCaller, db, isOwnImageUrl } from '../../cloudflare/server-api.js';

// field → max length; null clears an optional field
const TEXT_FIELDS = {
  title: 300,
  reciter_name: 200,
  category: 100,
  lyrics: 30000,
  occasion: 200,
  year: 20,
  location: 200,
  album: 300,
};
const REQUIRED = ['title', 'reciter_name'];

function cleanFields(fields) {
  if (!fields || typeof fields !== 'object') return null;
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'image_url') {
      if (!isOwnImageUrl(value)) return null;
      out.image_url = value;
    } else if (key in TEXT_FIELDS) {
      if (value === null && !REQUIRED.includes(key)) {
        out[key] = null;
      } else if (typeof value === 'string' && value.length <= TEXT_FIELDS[key]) {
        const trimmed = value.trim();
        if (REQUIRED.includes(key) && !trimmed) return null;
        out[key] = trimmed;
      } else {
        return null;
      }
    }
    // unknown keys are ignored
  }
  return Object.keys(out).length ? out : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);

  const body = await request.json().catch(() => ({}));
  const trackId = Number(body.id);
  if (!Number.isInteger(trackId) || trackId <= 0) return json({ error: 'invalid id' }, 400);
  const fields = cleanFields(body.fields);
  if (!fields) return json({ error: 'invalid fields' }, 400);

  // Ownership: tracks with no recorded uploader can only be edited by the admin
  const found = await db(env, `audio_library?id=eq.${trackId}&select=user_id`);
  if (!found.ok) return json({ error: 'database read failed' }, 502);
  const [row] = await found.json();
  if (!row) return json({ error: 'track not found' }, 404);
  if (!caller.isAdmin && row.user_id !== caller.uid) return json({ error: 'forbidden' }, 403);

  const res = await db(env, `audio_library?id=eq.${trackId}`, { method: 'PATCH', body: JSON.stringify(fields) });
  if (!res.ok) return json({ error: 'database update failed', detail: await res.text() }, 502);
  const [updated] = await res.json();
  return json({ track: updated });
}
