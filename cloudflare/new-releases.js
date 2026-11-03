// "أحدث الإصدارات" on the homepage: a card for each reciter with new tracks
// ("جديد محمد حجيرات"), not every track uploaded (ten of one reciter's tracks
// would push every other reciter off the shelf). The card shows the newest
// track's release (or its title) and picture, and opens the reciter's page on
// that release. The owner may hide a reciter's card, choose the release it
// opens, and a release's cover (cloudflare/release-settings.js).
// Worked out on the server (functions/api/new-releases.js) so a visitor gets
// the cards, not the thousand tracks they come from; typed for the site in
// src/lib/new_releases.ts. Nothing here touches the network.

export const NEWEST_COLUMNS = 'id,title,reciter_name,reciter_id,image_url,album';
const PAGE = 1000;

/**
 * The newest tracks, a page of [PAGE] at a time from [page](offset), until
 * they hold [reciters] reciters or [most] tracks: a reciter uploading a whole
 * release at once fills a page by themselves.
 */
export async function newestTracks(page, { reciters = 25, most = 10000 } = {}) {
  const rows = [];
  for (let offset = 0; offset < most; offset += PAGE) {
    const got = await page(offset, PAGE);
    rows.push(...got);
    if (got.length < PAGE || new Set(rows.map(reciterOf).filter(Boolean)).size >= reciters) break;
  }
  return rows;
}

const reciterOf = (t) =>
  t.reciter_id === null || t.reciter_id === undefined || t.reciter_id === '' ? '' : String(t.reciter_id);

/** The newest reciters first, [limit] at most; tracks with no reciter page are left out. */
export function newReleasesOf(tracks, limit = 20, settings) {
  const newest = [...tracks].sort((a, b) => Number(b.id) - Number(a.id));
  const cards = new Map();
  for (const t of newest) {
    const reciterId = reciterOf(t);
    if (!reciterId || cards.has(reciterId) || cards.size >= limit) continue;
    if (settings?.hidden.includes(reciterId)) continue;
    // The release the owner chose for the card, its newest track among these when there is one
    const chosen = settings?.open[reciterId];
    const shown = chosen
      ? newest.find((o) => reciterOf(o) === reciterId && (o.album ?? '').trim() === chosen)
      : t;
    const album = chosen ?? (t.album ?? '').trim();
    cards.set(reciterId, {
      reciterId,
      name: (t.reciter_name ?? '').trim(),
      album,
      title: (shown?.title ?? '').trim(),
      imageUrl: settings?.covers[reciterId]?.[album] || shown?.image_url || t.image_url || '',
      href: `/reciter?id=${reciterId}` + (album ? `&album=${encodeURIComponent(album)}` : ''),
    });
  }
  return [...cards.values()];
}
