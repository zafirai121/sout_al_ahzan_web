// Shared helpers for the Cloudflare Pages Functions in /functions.
// The site is a static export, so track/reciter pages ship the same generic
// <head> for every id. These helpers fill in per-item SEO tags at the edge.

export const SUPABASE_URL = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

export const SITE_URL = 'https://web.soutalahzan.com';
export const SITE_NAME = 'صوت الأحزان';

// The longest a page waits for the database before it answers "later" (unavailable)
const QUERY_TIMEOUT_MS = 8000;

export async function query(path, cacheTtl = 300) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
    cf: { cacheTtl, cacheEverything: true },
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

/**
 * The page as it is, said to be unavailable for now (503, try again in ten
 * minutes): for when the database did not answer. A search engine comes back
 * later instead of keeping a page without its title, canonical or words, the
 * same for every id (Search Console's "duplicate without user-selected
 * canonical"); a visitor still gets the page, which reads its track itself.
 */
export function unavailable(response) {
  const headers = new Headers(response.headers);
  headers.set('retry-after', '600');
  headers.set('cache-control', 'no-store');
  return new Response(response.body, { status: 503, headers });
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isValidId(id) {
  return typeof id === 'string' && /^\d{1,12}$/.test(id);
}

// The track/reciter pages export no title/description/OpenGraph/Twitter
// metadata (see src/app/track/page.tsx), so every tag here is appended, not patched.
// Any leftover generic tags are removed so there is exactly one of each.
// `content`: the page's own words (its title, reciter, lyrics, links to more)
// as HTML, put where the page shows "جاري التحميل..." until its script has
// drawn it ([data-seo-slot]). Search engines read the page from there; the
// script then draws the page over it (that part is drawn in the browser only:
// React replaces it, it does not try to match it).
export function withSeo(response, { title, description, url, image, type, jsonLd, content, status }) {
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escapeHtml(value)}">`;

  // The page comes with no title of its own (src/app/track/page.tsx): its title is this one
  let extra =
    `<title>${escapeHtml(title)}</title>` +
    meta('name', 'description', description) +
    `<link rel="canonical" href="${escapeHtml(url)}">` +
    meta('property', 'og:title', title) +
    meta('property', 'og:description', description) +
    meta('property', 'og:url', url) +
    meta('property', 'og:type', type) +
    meta('property', 'og:site_name', SITE_NAME) +
    meta('property', 'og:locale', 'ar_SA') +
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary') +
    meta('name', 'twitter:title', title) +
    meta('name', 'twitter:description', description);
  if (image) {
    extra += meta('property', 'og:image', image) + meta('name', 'twitter:image', image);
  }
  if (jsonLd) {
    extra += `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;
  }

  const remove = { element(el) { el.remove(); } };
  let rewriter = new HTMLRewriter()
    .on('title', remove)
    .on('meta[name="description"]', remove)
    .on('meta[property^="og:"]', remove)
    .on('meta[name^="twitter:"]', remove)
    .on('head', { element(el) { el.append(extra, { html: true }); } });
  if (content) {
    rewriter = rewriter.on('[data-seo-slot]', {
      element(el) {
        el.setAttribute('style', 'padding:24px 24px 40px;line-height:1.8');
        el.setInnerContent(content, { html: true });
      },
    });
  }
  const transformed = rewriter.transform(response);
  // A page for an id that is not (or no longer) in the library says so
  return status ? new Response(transformed.body, { status, headers: transformed.headers }) : transformed;
}

// The library's category values, as the apps name them
const CATEGORY_NAMES = {
  hussainiya_poems: 'قصائد حسينية', latmiya: 'لطميات', nazla: 'لطميات', shoor: 'شور', dua: 'أدعية ومناجاة', adhkar: 'أدعية ومناجاة',
  muwalid: 'مواليد', naei: 'نعي', quran: 'قرآن كريم', ziyarat: 'زيارات', nasheed: 'أناشيد', anasheed: 'أناشيد',
  variety: 'منوعات', lectures: 'محاضرات',
};
export const categoryName = (value) => (value ? CATEGORY_NAMES[value] || (/[\u0600-\u06FF]/.test(value) ? value : '') : '');

/** The page for an id that is missing, malformed or not in the library: its own title, and 404. */
export function notFound(response, { what, path, id }) {
  return withSeo(response, {
    title: `${what} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F | ${SITE_NAME}`,
    description: `\u0647\u0630\u0627 ${what} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0645\u0643\u062A\u0628\u0629 ${SITE_NAME}${what === '\u0627\u0644\u0645\u0642\u0637\u0639' ? '\u060C \u0631\u0628\u0645\u0627 \u062D\u064F\u0630\u0641' : ''}.`,
    url: `${SITE_URL}${path}${isValidId(id) ? `?id=${id}` : ''}`,
    type: 'website',
    status: 404,
  });
}

// A list of tracks as links to their pages
export const trackLinks = (tracks) =>
  `<ul style="padding-inline-start:20px">${tracks
    .map((t) => `<li><a href="/track?id=${t.id}">${escapeHtml(t.name)}</a></li>`)
    .join('')}</ul>`;
