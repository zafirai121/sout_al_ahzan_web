// Telling the same recording uploaded twice, and what a removed copy leaves:
// shared by the library's upkeep (functions/api/admin/library.js), the owner's
// "remove a copy" (functions/api/admin/copy.js) and the track editor in the
// browser. Nothing here touches the network.

/** A track's length in seconds ("m:ss", "h:mm:ss" or a number); null when unknown. */
export function secondsOf(d) {
  if (d == null || d === '') return null;
  if (typeof d === 'number') return d;
  const parts = String(d).split(':').map(Number);
  return parts.some(Number.isNaN) ? null : parts.reduce((s, p) => s * 60 + p, 0);
}

/** Whether two lengths are one recording: within 5 seconds, or 3% of the longer (as the library's tidying finds copies). */
export function sameRecording(a, b) {
  const x = secondsOf(a);
  const y = secondsOf(b);
  if (!x || !y) return false;
  return Math.abs(x - y) <= Math.max(5, Math.max(x, y) * 0.03);
}

// The bucket's files are linked through the site, its www name, or the bucket's own public address
export const BUCKET_HOSTS = ['soutalahzan.com', 'www.soutalahzan.com', 'pub-8168942d67ae4c1fb48c404f11458b4a.r2.dev'];

/** The bucket key a link of ours points to (links may be stored encoded or not); null for anyone else's. */
export function bucketKeyOf(link) {
  if (typeof link !== 'string') return null;
  try {
    const url = new URL(link);
    if (!BUCKET_HOSTS.includes(url.hostname)) return null;
    return decodeURIComponent(url.pathname.slice(1)) || null;
  } catch {
    return null;
  }
}

/**
 * A playlist's tracks once track [gone] is removed as a copy of [keep]: the
 * kept one in its place (written as the playlist writes its tracks: "cloud_12",
 * "12" or 12), or nothing when the playlist has it already. null: unchanged.
 */
export function playlistAfter(tracks, gone, keep) {
  if (!Array.isArray(tracks)) return null;
  const idOf = (item) => Number(String(item).replace(/^cloud_/, ''));
  if (!tracks.some((item) => idOf(item) === gone)) return null;
  const hasKept = tracks.some((item) => idOf(item) === keep);
  const as = (item) => (typeof item === 'number' ? keep : String(item).startsWith('cloud_') ? `cloud_${keep}` : String(keep));
  return tracks.flatMap((item) => (idOf(item) !== gone ? [item] : hasKept ? [] : [as(item)]));
}
