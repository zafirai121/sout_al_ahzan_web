// Shared helpers for the Cloudflare Pages Functions in /functions.
// The site is a static export, so track/reciter pages ship the same generic
// <head> for every id. These helpers fill in per-item SEO tags at the edge.

const SUPABASE_URL = 'https://ckhtndmrcypkqrpjlzli.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';

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

// The track/reciter pages export no description/OpenGraph/Twitter metadata
// (see src/app/track/page.tsx), so every tag here is appended, not patched.
// Any leftover generic tags are removed so there is exactly one of each.
export function withSeo(response, { title, description, url, image, type, jsonLd }) {
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escapeHtml(value)}">`;

  let extra =
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
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', remove)
    .on('meta[property^="og:"]', remove)
    .on('meta[name^="twitter:"]', remove)
    .on('head', { element(el) { el.append(extra, { html: true }); } })
    .transform(response);
}
