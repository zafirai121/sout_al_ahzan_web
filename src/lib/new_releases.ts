// "أحدث الإصدارات" on the homepage: a card for each reciter with new tracks
// ("جديد محمد حجيرات"), not every track uploaded (ten of one reciter's tracks
// would push every other reciter off the shelf). The card shows the newest
// track's release (or its title) and picture, and opens the reciter's page on
// that release. The owner may hide a reciter's card, choose the release it
// opens, and a release's cover (release_settings).
// Only types are imported, so the scripts' tests run it as it is.
import type { DbAudioTrack } from '@/types';
import type { ReleaseSettings } from '@/lib/release_settings';

export interface NewRelease {
  reciterId: string;
  name: string;
  /** The newest track's release, '' when it has none */
  album: string;
  /** The newest track's title */
  title: string;
  /** The newest track's picture */
  imageUrl: string;
  /** The reciter's page, on the release when there is one */
  href: string;
}

type Row = Pick<DbAudioTrack, 'id' | 'title' | 'reciter_name' | 'image_url'> & { reciter_id?: unknown; album?: string | null };

const reciterOf = (t: Row) =>
  t.reciter_id === null || t.reciter_id === undefined || t.reciter_id === '' ? '' : String(t.reciter_id);

/** The newest reciters first, [limit] at most; tracks with no reciter page are left out. */
export function newReleasesOf(tracks: Row[], limit = 20, settings?: ReleaseSettings): NewRelease[] {
  const newest = [...tracks].sort((a, b) => Number(b.id) - Number(a.id));
  const cards = new Map<string, NewRelease>();
  for (const t of newest) {
    const reciterId = reciterOf(t);
    if (!reciterId || cards.has(reciterId) || cards.size >= limit) continue;
    if (settings?.hidden.includes(reciterId)) continue;
    // The release the owner chose for the card, its newest track among these when there is one
    const chosen = settings?.open[reciterId];
    const shown = chosen
      ? newest.find(o => reciterOf(o) === reciterId && (o.album ?? '').trim() === chosen)
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
