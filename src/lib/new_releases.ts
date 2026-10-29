// "أحدث الإصدارات" on the homepage: a card for each reciter with new tracks
// ("جديد محمد حجيرات"), not every track uploaded (ten of one reciter's tracks
// would push every other reciter off the shelf). The card shows the newest
// track's release (or its title) and picture, and opens the reciter's page on
// that release.
// Only types are imported, so the scripts' tests run it as it is.
import type { DbAudioTrack } from '@/types';

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

/** The newest reciters first, [limit] at most; tracks with no reciter page are left out. */
export function newReleasesOf(tracks: Row[], limit = 20): NewRelease[] {
  const cards = new Map<string, NewRelease>();
  for (const t of [...tracks].sort((a, b) => Number(b.id) - Number(a.id))) {
    if (t.reciter_id === null || t.reciter_id === undefined || t.reciter_id === '') continue;
    const reciterId = String(t.reciter_id);
    if (cards.has(reciterId) || cards.size >= limit) continue;
    const album = (t.album ?? '').trim();
    cards.set(reciterId, {
      reciterId,
      name: (t.reciter_name ?? '').trim(),
      album,
      title: (t.title ?? '').trim(),
      imageUrl: t.image_url ?? '',
      href: `/reciter?id=${reciterId}` + (album ? `&album=${encodeURIComponent(album)}` : ''),
    });
  }
  return [...cards.values()];
}
