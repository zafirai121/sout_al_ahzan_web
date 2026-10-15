// What the library upkeep scripts share (scripts/library.mjs, scripts/tidy.mjs):
// GitHub's token, /api/admin/library, the bucket and the tables, links and
// keys, words folded as the apps' search folds them, and a track's title from
// a file's name.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const SITE = 'https://web.soutalahzan.com';
export const OWN = 'https://soutalahzan.com/';
const AUDIENCE = 'soutalahzan-library';
const run = promisify(execFile);


let token = '';
let tokenAt = 0;
export async function bearer() {
  if (token && Date.now() - tokenAt < 3 * 60 * 1000) return token;
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: auth } = process.env;
  if (!url || !auth) throw new Error('no GitHub OIDC token (id-token: write needed)');
  const res = await fetch(`${url}&audience=${AUDIENCE}`, { headers: { authorization: `bearer ${auth}` } });
  if (!res.ok) throw new Error(`OIDC token: ${res.status}`);
  token = (await res.json()).value;
  tokenAt = Date.now();
  return token;
}

export async function call(body) {
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
      if (attempt >= (body.retries ?? 6)) throw Object.assign(new Error(`${body.action}: ${res.status} after retries`), { status: res.status });
      console.log(`${body.action}: ${res.status} from Cloudflare, again in 15 s`);
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    if (!res.ok) throw Object.assign(new Error(`${body.action}: ${res.status} ${text.slice(0, 600)}`), { status: res.status });
    return JSON.parse(text);
  }
}

export async function bucket() {
  const out = [];
  let cursor = null;
  do {
    const page = await call({ action: 'list', cursor });
    for (const [key, size, uploaded, etag, type] of page.objects) out.push({ key, size, uploaded, etag, type });
    cursor = page.cursor;
  } while (cursor);
  return out;
}

export async function rows(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await call({ action: 'rows', table, from });
    if (!Array.isArray(page)) throw new Error(`${table}: ${JSON.stringify(page).slice(0, 200)}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

export function keyOf(link) {
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
export const linkOf = (key) => OWN + key.split('/').map(encodeURIComponent).join('/');

export const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i;
export const IMAGE = /\.(jpe?g|png|webp)$/i;
export const stem = (key) => key.replace(/\.[a-z0-9]+$/i, '');

// Words, folded as the apps' search folds them
export const norm = (s) => String(s || '').toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/گ/g, 'ك').replace(/چ/g, 'ج').replace(/ڤ/g, 'ف').replace(/ک/g, 'ك').replace(/ی/g, 'ي');
export const STOP = new Set(['mp3', 'm4a', '320k', '128k', 'kbps', 'الرادود', 'الحاج', 'الملا', 'السيد', 'سيد', 'الشيخ', 'المنشد',
  'محرم', 'الحرام', 'ليله', 'هـ', 'م', 'جديد', 'حصريا', 'حصري', 'فيديو', 'كليب', 'official', 'video', 'audio', 'hd']);
export const words = (s) => new Set(norm(s).split(/[^\p{L}\p{N}]+/u).filter((w) => (w.length > 1 || /\d/.test(w)) && !STOP.has(w)));
export const majority = (list) => {
  const counts = new Map();
  for (const v of list) counts.set(v ?? null, (counts.get(v ?? null) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

// The reciter's name misspelt or split in the file's name ("فاقد لموسوي",
// "فاقد المو سوي"): its first word, then one or two words that, run
// together, are the rest of the name but for a letter or two
export const distance = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
};
export function looseFind(folded, parts, most = 2) {
  const words = [...folded.matchAll(/\S+/g)];
  const rest = parts.slice(1).join('').replace(/\\/g, '');
  for (let i = 0; i < words.length; i++) {
    if (words[i][0] !== parts[0].replace(/\\/g, '')) continue;
    for (let k = 1; k <= 2 && i + k < words.length; k++) {
      const joined = words.slice(i + 1, i + 1 + k).map((w) => w[0]).join('');
      if (rest.length >= 5 && distance(joined, rest) <= most) {
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
export const HONORIFIC = '(?:الرادود|رادود|الحاج|حاج|الملا|ملا|المنشد|منشد|الشيخ|شيخ|السيد|سيد|الحسيني)';
export const NOISE = /\(?\b(?:official|video|audio|hd|lyrics|mp3\s*\d*k?)\b\)?/gi;
export function titleOf(name, reciter, most = 2) {
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
    if (!m && parts.length > 1) m = looseFind(folded, parts, most);
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
  // "<reciter> وعلي الدلفي …": another reciter with them, the name stays as it is
  if (!before && /^و\S/.test(after)) return tidy(s).replace(/\s*\|\s*/g, ' - ') || name;
  const title = (!before ? (after || tidy(s) || name) : after ? `${before} - ${after}` : before)
    .replace(/\s*\|\s*/g, ' - ').replace(/(^|\s)[\u0640\s]+(?=\s|$)/g, ' ');
  const pieces = title.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  const arabic = pieces.some((p) => /\p{Script=Arabic}/u.test(p));
  return pieces.filter((p) => !(arabic && /[A-Za-z]/.test(p) && !/\p{Script=Arabic}/u.test(p)) && /[\p{L}\p{N}]/u.test(p))
    .map((p) => p.replace(/\s+[A-Za-z][A-Za-z0-9\s-]*$/, (t) => (arabic && /\p{Script=Arabic}/u.test(p) ? '' : t)).trim())
    .join(' - ') || name;
}

export async function seconds(url) {
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', url], { timeout: 60000 });
    const s = Number.parseFloat(stdout);
    return Number.isFinite(s) && s > 0 ? Math.round(s) : null;
  } catch {
    return null;
  }
}
