// POST /api/admin/reciter-image  { "name": "...", "imageUrl": "https://soutalahzan.com/..." }
// Sets a reciter's photo (creating the reciter if needed) and uses it as the
// cover of all their tracks. Admin only.
import { json, getCaller, db, isOwnImageUrl } from '../../../cloudflare/server-api.js';

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'server not configured' }, 500);

  const caller = await getCaller(request);
  if (!caller) return json({ error: 'not signed in' }, 401);
  if (!caller.isAdmin) return json({ error: 'forbidden' }, 403);

  const { name, imageUrl } = await request.json().catch(() => ({}));
  const reciterName = typeof name === 'string' ? name.trim() : '';
  if (!reciterName || reciterName.length > 200) return json({ error: 'invalid name' }, 400);
  if (!isOwnImageUrl(imageUrl)) return json({ error: 'invalid image url' }, 400);

  const byName = `name=eq.${encodeURIComponent(reciterName)}`;
  const found = await db(env, `reciters?${byName}&select=id&limit=1`);
  if (!found.ok) return json({ error: 'database read failed' }, 502);
  const [existing] = await found.json();

  const saved = existing
    ? await db(env, `reciters?id=eq.${existing.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: imageUrl }) })
    : await db(env, 'reciters', { method: 'POST', body: JSON.stringify({ name: reciterName, image_url: imageUrl }) });
  if (!saved.ok) return json({ error: 'reciter save failed', detail: await saved.text() }, 502);
  const [reciter] = await saved.json();

  const covers = await db(env, `audio_library?reciter_name=eq.${encodeURIComponent(reciterName)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!covers.ok) return json({ error: 'track covers update failed', detail: await covers.text() }, 502);

  return json({ reciter });
}
