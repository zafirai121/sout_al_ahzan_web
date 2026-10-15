// What takes up the R2 bucket behind soutalahzan.com, and whether the apps
// show it. Lists every object (through /api/storage) and every link the
// database holds (audio_library's tracks and covers, the reciters' pictures,
// and the playlists and profiles where they can be read), then says:
//   - how much each part of the bucket holds;
//   - which files no row points to (the apps never show them), the biggest first;
//   - the same file stored more than once (same content, by ETag and size);
//   - tracks whose file is missing, or kept somewhere else;
//   - the tracks' sizes and bit rates (a large one is usually a WAV, a video
//     or a very high bit rate).
// Read only: it deletes nothing. Run by .github/workflows/storage.yml; needs a
// GitHub Actions OpenID Connect token (id-token: write). Writes storage-audit/.
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

const SITE = 'https://web.soutalahzan.com';
const SUPABASE = 'https://ckhtndmrcypkqrpjlzli.supabase.co/rest/v1';
const KEY = 'sb_publishable_8jeopxp1S7VUh8hj0B6syA_4rSIaJuN';
const AUDIENCE = 'soutalahzan-storage';
const OWN_HOSTS = new Set(['soutalahzan.com', 'www.soutalahzan.com', 'pub-8168942d67ae4c1fb48c404f11458b4a.r2.dev']);
const OUT = 'storage-audit';

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

