// A reciter's albums (releases) from shiavoice.com's lists, matched to the
// library's tracks (run by .github/workflows/library.yml):
//
//   albums-probe  shows the pages named (FILES, | between; shiavoice.com only)
//                 as they are made: their title, links and the site's rules
//                 for robots, so the reading can be written to them
//   albums-plan   reads the reciter's releases (RECITER: their page's name on
//                 the site, e.g. basim-karbalaei; TITLES: their name in the
//                 library) and each release's tracks, and matches them to the
//                 library's tracks of that reciter: by the words of the title,
//                 and the length when both have one. Says, for each release,
//                 the tracks the library has and those it has not, and the
//                 library's tracks no release has. Changes nothing. FILES "cats"
//                 reads the reciter's collections instead (/@RECITER-cats: an
//                 occasion and its year, "الأيام الفاطمية 1448 هـ")
//   albums-library   only writes the library's tracks of TITLES (the reciter's
//                 name in the library) as they are stored, to match them by hand
//   albums-write-plan / albums-write   gives the reciter's tracks the albums of
//                 scripts/albums/RECITER.json ({ reciter, albums: [{ name, ids }] }:
//                 the name in the library, and each album's tracks); their other
//                 tracks none. The plan only says what would change; each
//                 change keeps the albums as they were in the bucket first
//
// Only the lists are read (names of releases and of their tracks), slowly,
// never the audio.
import fs from 'node:fs';
import { call, rows, words } from './upkeep.mjs';

const MODE = process.env.MODE || 'albums-probe';
const FILES = (process.env.FILES || '').split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
const UA = 'SawtAlahzanLibrary/1.0 (+https://soutalahzan.com)';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } });
  return { status: res.status, html: await res.text() };
}
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

if (MODE === 'albums-probe') {
  const robots = await page('https://shiavoice.com/robots.txt').catch((e) => ({ status: 0, html: String(e) }));
  console.log(`## robots.txt (${robots.status})\n${robots.html.slice(0, 1500)}`);
  for (const url of FILES) {
    if (!/^https:\/\/(www\.)?shiavoice\.com\//.test(url)) { console.log(`\n## ${url}: not shiavoice.com, left`); continue; }
    await pause(1500);
    const { status, html } = await page(url);
    console.log(`\n## ${url} (${status}, ${html.length} bytes)`);
    console.log(`title: ${text((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '')}`);
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, href, inner]) => [href, text(inner)]).filter(([href, t]) => t && /cat-|play-|page|p=|@/.test(href));
    console.log(`links (${links.length}):`);
    for (const [href, t] of links.slice(0, 120)) console.log(`- ${href} | ${t.slice(0, 90)}`);
    // Lengths written as m:ss near the tracks
    const times = [...html.matchAll(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g)].length;
    console.log(`times on the page: ${times}`);
    // The markup around the first link to another list, and around the pages' numbers
    const sub = html.search(/href="\/cat-(?!70")\d+"/);
    if (sub > 0) console.log(`around the first list link:\n${html.slice(Math.max(0, sub - 900), sub + 500)}`);
    const pages = html.search(/\/page-2"/);
    if (pages > 0) console.log(`around the pages:\n${html.slice(Math.max(0, pages - 400), pages + 300)}`);
    // A piece of the markup around the first track link, to see how a track is written
    const at = html.search(/href="[^"]*play-/);
    if (at > 0) console.log(`around the first track:\n${html.slice(Math.max(0, at - 600), at + 900)}`);
  }
}

// ─── The releases and their tracks ────────────────────────────────────────────
const attr = (s) => s.replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&amp;/g, '&').trim();
const seconds = (d) => { if (!d) return null; const p = String(d).split(':').map(Number); return p.some(Number.isNaN) ? null : p.reduce((a, x) => a * 60 + x, 0); };

