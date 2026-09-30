// POST /api/delete-account — permanently deletes the caller's own account.
// Deleting the auth user cascades in the database to everything they own
// (profile, favorites, playlists, follows, comments, reviews, feedback); tracks
// they uploaded stay, without an owner. Deleting a user needs the service role,
// which only the server has, so the app can't do this itself.
import { json, getCaller } from '../../cloudflare/server-api.js';
import { SUPABASE_URL } from '../../cloudflare/seo.js';

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(caller.uid)}`, {
    method: 'DELETE',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) return json({ error: 'account delete failed', detail: await res.text() }, 502);
  return json({ deleted: caller.uid });
}
