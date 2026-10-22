// Tells the search engines that use IndexNow (Bing, and through it DuckDuckGo
// and Yahoo; Yandex, Seznam, Naver) which pages of the site are new, so they
// read them at once instead of waiting their turn. Google does not use it: it
// reads the sitemap (functions/sitemap.xml.js). Run by .github/workflows/indexnow.yml.
//   MODE=all     every track and reciter page, and the main pages
//   MODE=recent  the tracks and reciters added in the last two days (the default)
// The key is public by design: IndexNow checks that the site itself serves it
// (public/<key>.txt), which proves the pages are ours to announce.

const SITE = 'https://web.soutalahzan.com';
const HOST = 'web.soutalahzan.com';
const KEY = 'a07f0aef38e705dfe655d6f23d906712';
const SUPABASE = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const MODE = process.env.MODE === 'all' ? 'all' : 'recent';
const AT_ONCE = 10000; // IndexNow takes up to 10,000 addresses in one request

async function ids(table, since) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const filter = since ? `&created_at=gte.${since}` : '';
    const res = await fetch(`${SUPABASE}/${table}?select=id${filter}&order=id.asc`, {
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const page = await res.json();
    out.push(...page.map((r) => r.id));
    if (page.length < 1000) return out;
  }
}

const keyLocation = `${SITE}/${KEY}.txt`;
const served = await fetch(keyLocation).then((r) => (r.ok ? r.text() : ''), () => '');
if (served.trim() !== KEY) throw new Error(`the site does not serve the key yet (${keyLocation}): deployed?`);

const since = MODE === 'all' ? null : new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
const [tracks, reciters] = await Promise.all([ids('audio_library', since), ids('reciters', since)]);
const urls = [
  ...(MODE === 'all' ? [`${SITE}/`, `${SITE}/explore`, `${SITE}/recent`] : []),
  ...reciters.map((id) => `${SITE}/reciter?id=${id}`),
  ...tracks.map((id) => `${SITE}/track?id=${id}`),
];
console.log(`${MODE}: ${tracks.length} tracks, ${reciters.length} reciters, ${urls.length} addresses`);
if (!urls.length) process.exit(0);

for (let i = 0; i < urls.length; i += AT_ONCE) {
  const urlList = urls.slice(i, i + AT_ONCE);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation, urlList }),
  });
  // 200: received; 202: received, the key still being checked
  console.log(`${i + 1}–${i + urlList.length}: ${res.status} ${await res.text().catch(() => '')}`.trim());
  if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
}
