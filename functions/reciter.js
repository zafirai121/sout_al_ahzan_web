// /reciter?id=123 — inject the reciter's own title/description/image.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo } from '../cloudflare/seo.js';

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
  if (!reciter?.name) return response;

  const title = `${reciter.name} | ${SITE_NAME}`;
  const description = `استمع إلى جميع قصائد ولطميات ${reciter.name} بجودة عالية وبدون إعلانات على منصة ${SITE_NAME}.`;
  const url = `${SITE_URL}/reciter?id=${reciter.id}`;

  return withSeo(response, {
    title,
    description,
    url,
    image: reciter.image_url,
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: reciter.name,
      url,
      ...(reciter.image_url && { image: reciter.image_url }),
    },
  });
}
