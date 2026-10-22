// /track?id=123 — inject the track's own title/description/image, and its own
// words into the page (title, reciter, lyrics, more of the reciter's tracks),
// so search engines and link previews see a unique page per track.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo, escapeHtml, categoryName, trackLinks } from '../cloudflare/seo.js';
import { shownTitle } from '../cloudflare/titles.js';

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
  if (!track) {
    return withSeo(response, {
      title: `المقطع غير موجود | ${SITE_NAME}`,
      description: `هذا المقطع غير موجود في مكتبة ${SITE_NAME}، ربما حُذف.`,
      url: `${SITE_URL}/track?id=${id}`,
      type: 'website',
      status: 404,
    });
  }

  const artist = (track.reciter_name || '').trim();
  // As the apps show it: without junk, and without the reciter's name (which follows it here)
  const name = shownTitle(track.title || 'قصيدة', artist) || 'قصيدة';
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

  // The reciter's page and their most listened tracks, linked from this one
  let reciterId = null;
  let more = [];
  if (artist) {
    const who = encodeURIComponent(artist);
    const [reciterRows, moreRows] = await Promise.all([
      query(`reciters?name=eq.${who}&select=id&limit=1`, 3600).catch(() => []),
      query(`audio_library?reciter_name=eq.${who}&id=neq.${track.id}&select=id,title&order=listen_count.desc.nullslast&limit=30`, 3600).catch(() => []),
    ]);
    reciterId = reciterRows[0]?.id ?? null;
    more = moreRows.map((t) => ({ id: t.id, name: shownTitle(t.title || 'قصيدة', artist) || 'قصيدة' }));
  }

  const category = categoryName(track.category);
  // "4:05" as stored ("0:00" and anything else: unknown)
  const duration = typeof track.duration === 'string' && /^\d+(:\d{2}){1,2}$/.test(track.duration) && !/^0+(:00)+$/.test(track.duration) ? track.duration : '';
  const by = artist
    ? (reciterId ? `<a href="/reciter?id=${reciterId}">${escapeHtml(artist)}</a>` : escapeHtml(artist))
    : '';
  const content =
    `<article dir="rtl">` +
    `<h1 style="font-size:32px;margin:0 0 8px">${escapeHtml(name)}</h1>` +
    `<p style="color:#b3b3b3;margin:0 0 16px">${[by, escapeHtml(category), duration && `<span dir="ltr">${duration}</span>`].filter(Boolean).join(' • ')}</p>` +
    `<p>${escapeHtml(listen)}</p>` +
    (lyrics
      ? `<section><h2 style="font-size:22px">كلمات ${escapeHtml(name)}</h2><p style="white-space:pre-line">${escapeHtml(lyrics)}</p></section>`
      : '') +
    (more.length
      ? `<section><h2 style="font-size:22px">المزيد من ${escapeHtml(artist)}</h2>${trackLinks(more)}</section>`
      : '') +
    `</article>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name,
    url,
    inLanguage: 'ar',
    ...(artist && { byArtist: { '@type': 'Person', name: artist, ...(reciterId && { url: `${SITE_URL}/reciter?id=${reciterId}` }) } }),
    ...(track.image_url && { image: track.image_url }),
    ...(category && { genre: category }),
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
    content,
  });
}
