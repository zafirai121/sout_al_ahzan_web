// Removing a track that is a copy of another (or a short clip), for the
// library's upkeep (functions/api/admin/library.js) and the site's owner
// (functions/api/admin/copy.js): the row kept in the bucket first, its likes
// and listens moved to the one kept, the row gone, then its file and cover
// when no other track or reciter uses them.
import { db } from './server-api.js';
import { BUCKET_HOSTS, bucketKeyOf, playlistAfter } from './recordings.js';

const AS_JSON = { httpMetadata: { contentType: 'application/json' } };

// Whether any track (its file or cover) or reciter's picture points to this key, however the link is written
export async function usedElsewhere(env, key, ...links) {
  // The key as each host links it, as is and encoded (a track may link the bucket's public address)
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const variants = [...new Set([...BUCKET_HOSTS.flatMap((h) => [`https://${h}/${key}`, `https://${h}/${encoded}`]), ...links.filter(Boolean)])];
  const list = variants.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',');
  const inTracks = await db(env, `audio_library?select=id&or=${encodeURIComponent(`(file_url.in.(${list}),image_url.in.(${list}))`)}&limit=1`);
  const inReciters = await db(env, `reciters?select=id&image_url=in.${encodeURIComponent(`(${list})`)}&limit=1`);
  if (!inTracks.ok || !inReciters.ok) return true; // when unsure, kept
  return (await inTracks.json()).length > 0 || (await inReciters.json()).length > 0;
}

/**
 * Removes [row]: a copy of [kept] (its likes and listens go to it), or a clip
 * when [kept] is null (its likes go). { likes, files } as done, or { refused }.
 */
export async function removeTrack(env, row, kept) {
  const id = row.id;
  const keep = kept?.id ?? null;
  // The row as it was, kept in the bucket first
  await env.R2.put(`backups/removed-tracks/${new Date().toISOString().slice(0, 10)}/${id}.json`,
    JSON.stringify({ removed: row, keptInstead: keep, at: new Date().toISOString() }), AS_JSON);
  // Likes: to the one kept (each listener once), else gone
  const likes = await db(env, `favorites?select=user_id&poem_id=eq.cloud_${id}`);
  const likers = likes.ok ? (await likes.json()).map((l) => l.user_id) : [];
  if (keep != null && likers.length) {
    const add = await db(env, 'favorites?on_conflict=user_id,poem_id', {
      method: 'POST',
      headers: { prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(likers.map((u) => ({ user_id: u, poem_id: `cloud_${keep}` }))),
    });
    if (!add.ok) return { refused: `likes not moved: ${await add.text()}` };
  }
  if (likers.length) await db(env, `favorites?poem_id=eq.cloud_${id}`, { method: 'DELETE' });
  // Its listens counted for the one kept
  if (keep != null && row.listen_count) {
    kept.listen_count = (kept.listen_count || 0) + row.listen_count;
    await db(env, `audio_library?id=eq.${keep}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ listen_count: kept.listen_count }) });
  }
  const del = await db(env, `audio_library?id=eq.${id}`, { method: 'DELETE' });
  if (!del.ok) return { refused: `delete failed: ${await del.text()}` };
  // Its file and cover, when no other track uses them
  const files = [];
  for (const link of [row.file_url, row.image_url]) {
    const key = bucketKeyOf(link);
    if (!key || key.startsWith('thumbs/') || key.startsWith('backups/')) continue;
    if (await usedElsewhere(env, key, link)) continue;
    files.push(key, `thumbs/640/${key}`);
  }
  if (files.length) await env.R2.delete(files);
  return { likes: likers.length, files: files.filter((k) => !k.startsWith('thumbs/')).length };
}

/** The playlists holding [gone], given [keep] in its place; how many changed. */
export async function movePlaylists(env, gone, keep) {
  let changed = 0;
  for (let offset = 0; ; offset += 1000) {
    const res = await db(env, `user_playlists?select=id,tracks&order=id&offset=${offset}&limit=1000`);
    if (!res.ok) throw new Error(`user_playlists: ${res.status}`);
    const page = await res.json();
    for (const p of page) {
      const tracks = playlistAfter(p.tracks, gone, keep);
      if (!tracks) continue;
      const saved = await db(env, `user_playlists?id=eq.${encodeURIComponent(p.id)}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ tracks }) });
      if (saved.ok) changed++;
    }
    if (page.length < 1000) return changed;
  }
}
