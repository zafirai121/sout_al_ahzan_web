// /track?id=123 — inject the track's own title/description/image so search
// engines and link previews see a unique page per track.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo } from '../cloudflare/seo.js';

export async function onRequestGet({ request, next }) {
  const response = await next();
  const id = new URL(request.url).searchParams.get('id');
  if (!isValidId(id) || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  let track;
  try {
    [track] = await query(
      `audio_library?id=eq.${id}&select=id,title,reciter_name,image_url,category,duration,created_at,lyrics`
    );
  } catch {
    return response;
  }
  if (!track) return response;

  const name = track.title || 'قصيدة';
  const artist = track.reciter_name || '';
  const lyrics = typeof track.lyrics === 'string' ? track.lyrics.trim() : '';
  const title = artist ? `${name} - ${artist} | ${SITE_NAME}` : `${name} | ${SITE_NAME}`;
  const listen = artist
    ? `استمع إلى ${name} بصوت ${artist} بجودة عالية وبدون إعلانات على منصة ${SITE_NAME}.`
    : `استمع إلى ${name} بجودة عالية وبدون إعلانات على منصة ${SITE_NAME}.`;
  // People search by a line of the poem, so lead with its opening words
  const opening = lyrics.replace(/\s+/g, ' ').slice(0, 110);
  const description = opening
    ? `${opening}${lyrics.length > 110 ? '…' : ''} — ${listen}`
    : listen;
  const url = `${SITE_URL}/track?id=${track.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name,
    url,
    inLanguage: 'ar',
    ...(artist && { byArtist: { '@type': 'Person', name: artist } }),
    ...(track.image_url && { image: track.image_url }),
    ...(track.created_at && { datePublished: track.created_at.slice(0, 10) }),
    ...(lyrics && {
      recordingOf: {
        '@type': 'MusicComposition',
        name,
        lyrics: { '@type': 'CreativeWork', text: lyrics },
      },
    }),
  };

  return withSeo(response, {
    title,
    description,
    url,
    image: track.image_url,
    type: 'music.song',
    jsonLd,
  });
}
