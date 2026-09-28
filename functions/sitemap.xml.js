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

const entry = (loc, lastmod, changefreq, priority) =>
  `<url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}` +
  `<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

export async function onRequestGet({ next }) {
  let tracks, reciters;
  try {
    [tracks, reciters] = await Promise.all([
      fetchAll('audio_library', 'id,created_at'),
      fetchAll('reciters', 'id,created_at'),
    ]);
  } catch {
    return next();
  }

  const urls = [
    entry(SITE_URL, null, 'daily', '1.0'),
    entry(`${SITE_URL}/explore`, null, 'daily', '0.9'),
    entry(`${SITE_URL}/recent`, null, 'daily', '0.8'),
    ...reciters.map((r) => entry(`${SITE_URL}/reciter?id=${r.id}`, r.created_at, 'weekly', '0.8')),
    ...tracks.map((t) => entry(`${SITE_URL}/track?id=${t.id}`, t.created_at, 'monthly', '0.7')),
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
