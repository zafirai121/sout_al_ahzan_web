// Shared helpers for the Cloudflare Pages Functions in /functions.
// The site is a static export, so track/reciter pages ship the same generic
// <head> for every id. These helpers fill in per-item SEO tags at the edge.

export const SUPABASE_URL = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

export const SITE_URL = 'https://web.soutalahzan.com';
export const SITE_NAME = 'صوت الأحزان';

export async function query(path, cacheTtl = 300) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
    cf: { cacheTtl, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
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

// A list of tracks as links to their pages
export const trackLinks = (tracks) =>
  `<ul style="padding-inline-start:20px">${tracks
    .map((t) => `<li><a href="/track?id=${t.id}">${escapeHtml(t.name)}</a></li>`)
    .join('')}</ul>`;
