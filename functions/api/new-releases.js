// GET /api/new-releases → the homepage's «أحدث الإصدارات» cards, worked out
// here from the newest tracks (as many pages as twenty-odd reciters take) and
// the owner's choices (cloudflare/new-releases.js), so a visitor gets twenty
// cards (a few KB) rather than the tracks they come from. The tracks are kept
// at the edge for five minutes; the owner's choices are read each time.
import { json } from '../../cloudflare/server-api.js';
import { query } from '../../cloudflare/seo.js';
import { cleanSettings, SETTINGS_KEY } from '../../cloudflare/release-settings.js';
import { NEWEST_COLUMNS, newReleasesOf, newestTracks } from '../../cloudflare/new-releases.js';

const page = (offset, limit) =>
  query(`audio_library?select=${NEWEST_COLUMNS}&order=id.desc&offset=${offset}&limit=${limit}`, 300);

export async function onRequestGet({ env }) {
  const [tracks, settings] = await Promise.all([
    newestTracks(page).catch(() => null),
    env.R2
      ? env.R2.get(SETTINGS_KEY).then((o) => (o ? o.json() : null)).then(cleanSettings).catch(() => cleanSettings(null))
      : cleanSettings(null),
  ]);
  if (!tracks) return json({ error: 'library unreachable' }, 502);
  const res = json(newReleasesOf(tracks, 20, settings));
  res.headers.set('cache-control', 'public, max-age=60');
  return res;
}
