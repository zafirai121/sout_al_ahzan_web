// Makes the small copy of every cover on soutalahzan.com that has none yet
// (WebP, shorter side 640 px, never enlarged) and stores it beside the cover
// through /api/thumbs. Run by .github/workflows/thumbs.yml; needs sharp and a
// GitHub Actions OpenID Connect token (id-token: write).
import sharp from 'sharp';

const SITE = 'https://web.soutalahzan.com';
const OWN = 'https://soutalahzan.com/';
const SUPABASE = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1';
const KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const AUDIENCE = 'soutalahzan-thumbs';
const SIDE = 640;
const QUALITY = 82;
const AT_ONCE = 6;

// GitHub's token lasts minutes: a fresh one every three
let token = '';
let tokenAt = 0;
async function bearer() {
  if (token && Date.now() - tokenAt < 3 * 60 * 1000) return token;
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: auth } = process.env;
  if (!url || !auth) throw new Error('no GitHub OIDC token (id-token: write needed)');
  const res = await fetch(`${url}&audience=${AUDIENCE}`, { headers: { authorization: `bearer ${auth}` } });
  if (!res.ok) throw new Error(`OIDC token: ${res.status}`);
  token = (await res.json()).value;
  tokenAt = Date.now();
  return token;
}

async function rows(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SUPABASE}/${table}?select=image_url&order=id.asc`, {
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const page = await res.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

// Our covers, each once, as fetchable (percent-encoded) URLs, with their keys
function ourCovers(links) {
  const covers = new Map();
  for (const link of links) {
    if (typeof link !== 'string' || !link.startsWith(OWN)) continue;
    let url;
    try { url = new URL(link); } catch { continue; }
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!key || key.startsWith('thumbs/') || key.startsWith('cdn-cgi/')) continue;
    covers.set(key, url.href);
  }
  return covers;
}

// The endpoint answers once Cloudflare has deployed it (a push runs this too)
async function existing() {
  for (let attempt = 0; ; attempt++) {
    const keys = new Set();
    let cursor = '';
    let res;
    do {
      res = await fetch(`${SITE}/api/thumbs${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { headers: { authorization: `Bearer ${await bearer()}` } });
      if (!res.ok) break;
      const page = await res.json();
      page.keys.forEach((k) => keys.add(k));
      cursor = page.cursor || '';
    } while (cursor);
    if (res.ok) return keys;
    if (attempt >= 20) throw new Error(`/api/thumbs: ${res.status} ${await res.text()}`);
    console.log(`/api/thumbs not ready (${res.status}), waiting for the deploy…`);
    await new Promise((r) => setTimeout(r, 30000));
  }
}

const links = [...(await rows('audio_library')), ...(await rows('reciters'))].map((r) => r.image_url);
const covers = ourCovers(links);
const done = await existing();
const todo = [...covers].filter(([key]) => !done.has(key));
console.log(`${covers.size} covers, ${done.size} small copies already, ${todo.length} to make`);

const result = { made: 0, missing: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 };
const failures = [];
async function make([key, url]) {
  const res = await fetch(url);
  if (res.status === 404) { result.missing++; return; }
  if (!res.ok) throw new Error(`cover ${res.status}`);
  const original = Buffer.from(await res.arrayBuffer());
  const small = await sharp(original, { failOn: 'none' })
    .rotate()
    .resize({ width: SIDE, height: SIDE, fit: 'outside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  const put = await fetch(`${SITE}/api/thumbs?for=${encodeURIComponent(url)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await bearer()}`, 'content-type': 'image/webp' },
    body: small,
  });
  if (!put.ok) throw new Error(`store ${put.status} ${(await put.text()).slice(0, 120)}`);
  result.made++;
  result.bytesBefore += original.length;
  result.bytesAfter += small.length;
}
let next = 0;
await Promise.all(Array.from({ length: AT_ONCE }, async () => {
  while (next < todo.length) {
    const item = todo[next++];
    try {
      await make(item);
    } catch (e) {
      try { await make(item); } catch (again) { result.failed++; failures.push(`${item[0]}: ${again.message}`); }
    }
    const n = result.made + result.missing + result.failed;
    if (n % 200 === 0) console.log(`${n} / ${todo.length}`);
  }
}));
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`made ${result.made} (${mb(result.bytesBefore)} MB of covers → ${mb(result.bytesAfter)} MB), covers missing ${result.missing}, failed ${result.failed}`);
failures.slice(0, 30).forEach((f) => console.log('  ' + f));
if (result.failed > Math.max(10, todo.length * 0.05)) process.exit(1);
