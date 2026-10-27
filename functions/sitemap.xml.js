// /sitemap.xml — built live from Supabase so every track and reciter is listed,
// including uploads made after the last deploy. Falls back to the static
// sitemap from src/app/sitemap.ts if Supabase is unreachable.
import { SITE_URL, query, escapeHtml } from '../cloudflare/seo.js';

const PAGE_SIZE = 1000;

async function fetchAll(table, select) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await query(`${table}?select=${select}&order=id&offset=${offset}&limit=${PAGE_SIZE}`, 3600);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

// The day every track and reciter page got its own words in its HTML (title,
// lyrics, links; functions/track.js): each changed then, so none says it is
// older, and search engines read them all again
const PAGES_CHANGED = '2026-10-22';
const changed = (createdAt) => (createdAt && createdAt.slice(0, 10) > PAGES_CHANGED ? createdAt : PAGES_CHANGED);

// The pages that are the same for everyone: browsing, the categories, the
// site's own pages (src/app/sitemap.ts lists the same ones)
const BROWSE = ['/explore?type=recent', '/explore?type=popular', '/explore?type=reciters', '/radio'];
const CATEGORIES = ['hussainiya_poems', 'naei', 'muwalid', 'afrah', 'dua', 'ziyarat', 'quran', 'nasheed', 'lectures', 'variety'];
const ABOUT = ['/about', '/download', '/help', '/support', '/contact', '/artists', '/publishers', '/jobs', '/legal', '/privacy-policy', '/privacy-center', '/cookies', '/ads'];
// A name some uploads were filed under, not a reciter: no page of its own to offer
const NOT_A_RECITER = 'مجهول';

const entry = (loc, lastmod, changefreq, priority) =>
  `<url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}` +
  `<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

export async function onRequestGet({ next }) {
  let tracks, reciters;
  try {
    [tracks, reciters] = await Promise.all([
      fetchAll('audio_library', 'id,created_at'),
      fetchAll('reciters', 'id,name,created_at'),
    ]);
  } catch {
    return next();
  }

  const urls = [
    entry(SITE_URL, null, 'daily', '1.0'),
    ...BROWSE.map((path) => entry(`${SITE_URL}${path}`, null, 'daily', '0.9')),
    ...CATEGORIES.map((id) => entry(`${SITE_URL}/category/${id}`, null, 'daily', '0.9')),
    ...reciters.filter((r) => r.name?.trim() !== NOT_A_RECITER)
      .map((r) => entry(`${SITE_URL}/reciter?id=${r.id}`, changed(r.created_at), 'weekly', '0.8')),
    ...tracks.map((t) => entry(`${SITE_URL}/track?id=${t.id}`, changed(t.created_at), 'monthly', '0.7')),
    ...ABOUT.map((path) => entry(`${SITE_URL}${path}`, null, 'monthly', '0.4')),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
