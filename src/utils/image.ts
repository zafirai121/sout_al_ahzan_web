// Cover images are stored at full size (often 400–800 KB) but shown as small
// thumbnails. Cloudflare Image Transformations (enabled for the
// soutalahzan.com zone) resizes them on the fly and caches the result.
// Only the origins allowed in Cloudflare → Images → Transformations work;
// anything else (e.g. /cover-placeholder.svg) is returned unchanged.
//
// Once the month's allowance of new transformations is used up, Cloudflare
// refuses to resize a cover it hasn't resized before (429). Such a cover is
// then shown as stored, remembered for the month (see COVER_FALLBACK_SCRIPT),
// and a cover that can't load at all shows the apps' placeholder: the
// microphone on dark grey.
//
// Our own covers also have a small copy made beside them (functions/api/
// thumbs.js: WebP, shorter side 640 px): anything drawn up to 640 real pixels
// wide uses it, with no resizing to wait for or pay for. A cover without one
// yet is shown as stored.

const TRANSFORM_BASE = 'https://soutalahzan.com/cdn-cgi/image';
const OWN = 'https://soutalahzan.com/';
const SMALL_BASE = 'https://soutalahzan.com/thumbs/640/';
const SMALL_PX = 640;

/** What a missing or unloadable cover shows (as in the phone apps). */
export const COVER_PLACEHOLDER = '/cover-placeholder.svg';

const UNRESIZED_KEY = 'sawt_unresized';

declare global {
  interface Window { __sawtCovers?: { unresized: Set<string>; noSmall: Set<string> } }
}

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
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url; // relative URL such as /cover-placeholder.svg
  }
  // Saved links may hold Arabic and spaces (".../reciters/باسم_الكربلائي/...",
  // ".../اجيتك باربعينك 1447ه.jpg"): written as they are, a space splits the
  // link in srcset, and in the preload hints Cloudflare sends as headers the
  // Arabic arrives garbled. Percent-encoded, they work everywhere.
  url = parsed.href;
  if (!ALLOWED_ORIGINS.has(parsed.hostname)) return url;
  // Its small copy, when it is big enough and has been made (see SMALL_BASE)
  const own = url.startsWith(OWN) && !url.startsWith(SMALL_BASE) && !url.startsWith(`${TRANSFORM_BASE}/`);
  if (own && pixels <= SMALL_PX && !(typeof window !== 'undefined' && window.__sawtCovers?.noSmall.has(url))) {
    return SMALL_BASE + url.slice(OWN.length);
  }
  // Refused this month: straight to the stored one
  if (typeof window !== 'undefined' && window.__sawtCovers?.unresized.has(url)) return url;

  const target = STEPS.find(s => s >= pixels) ?? STEPS[STEPS.length - 1];
  return `${TRANSFORM_BASE}/width=${target},quality=${quality},format=auto,fit=scale-down/${url}`;
}

/** URL of `url` for an image shown `width` CSS pixels wide (2x for sharp screens). */
export function thumb(url: string | null | undefined, width: number, quality = 75): string | undefined {
  return resized(url, width * 2, quality);
}

/**
 * Runs in the page's <head>, before any image: an image that fails is caught
 * from the start. A resized cover that fails is asked for as stored (and
 * remembered for the month, so the next pages ask for it so at once); a
 * cover that still can't load shows COVER_PLACEHOLDER, never the site's logo
 * or the browser's broken-picture sign. Images that failed before they were
 * put in the page (the error went nowhere) are caught as they go in.
 */
export const COVER_FALLBACK_SCRIPT = `(function () {
  var KEY = ${JSON.stringify(UNRESIZED_KEY)}, BASE = ${JSON.stringify(TRANSFORM_BASE + '/')}, PLACEHOLDER = ${JSON.stringify(COVER_PLACEHOLDER)};
  var OWN = ${JSON.stringify(OWN)}, SMALL = ${JSON.stringify(SMALL_BASE)};
  var month = new Date().toISOString().slice(0, 7), unresized = new Set(), noSmall = new Set();
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.month === month) unresized = new Set(saved.urls); } catch (e) {}
  window.__sawtCovers = { unresized: unresized, noSmall: noSmall };
  function remember(url) {
    if (unresized.has(url)) return;
    unresized.add(url);
    try { localStorage.setItem(KEY, JSON.stringify({ month: month, urls: Array.from(unresized).slice(-3000) })); } catch (e) {}
  }
  // The next thing to show after [src] failed: a small copy not made yet (a
  // cover uploaded since the last run) → the cover itself, for this visit; a
  // refused resize → the cover as stored, for the month; anything else → the
  // placeholder. Decided by the failed link alone: the page may draw the
  // picture again meanwhile and start over.
  function failed(img) {
    var src = img.currentSrc || img.getAttribute('src') || '';
    if (!src) return;
    if (src.indexOf(PLACEHOLDER) !== -1) { img.style.visibility = 'hidden'; return; }
    var next = null;
    if (src.indexOf(SMALL) === 0) {
      next = OWN + src.slice(SMALL.length);
      noSmall.add(next);
    } else if (src.indexOf(BASE) === 0) {
      var rest = src.slice(BASE.length), slash = rest.indexOf('/');
      var cover = slash < 0 ? '' : rest.slice(slash + 1);
      if (cover.indexOf('https://') === 0) { next = cover; remember(cover); }
    }
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = next || PLACEHOLDER;
  }
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') failed(t); }, true);
  // Hidden after even the placeholder failed (offline), then drawn again and loaded: shown
  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.style.visibility === 'hidden') t.style.visibility = ''; }, true);
  function check(img) {
    if (img.complete && img.naturalWidth === 0 && (img.currentSrc || img.getAttribute('src')) && img.style.visibility !== 'hidden') failed(img);
  }
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'IMG') { check(n); continue; }
        var imgs = n.getElementsByTagName('img');
        for (var k = 0; k < imgs.length; k++) check(imgs[k]);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();`;
