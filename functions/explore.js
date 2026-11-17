// /explore?type=recent|popular|reciters: one static page for all three, drawn
// in the browser, so without this each had the same HTML and no canonical
// (Search Console: "duplicate without user-selected canonical"). Each kind gets
// its own title, description and canonical, and what it lists as links in its
// HTML (the newest or most listened tracks, every reciter), as the track and
// reciter pages have.
import { SITE_URL, SITE_NAME, query, withSeo } from '../cloudflare/seo.js';
import { EXPLORE, exploreContent, exploreKind } from '../cloudflare/seo-pages.js';
import { shownTitle } from '../cloudflare/titles.js';

const TRACKS = 100;
const HOUR = 3600;
// A name some uploads were filed under, not a reciter (as the page leaves it out)
const NOT_A_RECITER = 'مجهول';

function itemsOf(kind) {
  if (kind === 'reciters') {
    return query(`reciters?select=id,name&name=neq.${encodeURIComponent(NOT_A_RECITER)}&order=name`, HOUR)
      .then((rows) => rows.filter((r) => r.name?.trim()).map((r) => ({ id: r.id, name: r.name.trim() })));
  }
  const order = kind === 'popular' ? 'listen_count.desc.nullslast,id.desc' : 'id.desc';
  return query(`audio_library?select=id,title,reciter_name&order=${order}&limit=${TRACKS}`, HOUR)
    .then((rows) => rows.map((t) => {
      const artist = (t.reciter_name || '').trim();
      return { id: t.id, name: shownTitle(t.title || 'قصيدة', artist) || 'قصيدة', artist };
    }));
}

export async function onRequestGet({ request, next }) {
  const kind = exploreKind(new URL(request.url).searchParams.get('type'));
  const [response, items] = await Promise.all([next(), itemsOf(kind).catch(() => null)]);
  if (!response.headers.get('content-type')?.includes('text/html')) return response;

  const { title, lead } = EXPLORE[kind];
  const url = `${SITE_URL}/explore?type=${kind}`;
  return withSeo(response, {
    title: `${title} | ${SITE_NAME}`,
    description: `${lead} استمع على منصة ${SITE_NAME} بجودة عالية وبدون إعلانات.`,
    url,
    type: 'website',
    // Without the list when the database did not answer: the title and canonical still tell the kinds apart
    content: items ? exploreContent({ kind, items }) : undefined,
  });
}
