// "أحدث الإصدارات" on the homepage, typed for the site: the cards are worked
// out in cloudflare/new-releases.js (the server sends them ready,
// functions/api/new-releases.js; the build works them out for the first HTML).
// Only types are imported besides it, so the scripts' tests run it as it is.
import type { DbAudioTrack } from '@/types';
import type { ReleaseSettings } from '@/lib/release_settings';
import { newReleasesOf as work } from '../../cloudflare/new-releases.js';

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

export type NewReleaseRow = Pick<DbAudioTrack, 'id' | 'title' | 'reciter_name' | 'image_url'> & { reciter_id?: unknown; album?: string | null };

/** The newest reciters first, [limit] at most; tracks with no reciter page are left out. */
export const newReleasesOf = work as (tracks: NewReleaseRow[], limit?: number, settings?: ReleaseSettings) => NewRelease[];
