// /track?id=123 — inject the track's own title/description/image, and its own
// words into the page (what it is, its release, the reciter's tracks around it
// and their best known; cloudflare/seo-pages.js), so search engines see a page
// unlike its siblings and reach every track through its neighbours.
import { SITE_URL, SITE_NAME, query, isValidId, withSeo, categoryName } from '../cloudflare/seo.js';
import { arabicDate, isoDuration, trackAbout, trackContent } from '../cloudflare/seo-pages.js';
import { shownTitle } from '../cloudflare/titles.js';

const COLUMNS = 'id,title,reciter_name,reciter_id,image_url,category,duration,created_at,lyrics,album,occasion,year,location';
const AROUND = 5;
const POPULAR = 10;
const RELEASE = 40;
const HOUR = 3600;
// A track's own row, kept at the edge this long (the page in the browser reads it fresh)
const TEN_MINUTES = 600;

export async function onRequestGet({ request, next }) {
  const id = new URL(request.url).searchParams.get('id');
  // The page and its track side by side: the id is all both need
  const [response, rows] = await Promise.all([
    next(),
    isValidId(id) ? query(`audio_library?id=eq.${id}&select=${COLUMNS}`, TEN_MINUTES).catch(() => null) : null,
  ]);
  if (!isValidId(id) || !response.headers.get('content-type')?.includes('text/html') || rows === null) {
    return response;
  }
  const [track] = rows;
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
  const titleOf = (t) => shownTitle(t.title || 'قصيدة', artist) || 'قصيدة';
  // As the apps show it: without junk, and without the reciter's name (which follows it here)
  const name = titleOf(track);
  const album = (track.album || '').trim();
  const category = categoryName(track.category);
  const lyrics = typeof track.lyrics === 'string' ? track.lyrics.trim() : '';
  // "4:05" as stored ("0:00" and anything else: unknown)
  const duration = isoDuration(track.duration) ? track.duration : '';
  const url = `${SITE_URL}/track?id=${track.id}`;

  // The reciter's page and the tracks around this one, asked for at once
  const reciterId = track.reciter_id ?? null;
  const same = reciterId ? `reciter_id=eq.${reciterId}` : `reciter_name=eq.${encodeURIComponent(artist)}`;
  const list = (path) => query(`audio_library?${same}&${path}&select=id,title`, HOUR).catch(() => []);
  const [reciterRows, release, before, after, popular] = artist
    ? await Promise.all([
      reciterId
        ? query(`reciters?id=eq.${reciterId}&select=id`, HOUR).catch(() => [])
        : query(`reciters?name=eq.${encodeURIComponent(artist)}&select=id&limit=1`, HOUR).catch(() => []),
      album ? list(`album=eq.${encodeURIComponent(album)}&id=neq.${track.id}&order=id.asc&limit=${RELEASE}`) : [],
      list(`id=lt.${track.id}&order=id.desc&limit=${AROUND}`),
      list(`id=gt.${track.id}&order=id.asc&limit=${AROUND}`),
      list(`id=neq.${track.id}&order=listen_count.desc.nullslast,id.desc&limit=${POPULAR + 2 * AROUND}`),
    ])
    : [[], [], [], [], []];
  const pageId = reciterRows[0]?.id ?? null;
  const named = (list) => list.map((t) => ({ id: t.id, name: titleOf(t) }));
  const shown = new Set([...before, ...after].map((t) => t.id));

  const about = trackAbout({
    name, artist, category, album,
    occasion: (track.occasion || '').trim(),
    year: (track.year || '').trim(),
    location: (track.location || '').trim(),
    date: arabicDate(track.created_at),
  });
  const listen = `استمع إليه بجودة عالية وبدون إعلانات على منصة ${SITE_NAME}.`;
  // People search by a line of the poem, so lead with its opening words when there are any
  const opening = lyrics.replace(/\s+/g, ' ').slice(0, 110);
  const description = opening ? `${opening}${lyrics.length > 110 ? '…' : ''} — ${about} ${listen}` : `${about} ${listen}`;
  const title = artist ? `${name} - ${artist} | ${SITE_NAME}` : `${name} | ${SITE_NAME}`;

  const content = trackContent({
    name, artist, reciterId: pageId, category, album, duration, about: `${about} ${listen}`,
    release: named(release),
    before: named([...before].reverse()),
    after: named(after),
    popular: named(popular.filter((t) => !shown.has(t.id))).slice(0, POPULAR),
  });

  const reciterUrl = pageId ? `${SITE_URL}/reciter?id=${pageId}` : null;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name,
      url,
      inLanguage: 'ar',
      ...(artist && { byArtist: { '@type': 'Person', name: artist, ...(reciterUrl && { url: reciterUrl }) } }),
      ...(album && { inAlbum: { '@type': 'MusicAlbum', name: album } }),
      ...(isoDuration(track.duration) && { duration: isoDuration(track.duration) }),
      ...(track.image_url && { image: track.image_url }),
      ...(category && { genre: category }),
      ...(track.created_at && { datePublished: track.created_at.slice(0, 10) }),
      ...(lyrics && {
        recordingOf: { '@type': 'MusicComposition', name, lyrics: { '@type': 'CreativeWork', text: lyrics } },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
        ...(reciterUrl ? [{ '@type': 'ListItem', position: 2, name: artist, item: reciterUrl }] : []),
        { '@type': 'ListItem', position: reciterUrl ? 3 : 2, name, item: url },
      ],
    },
  ];

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