// Every object in the bucket. The endpoint answers once Cloudflare has deployed it (a push runs this too)
async function bucket() {
  for (let attempt = 0; ; attempt++) {
    const objects = [];
    let cursor = '';
    let failed = null;
    do {
      const res = await fetch(`${SITE}/api/storage${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, {
        headers: { authorization: `Bearer ${await bearer()}` },
      });
      if (!res.ok) { failed = `${res.status} ${(await res.text()).slice(0, 200)}`; break; }
      const page = await res.json();
      for (const [key, size, uploaded, etag, type] of page.objects) objects.push({ key, size, uploaded, etag, type });
      cursor = page.cursor;
    } while (cursor);
    if (!failed) return objects;
    if (attempt >= 20) throw new Error(`/api/storage: ${failed}`);
    console.log(`/api/storage not ready (${failed}), again in 30 s`);
    await new Promise((r) => setTimeout(r, 30000));
  }
}

// A table's rows (what this public key may read; a table it may not read gives none)
async function rows(table, select = '*') {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SUPABASE}/${table}?select=${select}`, {
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, range: `${from}-${from + 999}` },
    });
    if (!res.ok) { console.log(`${table}: not readable (${res.status})`); return out; }
    const page = await res.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

// The bucket key a link points to, or null when it points elsewhere
function keyOf(link) {
  if (typeof link !== 'string' || !/^https?:\/\//.test(link)) return null;
  let url;
  try { url = new URL(link); } catch { return null; }
  if (!OWN_HOSTS.has(url.hostname)) return null;
  let path = url.pathname.slice(1);
  // Cloudflare's resizer: /cdn-cgi/image/<options>/<the image's path or URL>
  const resized = /^cdn-cgi\/image\/[^/]+\/(.+)$/.exec(path);
  if (resized) return keyOf(resized[1].startsWith('http') ? resized[1] : `https://soutalahzan.com/${resized[1]}`);
  try { path = decodeURIComponent(path); } catch { /* keep as is */ }
  return path || null;
}

const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|flac|wma|amr|3gp)$/i;
const VIDEO = /\.(mp4|webm|mkv|mov|avi)$/i;
const IMAGE = /\.(jpe?g|png|webp|gif|avif|heic)$/i;
function kindOf(o) {
  if (o.key.startsWith('thumbs/')) return 'thumb';
  if (AUDIO.test(o.key) || o.type.startsWith('audio/')) return 'audio';
  if (VIDEO.test(o.key) || o.type.startsWith('video/')) return 'video';
  if (IMAGE.test(o.key) || o.type.startsWith('image/')) return 'image';
  return 'other';
}

const GB = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;
const MB = (b) => `${(b / 1024 ** 2).toFixed(1)} MB`;
const sum = (list) => list.reduce((s, o) => s + o.size, 0);
const csv = (rowsOut) => rowsOut.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';

// A track's length in seconds, however the row keeps it (seconds, milliseconds or "m:ss")
function seconds(d) {
  if (d == null || d === '') return null;
  if (typeof d === 'number') return d > 36000 ? d / 1000 : d;
  const parts = String(d).split(':').map(Number);
  if (parts.some(Number.isNaN)) return Number(d) || null;
  return parts.reduce((s, p) => s * 60 + p, 0) || null;
}

const lines = [];
const say = (s = '') => { lines.push(s); console.log(s); };

const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
const reciters = await rows('reciters');
const playlists = await rows('user_playlists');
const profiles = await rows('profiles');

// Who points to what
const refs = new Map(); // key -> [what]
const external = [];
const point = (key, what) => { if (!refs.has(key)) refs.set(key, []); refs.get(key).push(what); };
const missing = [];
for (const t of tracks) {
  for (const [field, link] of [['file_url', t.file_url], ['image_url', t.image_url]]) {
    if (!link) continue;
    const key = keyOf(link);
    if (!key) { external.push([t.id, field, link]); continue; }
    point(key, `track ${t.id} ${field}`);
    if (!byKey.has(key)) missing.push([t.id, field, t.title, link]);
  }
}
// Any link elsewhere in the other tables (pictures, covers, avatars)
const walk = (value, label) => {
  if (typeof value === 'string') { const key = keyOf(value); if (key) point(key, label); }
  else if (Array.isArray(value)) value.forEach((v) => walk(v, label));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => walk(v, label));
};
reciters.forEach((r) => walk(r, `reciter ${r.id}`));
playlists.forEach((p) => walk(p, `playlist ${p.id}`));
profiles.forEach((p) => walk(p, `profile ${p.id}`));

// Each object: pointed to, a small copy of something, or nothing
for (const o of objects) {
  o.kind = kindOf(o);
  if (o.kind === 'thumb') {
    const source = o.key.replace(/^thumbs\/\d+\//, '');
    o.used = refs.has(source);
  } else {
    o.used = refs.has(o.key);
  }
}

const total = sum(objects);
say(`# Storage audit — ${new Date().toISOString().slice(0, 10)}`);
say();
say(`Bucket: ${objects.length} files, ${GB(total)}`);
say(`Database: ${tracks.length} tracks, ${reciters.length} reciters, ${playlists.length} playlists, ${profiles.length} profiles readable`);
say();

say('## By kind (used = some row points to it)');
for (const kind of ['audio', 'video', 'image', 'thumb', 'other']) {
  const all = objects.filter((o) => o.kind === kind);
  if (!all.length) continue;
  const used = all.filter((o) => o.used);
  say(`- ${kind}: ${all.length} files ${GB(sum(all))} | used ${used.length} ${GB(sum(used))} | unused ${all.length - used.length} ${GB(sum(all) - sum(used))}`);
}
say();

say('## By folder (first two levels)');
const folders = new Map();
for (const o of objects) {
  const parts = o.key.split('/');
  const folder = parts.length > 2 ? `${parts[0]}/${parts[1].length > 20 ? '<id>' : parts[1]}/` : parts.length > 1 ? `${parts[0]}/` : '(top)';
  const f = folders.get(folder) || { n: 0, b: 0, unusedN: 0, unusedB: 0 };
  f.n++; f.b += o.size;
  if (!o.used) { f.unusedN++; f.unusedB += o.size; }
  folders.set(folder, f);
}
for (const [folder, f] of [...folders].sort((a, b) => b[1].b - a[1].b).slice(0, 25)) {
  say(`- ${folder}: ${f.n} files ${GB(f.b)} (unused ${f.unusedN}, ${GB(f.unusedB)})`);
}
say();

const unused = objects.filter((o) => !o.used).sort((a, b) => b.size - a.size);
say(`## Files no row points to: ${unused.length}, ${GB(sum(unused))} (the apps never show these)`);
const unusedByMonth = new Map();
for (const o of unused) { const m = o.uploaded.slice(0, 7); unusedByMonth.set(m, (unusedByMonth.get(m) || 0) + o.size); }
say(`- by month uploaded: ${[...unusedByMonth].sort().map(([m, b]) => `${m} ${GB(b)}`).join(' · ')}`);
say('- the biggest:');
for (const o of unused.slice(0, 25)) say(`  - ${MB(o.size)}  ${o.uploaded}  ${o.type || '?'}  ${o.key}`);
say();

// The same content more than once (ETag + size; a file put in parts has an ETag with "-N", compared as is)
const groups = new Map();
for (const o of objects) {
  if (o.kind === 'thumb' || o.size < 100 * 1024) continue;
  const id = `${o.etag}:${o.size}`;
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(o);
}
const dupes = [...groups.values()].filter((g) => g.length > 1).sort((a, b) => b[0].size * b.length - a[0].size * a.length);
const wasted = dupes.reduce((s, g) => s + g[0].size * (g.length - 1), 0);
say(`## The same file stored more than once: ${dupes.length} groups, ${GB(wasted)} in extra copies`);
for (const g of dupes.slice(0, 15)) {
  say(`- ${g.length} × ${MB(g[0].size)}: ${g.map((o) => `${o.key}${o.used ? ' (used)' : ''}`).join(' | ')}`);
}
say();

say(`## Tracks whose file or cover is missing from the bucket: ${missing.length}`);
for (const m of missing.slice(0, 20)) say(`- track ${m[0]} ${m[1]}: ${m[2]} → ${m[3]}`);
const externalAudio = external.filter((e) => e[1] === 'file_url');
say(`## Links kept elsewhere: ${external.length} (${externalAudio.length} of them tracks' audio)`);
const hosts = new Map();
for (const e of external) { let h = '?'; try { h = new URL(e[2]).hostname; } catch { /* not a URL */ } hosts.set(h, (hosts.get(h) || 0) + 1); }
say(`- hosts: ${[...hosts].map(([h, n]) => `${h} ${n}`).join(' · ')}`);
say();

// The tracks' own files: sizes and bit rates
const trackFiles = tracks.map((t) => ({ t, o: byKey.get(keyOf(t.file_url)) })).filter((x) => x.o);
const sizes = trackFiles.map((x) => x.o.size).sort((a, b) => a - b);
const pct = (p) => sizes[Math.min(sizes.length - 1, Math.floor((p / 100) * sizes.length))] || 0;
say(`## The tracks' audio: ${trackFiles.length} files, ${GB(sum(trackFiles.map((x) => x.o)))}`);
say(`- size: median ${MB(pct(50))}, 90% under ${MB(pct(90))}, 99% under ${MB(pct(99))}, biggest ${MB(sizes[sizes.length - 1] || 0)}`);
const types = new Map();
for (const { o } of trackFiles) {
  const ext = (/\.([a-z0-9]+)$/i.exec(o.key)?.[1] || o.type || '?').toLowerCase();
  const tt = types.get(ext) || { n: 0, b: 0 };
  tt.n++; tt.b += o.size; types.set(ext, tt);
}
say(`- by format: ${[...types].sort((a, b) => b[1].b - a[1].b).map(([e, v]) => `${e} ${v.n} (${GB(v.b)})`).join(' · ')}`);
const rates = trackFiles.map(({ t, o }) => ({ t, o, s: seconds(t.duration) })).filter((x) => x.s > 10).map((x) => ({ ...x, kbps: (x.o.size * 8) / x.s / 1000 }));
if (rates.length) {
  const bands = [[0, 96], [96, 160], [160, 256], [256, 400], [400, 1e9]];
  say(`- bit rate (${rates.length} with a length): ${bands.map(([a, b]) => {
    const inBand = rates.filter((r) => r.kbps >= a && r.kbps < b);
    return `${a}-${b < 1e9 ? b : '∞'} kbps: ${inBand.length} (${GB(sum(inBand.map((r) => r.o)))})`;
  }).join(' · ')}`);
}
say('- the biggest tracks:');
for (const { t, o } of trackFiles.sort((a, b) => b.o.size - a.o.size).slice(0, 15)) {
  const s = seconds(t.duration);
  say(`  - ${MB(o.size)}  ${s ? `${Math.round(s / 60)} min, ${Math.round((o.size * 8) / s / 1000)} kbps` : 'length ?'}  track ${t.id} ${t.title || ''}  (${o.key})`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/report.md`, `${lines.join('\n')}\n`);
writeFileSync(`${OUT}/unused.csv`, csv([['key', 'bytes', 'uploaded', 'type', 'kind'], ...unused.map((o) => [o.key, o.size, o.uploaded, o.type, o.kind])]));
writeFileSync(`${OUT}/duplicates.csv`, csv([['group', 'key', 'bytes', 'used'], ...dupes.flatMap((g, i) => g.map((o) => [i + 1, o.key, o.size, o.used]))]));
writeFileSync(`${OUT}/missing.csv`, csv([['track', 'field', 'title', 'link'], ...missing]));
writeFileSync(`${OUT}/tracks.csv`, csv([['track', 'title', 'bytes', 'seconds', 'key'], ...trackFiles.map(({ t, o }) => [t.id, t.title, o.size, seconds(t.duration), o.key])]));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
