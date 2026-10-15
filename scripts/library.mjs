// Library upkeep (run by .github/workflows/library.yml; MODE = plan | import | delete):
//
//   plan    says what import and delete would do, and changes nothing
//   import  adds a track for each song file in the bucket that no track points to
//           (the reciters' folders, not people's uploads), when the app has no
//           track of that title by that reciter yet: the title from the file's
//           name, the reciter, category and owner as that folder's tracks have
//           them, the cover beside it (same name), the length measured (ffprobe)
//   delete  removes the tracks whose file is gone from the bucket, and the
//           uploads that never became a track (people's audio files that no
//           track points to, older than two days, with the cover sent with
//           each; nothing else of theirs)
//
// Through /api/admin/library, which checks again what makes each step safe.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const SITE = 'https://web.soutalahzan.com';
const OWN = 'https://soutalahzan.com/';
const AUDIENCE = 'soutalahzan-library';
const MODE = process.env.MODE || 'plan';
const run = promisify(execFile);

// Folders whose tracks are not in the app yet: who the reciter is (their name as the reciters table has it)
const FOLDER_RECITER = {
  'MustafaAl-Sudani': 'مصطفى السوداني',
};

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

async function call(body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${SITE}/api/admin/library`, {
      method: 'POST',
      headers: { authorization: `Bearer ${await bearer()}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Not deployed yet (a push runs this too): wait for Cloudflare
    if (res.status === 404 || res.status === 405) {
      if (attempt >= 20) throw new Error(`/api/admin/library: ${res.status}`);
      console.log(`/api/admin/library not ready (${res.status}), again in 30 s`);
      await new Promise((r) => setTimeout(r, 30000));
      continue;
    }
    const text = await res.text();
    // Cloudflare's own errors (502, 503, 520–524): a moment, then again (each action is safe to send twice)
    if ((res.status === 502 && text.startsWith('<')) || res.status === 503 || (res.status >= 520 && res.status <= 524)) {
      if (attempt >= 6) throw new Error(`${body.action}: ${res.status} after retries`);
      console.log(`${body.action}: ${res.status} from Cloudflare, again in 15 s`);
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    if (!res.ok) throw new Error(`${body.action}: ${res.status} ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
}

async function bucket() {
  const out = [];
  let cursor = null;
  do {
    const page = await call({ action: 'list', cursor });
    for (const [key, size, uploaded, etag, type] of page.objects) out.push({ key, size, uploaded, etag, type });
    cursor = page.cursor;
  } while (cursor);
  return out;
}

async function rows(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await call({ action: 'rows', table, from });
    if (!Array.isArray(page)) throw new Error(`${table}: ${JSON.stringify(page).slice(0, 200)}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

function keyOf(link) {
  if (typeof link !== 'string' || !/^https?:\/\//.test(link)) return null;
  let url;
  try { url = new URL(link); } catch { return null; }
  if (!['soutalahzan.com', 'www.soutalahzan.com', 'pub-8168942d67ae4c1fb48c404f11458b4a.r2.dev'].includes(url.hostname)) return null;
  let path = url.pathname.slice(1);
  const resized = /^cdn-cgi\/image\/[^/]+\/(.+)$/.exec(path);
  if (resized) return keyOf(resized[1].startsWith('http') ? resized[1] : `${OWN}${resized[1]}`);
  try { path = decodeURIComponent(path); } catch { /* as is */ }
  return path || null;
}
// A key as a link, each part percent-encoded (Arabic, spaces, ｜)
const linkOf = (key) => OWN + key.split('/').map(encodeURIComponent).join('/');

const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i;
const IMAGE = /\.(jpe?g|png|webp)$/i;
const stem = (key) => key.replace(/\.[a-z0-9]+$/i, '');

// Words, folded as the apps' search folds them
const norm = (s) => String(s || '').toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/گ/g, 'ك').replace(/چ/g, 'ج').replace(/ڤ/g, 'ف').replace(/ک/g, 'ك').replace(/ی/g, 'ي');
const STOP = new Set(['mp3', 'm4a', '320k', '128k', 'kbps', 'الرادود', 'الحاج', 'الملا', 'السيد', 'سيد', 'الشيخ', 'المنشد',
  'محرم', 'الحرام', 'ليله', 'هـ', 'م', 'جديد', 'حصريا', 'حصري', 'فيديو', 'كليب', 'official', 'video', 'audio', 'hd']);
const words = (s) => new Set(norm(s).split(/[^\p{L}\p{N}]+/u).filter((w) => (w.length > 1 || /\d/.test(w)) && !STOP.has(w)));
const majority = (list) => {
  const counts = new Map();
  for (const v of list) counts.set(v ?? null, (counts.get(v ?? null) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

// The reciter's name misspelt or split in the file's name ("فاقد لموسوي",
// "فاقد المو سوي"): its first word, then one or two words that, run
// together, are the rest of the name but for a letter or two
const distance = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
};
function looseFind(folded, parts) {
  const words = [...folded.matchAll(/\S+/g)];
  const rest = parts.slice(1).join('').replace(/\\/g, '');
  for (let i = 0; i < words.length; i++) {
    if (words[i][0] !== parts[0].replace(/\\/g, '')) continue;
    for (let k = 1; k <= 2 && i + k < words.length; k++) {
      const joined = words.slice(i + 1, i + 1 + k).map((w) => w[0]).join('');
      if (distance(joined, rest) <= 2) {
        const end = words[i + k].index + words[i + k][0].length;
        return { index: words[i].index, 0: folded.slice(words[i].index, end) };
      }
    }
  }
  return null;
}

// A track's title from its file's name: what comes before the reciter's name,
// and what comes after it (the night, the year) kept after a dash. The
// reciter's title (الرادود، الحاج، الملا، سيد…) goes only where it stands
// against their name: "سيد أمتهم" keeps its word.
const HONORIFIC = '(?:الرادود|رادود|الحاج|حاج|الملا|ملا|المنشد|منشد|الشيخ|شيخ|السيد|سيد)';
const NOISE = /\(?\b(?:official|video|audio|hd|lyrics|mp3\s*\d*k?)\b\)?/gi;
function titleOf(name, reciter) {
  let s = name.replace(/\.[a-z0-9]+$/i, '').replace(/_+/g, ' ').replace(/[｜|]/g, ' | ').replace(/\s+l{1,2}\s+/gi, ' | ')
    .replace(/\s+/g, ' ').trim();
  s = s.replace(/MP3\s*\d+K?\s*\)?$/i, '').replace(/\(\s*$/, '').trim();
  let before = s;
  let after = '';
  if (reciter) {
    // the reciter's name, letters folded on both sides (marks dropped), mapped back to the name's own letters
    const parts = reciter.split(/\s+/).filter((p) => !new RegExp(`^${HONORIFIC}$`).test(p)).map((p) => norm(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let folded = '';
    const at = [];
    [...s].forEach((c, i) => { const f = norm(c); for (const ch of f) { folded += ch; at.push(i); } });
    const chars = [...s];
    let m = new RegExp(parts.join('\\s+')).exec(folded);
    if (!m && parts.length > 1) m = looseFind(folded, parts);
    if (m) {
      const start = at[[...folded.slice(0, m.index)].length];
      const end = at[[...folded.slice(0, m.index + m[0].length)].length - 1] + 1;
      before = chars.slice(0, start).join('').replace(new RegExp(`(?:\\s|^)(?:${HONORIFIC}\\s*)+$`), ' ');
      after = chars.slice(end).join('').replace(new RegExp(`^\\s*(?:${HONORIFIC}(?:\\s|$))+`), ' ');
    }
  }
  const tidy = (t) => t.replace(NOISE, ' ').replace(/\(\s*\)/g, ' ').replace(/^[\s|\-–—:،,.]+|[\s|\-–—:،,.]+$/g, '').replace(/\s+/g, ' ').trim();
  before = tidy(before);
  after = tidy(after);
  const title = (!before ? (after || tidy(s) || name) : after ? `${before} - ${after}` : before)
    .replace(/\s*\|\s*/g, ' - ').replace(/(^|\s)[\u0640\s]+(?=\s|$)/g, ' ');
  const pieces = title.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  const arabic = pieces.some((p) => /\p{Script=Arabic}/u.test(p));
  return pieces.filter((p) => !(arabic && /[A-Za-z]/.test(p) && !/\p{Script=Arabic}/u.test(p)) && /[\p{L}\p{N}]/u.test(p))
    .map((p) => p.replace(/\s+[A-Za-z][A-Za-z\s-]*$/, (t) => (arabic && /\p{Script=Arabic}/u.test(p) ? '' : t)).trim())
    .join(' - ') || name;
}

async function seconds(url) {
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', url], { timeout: 60000 });
    const s = Number.parseFloat(stdout);
    return Number.isFinite(s) && s > 0 ? Math.round(s) : null;
  } catch {
    return null;
  }
}

// ─── What is there ───────────────────────────────────────────────────────────
const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
const reciters = await rows('reciters');
const profiles = await rows('profiles').catch(() => []);
const playlists = await rows('user_playlists').catch(() => []);
console.log(`bucket ${objects.length} objects · ${tracks.length} tracks · ${reciters.length} reciters · ${profiles.length} profiles · ${playlists.length} playlists`);

const used = new Set();
const walk = (v) => {
  if (typeof v === 'string') { const k = keyOf(v); if (k) used.add(k); }
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
tracks.forEach(walk); reciters.forEach(walk); profiles.forEach(walk); playlists.forEach(walk);

// How the tracks keep their length (seconds as a number, or text)
const durations = tracks.map((t) => t.duration).filter((d) => d != null);
const durationAsText = durations.filter((d) => typeof d === 'string').length > durations.length / 2;
console.log(`durations: ${durations.length} of ${tracks.length} tracks have one; e.g. ${JSON.stringify(durations.slice(0, 6))}`);
const categories = majority(tracks.map((t) => t.category));
console.log(`categories: ${[...new Set(tracks.map((t) => t.category))].slice(0, 20).join(' · ')}`);

// ─── Import: songs in the reciters' folders that no track points to ──────────
const folderOf = (key) => key.split('/')[0];
const byFolder = new Map();
for (const t of tracks) {
  const key = keyOf(t.file_url);
  if (!key || key.startsWith('user_uploads/')) continue;
  const f = folderOf(key);
  if (!byFolder.has(f)) byFolder.set(f, []);
  byFolder.get(f).push(t);
}
const recByName = new Map(reciters.map((r) => [norm(r.name).replace(/\s+/g, ' ').trim(), r]));
function profileOf(folder) {
  const own = byFolder.get(folder) || [];
  if (own.length) {
    const name = majority(own.map((t) => t.reciter_name));
    const coverBeside = own.filter((t) => { const c = keyOf(t.image_url); return c && stem(c) === stem(keyOf(t.file_url)); }).length;
    return {
      reciter_name: name,
      reciter_id: majority(own.filter((t) => t.reciter_name === name).map((t) => t.reciter_id)),
      category: majority(own.map((t) => t.category)),
      user_id: majority(own.map((t) => t.user_id)),
      from: `${own.length} tracks of the folder (${coverBeside} with the cover beside the file)`,
    };
  }
  const name = FOLDER_RECITER[folder];
  if (!name) return null;
  const rec = recByName.get(norm(name).replace(/\s+/g, ' ').trim());
  const theirs = tracks.filter((t) => t.reciter_name === name);
  return {
    reciter_name: rec?.name || name,
    reciter_id: rec?.id ?? null,
    category: majority(theirs.map((t) => t.category)) ?? categories,
    user_id: majority(tracks.filter((t) => !keyOf(t.file_url)?.startsWith('user_uploads/')).map((t) => t.user_id)),
    from: rec ? `the reciters table (id ${rec.id})` : 'FOLDER_RECITER (not in the reciters table)',
  };
}

const titledBy = new Map(); // reciter -> folded titles of their tracks
for (const t of tracks) {
  const r = t.reciter_name || '';
  if (!titledBy.has(r)) titledBy.set(r, []);
  titledBy.get(r).push(words(t.title));
}
const reciterWords = new Set([...reciters.map((r) => r.name), ...tracks.map((t) => t.reciter_name)].flatMap((n) => [...words(n)]));
// The app already has it: a track of this reciter whose title's own words are (nearly) all in this title's
function inApp(title, reciter) {
  const tw = new Set([...words(title)].filter((w) => !reciterWords.has(w)));
  if (!tw.size) return false;
  return (titledBy.get(reciter) || []).some((w0) => {
    const w = new Set([...w0].filter((x) => !reciterWords.has(x)));
    if (!w.size) return false;
    let common = 0;
    for (const x of w) if (tw.has(x)) common++;
    return common / w.size >= 0.8 && common / tw.size >= 0.5;
  });
}

const coverOf = new Map(objects.filter((c) => IMAGE.test(c.key)).map((c) => [stem(c.key), c]));
const profiles_ = new Map();
const folderProfile = (f) => { if (!profiles_.has(f)) profiles_.set(f, profileOf(f)); return profiles_.get(f); };
const plan = [];
const skipped = { noReciter: new Map(), inApp: [], twice: [] };
const seenTitles = new Set();
for (const o of objects) {
  if (!AUDIO.test(o.key) || used.has(o.key)) continue;
  const folder = folderOf(o.key);
  if (folder === 'user_uploads' || folder === 'thumbs' || !o.key.includes('/')) continue;
  const p = folderProfile(folder);
  if (!p) { skipped.noReciter.set(folder, (skipped.noReciter.get(folder) || 0) + 1); continue; }
  const name = o.key.split('/').pop();
  const title = titleOf(name, p.reciter_name);
  if (inApp(title, p.reciter_name)) { skipped.inApp.push(`${o.key} ≈ a track of ${p.reciter_name}`); continue; }
  const id = `${p.reciter_name}|${[...words(title)].sort().join(' ')}`;
  if (seenTitles.has(id)) { skipped.twice.push(o.key); continue; }
  seenTitles.add(id);
  const cover = coverOf.get(stem(o.key));
  plan.push({ o, folder, row: {
    title, file_name: name, reciter_name: p.reciter_name, reciter_id: p.reciter_id, category: p.category, user_id: p.user_id,
    file_url: linkOf(o.key), image_url: cover ? linkOf(cover.key) : null,
  } });
}

// ─── Delete: tracks whose file is gone; uploads that never became a track ────
const broken = tracks.filter((t) => { const k = keyOf(t.file_url); return k && !byKey.has(k); });
const old = (o) => Date.now() - Date.parse(o.uploaded) > 2 * 24 * 60 * 60 * 1000;
const deadAudio = objects.filter((o) => o.key.startsWith('user_uploads/') && AUDIO.test(o.key) && !used.has(o.key) && old(o));
const deadStems = new Set(deadAudio.map((o) => o.key.replace(/\/audio_([^/]+)\.[a-z0-9]+$/i, '/$1')));
const deadCovers = objects.filter((o) => o.key.startsWith('user_uploads/') && IMAGE.test(o.key) && !used.has(o.key) && old(o)
  && deadStems.has(o.key.replace(/\/image_([^/]+)\.[a-z0-9]+$/i, '/$1')));
const MB = (b) => `${(b / 1024 ** 2).toFixed(1)} MB`;
const GB = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;

console.log('\n# Plan');
console.log(`\n## Import: ${plan.length} songs, ${GB(plan.reduce((s, x) => s + x.o.size, 0))}`);
const perFolder = new Map();
for (const x of plan) perFolder.set(x.folder, (perFolder.get(x.folder) || 0) + 1);
for (const [folder, n] of perFolder) {
  const p = folderProfile(folder);
  const withCover = plan.filter((x) => x.folder === folder && x.row.image_url).length;
  console.log(`- ${folder}: ${n} songs (${withCover} with a cover) → reciter «${p.reciter_name}» (id ${p.reciter_id}), category «${p.category}», owner ${p.user_id}; from ${p.from}`);
}
console.log(`- left out: ${skipped.inApp.length} the app already has, ${skipped.twice.length} the same song twice, ${[...skipped.noReciter].map(([f, n]) => `${n} in ${f}/ (no reciter known)`).join(', ') || 'none without a reciter'}`);
for (const s of skipped.inApp.slice(0, 10)) console.log(`  - already: ${s}`);
for (const s of skipped.twice.slice(0, 5)) console.log(`  - twice: ${s}`);
console.log('- titles, e.g.:');
for (const x of plan.filter((_, i) => i % Math.max(1, Math.floor(plan.length / 40)) === 0).slice(0, 40)) {
  console.log(`  - «${x.row.title}»  ←  ${x.row.file_name}${x.row.image_url ? '' : '  (no cover)'}`);
}
console.log(`\n## Delete: ${broken.length} tracks whose file is gone`);
for (const t of broken) console.log(`- track ${t.id} «${t.title}» (${t.reciter_name})`);
console.log(`## Delete: ${deadAudio.length} uploads that never became a track (${GB(deadAudio.reduce((s, o) => s + o.size, 0))}), with ${deadCovers.length} covers sent with them`);
for (const o of deadAudio.slice(0, 10)) console.log(`- ${MB(o.size)} ${o.uploaded.slice(0, 10)} ${o.key}`);

// ─── Do it ───────────────────────────────────────────────────────────────────
if (MODE === 'import') {
  console.log(`\n# Importing ${plan.length} songs`);
  let done = 0;
  for (let i = 0; i < plan.length; i += 10) {
    const batch = plan.slice(i, i + 10);
    await Promise.all(batch.map(async (x) => {
      const s = await seconds(x.row.file_url);
      if (s != null) x.row.duration = durationAsText ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s;
    }));
    const res = await call({ action: 'insert', rows: batch.map((x) => x.row) });
    done += res.inserted.length + res.already.length;
    console.log(`${done}/${plan.length} added (last: ${res.inserted.at(-1)?.id} «${res.inserted.at(-1)?.title}»)`);
  }
  console.log(`Imported ${done} songs.`);
}

if (MODE === 'delete') {
  console.log('\n# Deleting');
  for (let i = 0; i < broken.length; i += 20) {
    const res = await call({ action: 'delete-tracks', ids: broken.slice(i, i + 20).map((t) => t.id) });
    console.log(`tracks deleted: ${res.deleted.join(', ') || 'none'}; kept: ${res.kept.join(', ') || 'none'}`);
  }
  const keys = [...deadAudio, ...deadCovers].map((o) => o.key);
  let deleted = 0;
  const kept = [];
  for (let i = 0; i < keys.length; i += 12) {
    const res = await call({ action: 'delete-uploads', keys: keys.slice(i, i + 12) });
    deleted += res.deleted.length;
    kept.push(...res.kept);
  }
  console.log(`uploads deleted: ${deleted}; kept: ${kept.length}`);
  for (const [k, why] of kept.slice(0, 20)) console.log(`- kept ${k}: ${why}`);
}