// Every page of a list (/x, /x/page-2…), as long as a page brings something new
async function allPages(path, read) {
  const out = [];
  const seen = new Set();
  for (let n = 1; n <= 40; n++) {
    await pause(1200);
    const { status, html } = await page(`https://shiavoice.com${path}${n > 1 ? `/page-${n}` : ''}`);
    if (status !== 200) break;
    // (each row may be written twice on a page: once for the phone, once for the computer)
    const found = read(html).filter((x) => !seen.has(x.key) && seen.add(x.key));
    if (!found.length) break;
    out.push(...found);
    if (!html.includes(`${path}/page-${n + 1}"`)) break;
  }
  return out;
}

// What a track's row says of it, for the reports
const kept = ({ id, title, duration, category, album, created_at: at, file_url: file }) => ({ id, title, duration, category, album, at, file });

// A release card: <a href="/cat-ID" title="إصدار NAME">
const readReleases = (html) => [...html.matchAll(/release-card[\s\S]*?<a href="\/cat-(\d+)" title="([^"]+)"/g)]
  .map(([, id, title]) => ({ key: id, id, name: attr(title).replace(/^إصدار\s+/, '') }));
// The release's own tracks (not the side lists): the rows inside "category-tracks"
function readTracks(html) {
  const from = html.indexOf('class="category-tracks"');
  if (from < 0) return [];
  // up to whatever comes after the list: its pages' numbers, or the side lists' cards
  const ends = ['class="pagination', 'class="card-header', 'side-scroll', '<aside', '<footer']
    .map((m) => html.indexOf(m, from)).filter((i) => i > 0);
  const part = html.slice(from, ends.length ? Math.min(...ends) : undefined);
  return [...part.matchAll(/data-uniqid="([^"]+)"[\s\S]*?data-title="([^"]*)"[\s\S]*?data-artist="([^"]*)"[\s\S]*?data-duration="([^"]*)"/g)]
    .map(([, uid, title, artist, duration]) => ({ key: uid, title: attr(title), artist: attr(artist), duration }));
}

if (MODE === 'albums-plan') {
  const slug = (process.env.RECITER || '').trim();
  const name = (process.env.TITLES || '').trim();
  if (!slug || !name) throw new Error('RECITER (the site\'s page name) and TITLES (the library\'s name) are needed');
  const list = FILES[0] === 'cats' ? 'cats' : 'releases';
  let releases = await allPages(`/@${slug}-${list}`, readReleases);
  console.log(`${releases.length} lists on /@${slug}-${list}`);
  for (const r of releases) {
    r.tracks = (await allPages(`/cat-${r.id}`, readTracks)).filter((t) => t.artist.includes(name.split(' ')[0]));
  }
  releases = releases.filter((r) => r.tracks.length);

  const library = (await rows('audio_library')).filter((t) => t.reciter_name === name);
  console.log(`${library.length} tracks of ${name} in the library`);
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync(`out/albums-${slug}-library.json`, JSON.stringify(library.map(kept), null, 1));
  const close = (a, b) => {
    const x = seconds(a);
    const y = seconds(b);
    return !x || !y || Math.abs(x - y) <= Math.max(10, 0.05 * Math.max(x, y));
  };
  // The same title: the same words (all of the shorter's in the longer's, at least two
  // thirds of the longer's), and the same length when both have one
  const same = (siteTitle, t) => {
    const a = words(siteTitle);
    const b = words(t.title);
    if (!a.size || !b.size) return false;
    let common = 0;
    for (const w of a) if (b.has(w)) common++;
    return common === Math.min(a.size, b.size) && common / Math.max(a.size, b.size) >= 0.66;
  };
  const albumsOf = new Map(); // library id -> releases
  const md = [`# ألبومات ${name} (من صوت الشيعة)`, ''];
  for (const r of releases) {
    r.have = 0;
    r.rows = r.tracks.map((s) => {
      const hits = library.filter((t) => same(s.title, t) && close(s.duration, t.duration));
      if (hits.length) r.have++;
      for (const t of hits) albumsOf.set(t.id, [...(albumsOf.get(t.id) || []), r]);
      return { title: s.title, duration: s.duration, ids: hits.map((t) => t.id) };
    });
    console.log(`- «${r.name}» (cat-${r.id}): ${r.have} of ${r.tracks.length} in the library`);
    md.push(`## ${r.name} — ${r.have} من ${r.tracks.length}`, ...r.rows.map((x) => `- ${x.ids.length ? '✓' : '✗'} ${x.title} (${x.duration})${x.ids.length ? ` ← ${x.ids.join(', ')}` : ''}`), '');
  }
  const twice = [...albumsOf].filter(([, rs]) => rs.length > 1);
  const none = library.filter((t) => !albumsOf.has(t.id));
  console.log(`\n# In the library: ${albumsOf.size} of ${library.length} tracks found in a release; ${twice.length} in more than one; ${none.length} in none`);
  md.push(`# في المكتبة: ${albumsOf.size} من ${library.length} في إصدار؛ ${twice.length} في أكثر من إصدار؛ ${none.length} في لا إصدار`, '');
  md.push('## في أكثر من إصدار', ...twice.map(([id, rs]) => `- ${id} «${library.find((t) => t.id === id).title}»: ${rs.map((r) => r.name).join(' · ')}`), '');
  md.push('## في لا إصدار', ...none.map((t) => `- ${t.id} «${t.title}» ${t.duration || ''}`), '');
  fs.mkdirSync('out', { recursive: true });
  const out = list === 'cats' ? `out/albums-${slug}-cats` : `out/albums-${slug}`;
  fs.writeFileSync(`${out}.md`, md.join('\n'));
  fs.writeFileSync(`${out}.json`, JSON.stringify({
    reciter: name, at: new Date().toISOString(),
    releases: releases.map((r) => ({ id: r.id, name: r.name, tracks: r.rows })),
    none: none.map((t) => t.id),
  }, null, 1));
  const missingAll = releases.reduce((n, r) => n + r.tracks.length - r.have, 0);
  console.log(`\n# On the site, not in the library: ${missingAll} tracks in ${releases.filter((r) => r.have < r.tracks.length).length} releases`);
  md.push(`# في الموقع وليس في المكتبة: ${missingAll} مقطعاً`);
  fs.writeFileSync(`${out}.md`, md.join('\n'));
}

