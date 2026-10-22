// /reciter?id=123 — inject the reciter's own title/description/image, and the
// list of their tracks into the page, as links search engines can follow.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo, escapeHtml, trackLinks } from '../cloudflare/seo.js';
import { shownTitle } from '../cloudflare/titles.js';

export async function onRequestGet({ request, next }) {
  const response = await next();
  const id = new URL(request.url).searchParams.get('id');
  if (!isValidId(id) || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  let reciter;
  try {
    [reciter] = await query(`reciters?id=eq.${id}&select=id,name,image_url`);
  } catch {
    return response;
  }
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
  const title = `${name} | ${SITE_NAME}`;
  const description = `استمع إلى جميع قصائد ولطميات ${name} بجودة عالية وبدون إعلانات على منصة ${SITE_NAME}.`;
  const url = `${SITE_URL}/reciter?id=${reciter.id}`;

  // Their tracks, the most listened first
  const rows = await query(
    `audio_library?reciter_name=eq.${encodeURIComponent(name)}&select=id,title&order=listen_count.desc.nullslast&limit=500`,
    3600,
  ).catch(() => []);
  const tracks = rows.map((t) => ({ id: t.id, name: shownTitle(t.title || 'قصيدة', name) || 'قصيدة' }));
  const content =
    `<article dir="rtl">` +
    `<h1 style="font-size:32px;margin:0 0 8px">${escapeHtml(name)}</h1>` +
    `<p>${escapeHtml(description)}</p>` +
    (tracks.length
      ? `<section><h2 style="font-size:22px">قصائد ${escapeHtml(name)}</h2>${trackLinks(tracks)}</section>`
      : '') +
    `</article>`;

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
    content,
  });
}
