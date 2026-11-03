// /reciter?id=123 — inject the reciter's own title/description/image, and every
// one of their tracks into the page, release by release (cloudflare/seo-pages.js),
// as links search engines can follow to each track.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo } from '../cloudflare/seo.js';
import { reciterContent } from '../cloudflare/seo-pages.js';
import { shownTitle } from '../cloudflare/titles.js';

const PAGE = 1000; // Supabase's most rows a request
const HOUR = 3600;

/** Every row [path] matches, a page at a time. */
async function all(path) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await query(`${path}&offset=${offset}&limit=${PAGE}`, HOUR);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export async function onRequestGet({ request, next }) {
  const id = new URL(request.url).searchParams.get('id');
  // The page, the reciter and their tracks side by side: the id is all they need
  const [response, rows, byId] = await Promise.all([
    next(),
    isValidId(id) ? query(`reciters?id=eq.${id}&select=id,name,image_url`).catch(() => null) : null,
    isValidId(id) ? all(`audio_library?reciter_id=eq.${id}&select=id,title,album&order=id.asc`).catch(() => []) : [],
  ]);
  if (!isValidId(id) || !response.headers.get('content-type')?.includes('text/html') || rows === null) {
    return response;
  }
  const [reciter] = rows;
  if (!reciter?.name) {
    return withSeo(response, {
      title: `الرادود غير موجود | ${SITE_NAME}`,
      description: `هذا الرادود غير موجود في مكتبة ${SITE_NAME}.`,
      url: `${SITE_URL}/reciter?id=${id}`,
      type: 'website',
      status: 404,
    });
  }

  const name = reciter.name.trim();
  const url = `${SITE_URL}/reciter?id=${reciter.id}`;
  // Older uploads may carry only the name
  const found = byId.length
    ? byId
    : await all(`audio_library?reciter_name=eq.${encodeURIComponent(name)}&select=id,title,album&order=id.asc`).catch(() => []);
  const tracks = found.map((t) => ({ id: t.id, name: shownTitle(t.title || 'قصيدة', name) || 'قصيدة', album: t.album }));
  const releases = new Set(tracks.map((t) => (t.album || '').trim()).filter(Boolean)).size;

  const title = `${name} | ${SITE_NAME}`;
  const counted = tracks.length
    ? ` في المكتبة ${tracks.length} من مقاطعه${releases ? `، في ${releases} من إصداراته وغيرها` : ''}.`
    : '';
  const description = `استمع إلى قصائد ولطميات ${name} على منصة ${SITE_NAME} بجودة عالية وبدون إعلانات.${counted}`;

  return withSeo(response, {
    title,
    description,
    url,
    image: reciter.image_url,
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      url,
      ...(reciter.image_url && { image: reciter.image_url }),
    },
    content: reciterContent({ name, about: description, tracks }),
  });
}