if (MODE === 'albums-library') {
  const name = (process.env.TITLES || '').trim();
  if (!name) throw new Error('TITLES (the reciter\'s name in the library) is needed');
  const library = (await rows('audio_library')).filter((t) => t.reciter_name === name);
  console.log(`${library.length} tracks of ${name} in the library; ${library.filter((t) => t.album).length} with an album`);
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync(`out/library-${(process.env.RECITER || 'reciter').trim()}.json`, JSON.stringify(library.map(kept), null, 1));
}

if (MODE === 'albums-write-plan' || MODE === 'albums-write') {
  const slug = (process.env.RECITER || '').trim();
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('RECITER: the albums file\'s name (scripts/albums/RECITER.json)');
  const plan = JSON.parse(fs.readFileSync(`scripts/albums/${slug}.json`, 'utf8'));
  const library = (await rows('audio_library')).filter((t) => t.reciter_name === plan.reciter);
  const byId = new Map(library.map((t) => [t.id, t]));
  const want = new Map();
  for (const { name, ids } of plan.albums) {
    for (const id of ids) {
      if (!byId.has(id)) throw new Error(`track ${id} («${name}») is not ${plan.reciter}'s`);
      if (want.has(id)) throw new Error(`track ${id} is in «${want.get(id)}» and «${name}»`);
      want.set(id, name);
    }
  }
  const changes = library.map((t) => ({ id: t.id, album: want.get(t.id) ?? null, was: t.album ?? null }))
    .filter((c) => c.album !== c.was);
  console.log(`${library.length} tracks of ${plan.reciter}; ${want.size} in ${plan.albums.length} albums; ${changes.length} to change`);
  for (const c of changes) console.log(`- ${c.id} «${byId.get(c.id).title}»: ${c.was ?? '—'} → ${c.album ?? '—'}`);
  if (MODE === 'albums-write') {
    for (let i = 0; i < changes.length; i += 100) {
      const res = await call({ action: 'album', changes: changes.slice(i, i + 100).map(({ id, album }) => ({ id, album })) });
      console.log(`written: ${res.albums.length}`);
    }
  }
}
