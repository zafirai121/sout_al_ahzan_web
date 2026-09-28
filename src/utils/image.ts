// Cover images are stored at full size (often 400–800 KB) but shown as small
// thumbnails. Cloudflare Image Transformations (enabled for the
// soutalahzan.com zone) resizes them on the fly and caches the result.
// Only the origins allowed in Cloudflare → Images → Transformations work;
// anything else (e.g. /icon.png) is returned unchanged.

const TRANSFORM_BASE = 'https://soutalahzan.com/cdn-cgi/image';

const ALLOWED_ORIGINS = new Set([
  'soutalahzan.com',
  'ckhtndmrcypkqrpjlzli.supabase.co',
  'images.unsplash.com',
  'pub-8168942d67ae4c1fb48c404f11458b4a.r2.dev',
]);

// Rounded up to a few fixed sizes so the same image isn't transformed (and
// billed) once per slightly different width.
const STEPS = [96, 160, 320, 480, 640, 800, 1080];

/** URL of `url` resized to at least `pixels` real pixels wide. */
export function resized(url: string | null | undefined, pixels: number, quality = 75): string | undefined {
  // undefined (not '') so <img> renders without a src instead of an empty one
  if (!url) return undefined;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return url; // relative URL such as /icon.png
  }
  if (!ALLOWED_ORIGINS.has(host)) return url;

  const target = STEPS.find(s => s >= pixels) ?? STEPS[STEPS.length - 1];
  return `${TRANSFORM_BASE}/width=${target},quality=${quality},format=auto,fit=scale-down/${url}`;
}

/** URL of `url` for an image shown `width` CSS pixels wide (2x for sharp screens). */
export function thumb(url: string | null | undefined, width: number, quality = 75): string | undefined {
  return resized(url, width * 2, quality);
}
