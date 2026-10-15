// Tidying the library (run by .github/workflows/library.yml; MODE = tidy-plan | tidy):
//
//   titles  each title cleaned as the imported ones were: no "MP3 320K" or ".mp3",
//           no reciter's name (theirs) inside it, no "Video"/"HD", one space
//   copies  the same track more than once: the same file, the same content
//           (ETag and size), or the same reciter and title with the same length
//           (within 5 s or 3%). The one kept: most listened to, then with a
//           cover, then the bigger file, then the older. The others go; their
//           likes, playlists and listens move to it
//   clips   tracks shorter than a minute go
//
// "tidy-plan" only says what "tidy" would do. Through /api/admin/library,
// which checks each step again (same reciter for a copy, under a minute for
// a clip) and keeps each removed row in the bucket (backups/removed-tracks/).
import { call, bucket, rows, keyOf, words, titleOf } from './upkeep.mjs';

const MODE = process.env.MODE || 'tidy-plan';
const SHORT = 60;

const seconds = (d) => {
  if (d == null || d === '') return null;
  if (typeof d === 'number') return d;
  const parts = String(d).split(':').map(Number);
  return parts.some(Number.isNaN) ? null : parts.reduce((s, p) => s * 60 + p, 0);
};
const MB = (b) => `${(b / 1024 ** 2).toFixed(1)} MB`;

const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
const playlists = await rows('user_playlists').catch(() => []);
console.log(`${tracks.length} tracks · ${playlists.length} playlists · ${objects.length} objects`);

// ─── Titles ──────────────────────────────────────────────────────────────────
function cleanTitle(t) {
  const raw = String(t.title || '');
  const s = raw.replace(/\.(mp3|m4a|wav|aac|ogg|opus|flac)\s*$/i, '').replace(/\(?\s*mp3\s*\d*\s*k?\s*\)?/gi, ' ');
  // through the same cleaner as the files' names (".x" for the name's extension); a misspelt name only a letter off
  // (a dash left alone between two others goes: "فرهدو مني - - مخيم…")
  const out = titleOf(`${s}.x`, t.reciter_name, 1).replace(/\s+/g, ' ').replace(/(?:\s*-\s*){2,}/g, ' - ').replace(/^[\s-]+|[\s-]+$/g, '').trim();
  return out.length >= 2 ? out : raw;
}
const retitles = [];
for (const t of tracks) {
  const title = cleanTitle(t);
  if (title !== t.title) retitles.push({ t, title });
}
const newTitle = new Map(retitles.map((r) => [r.t.id, r.title]));
const cleaned = new Map(tracks.map((t) => [t.id, newTitle.get(t.id) ?? t.title]));

// ─── Copies ──────────────────────────────────────────────────────────────────
const parent = new Map(tracks.map((t) => [t.id, t.id]));
const find = (id) => { while (parent.get(id) !== id) { parent.set(id, parent.get(parent.get(id))); id = parent.get(id); } return id; };
const join = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(ra, rb); };
const why = new Map(); // id -> how it was found a copy
const groupBy = (keyFn, label) => {
  const groups = new Map();
  for (const t of tracks) {
    const k = keyFn(t);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const t of list.slice(1)) { join(list[0].id, t.id); why.set(t.id, label); why.set(list[0].id, why.get(list[0].id) || label); }
  }
};
groupBy((t) => keyOf(t.file_url), 'same file');
groupBy((t) => { const o = byKey.get(keyOf(t.file_url)); return o && o.size > 100 * 1024 ? `${o.etag}:${o.size}` : null; }, 'same content');
// Same reciter, same title (its words, folded), same length
const byTitle = new Map();
for (const t of tracks) {
  const w = [...words(cleaned.get(t.id))].sort().join(' ');
  if (!w) continue;
  const k = `${t.reciter_name || ''}|${w}`;
  if (!byTitle.has(k)) byTitle.set(k, []);
  byTitle.get(k).push(t);
}
for (const list of byTitle.values()) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = seconds(list[i].duration);
    const b = seconds(list[j].duration);
    if (a && b && Math.abs(a - b) <= Math.max(5, 0.03 * Math.max(a, b))) {
      join(list[i].id, list[j].id);
      if (!why.has(list[j].id)) why.set(list[j].id, 'same title and length');
      if (!why.has(list[i].id)) why.set(list[i].id, 'same title and length');
    }
  }
}
const groups = new Map();
for (const t of tracks) {
  const r = find(t.id);
  if (!groups.has(r)) groups.set(r, []);
  groups.get(r).push(t);
}
const sizeOf = (t) => byKey.get(keyOf(t.file_url))?.size || 0;
const copies = []; // { t, keep }
for (const list of groups.values()) {
  if (list.length < 2) continue;
  const sorted = [...list].sort((a, b) => (b.listen_count || 0) - (a.listen_count || 0)
    || Number(!!b.image_url) - Number(!!a.image_url) || sizeOf(b) - sizeOf(a) || a.id - b.id);
  for (const t of sorted.slice(1)) copies.push({ t, keep: sorted[0] });
}

// ─── Clips ───────────────────────────────────────────────────────────────────
const removing = new Set(copies.map((c) => c.t.id));
const short = tracks.filter((t) => !removing.has(t.id) && seconds(t.duration) != null && seconds(t.duration) < SHORT);
// A dua that is short by nature (the days of Ramadan) is not a clip
const duas = short.filter((t) => /^دعاء/.test(cleaned.get(t.id)));
const clips = short.filter((t) => !duas.includes(t));

// ─── Plan ────────────────────────────────────────────────────────────────────
console.log('\n# Plan');
console.log(`\n## Titles: ${retitles.length} to clean`);
const drastic = retitles.filter((r) => r.title.length < String(r.t.title).length * 0.45);
for (const r of retitles.filter((_, i) => i % Math.max(1, Math.floor(retitles.length / 60)) === 0).slice(0, 60)) {
  console.log(`- ${r.t.id}: «${r.t.title}» → «${r.title}»`);
}
console.log(`- much shorter after cleaning (${drastic.length}):`);
for (const r of drastic.slice(0, 30)) console.log(`  - ${r.t.id}: «${r.t.title}» → «${r.title}»`);

console.log(`\n## Copies: ${copies.length} tracks to remove (${MB(copies.reduce((s, c) => s + (keyOf(c.t.file_url) === keyOf(c.keep.file_url) ? 0 : sizeOf(c.t)), 0))} of files freed)`);
const byReason = new Map();
for (const c of copies) byReason.set(why.get(c.t.id), (byReason.get(why.get(c.t.id)) || 0) + 1);
console.log(`- found by: ${[...byReason].map(([k, n]) => `${k} ${n}`).join(' · ')}`);
const crossReciter = copies.filter((c) => (c.t.reciter_name || '') !== (c.keep.reciter_name || ''));
console.log(`- under another reciter's name (left for you to look at, not removed): ${crossReciter.length}`);
for (const c of crossReciter.slice(0, 10)) console.log(`  - ${c.t.id} «${c.t.title}» (${c.t.reciter_name}) = ${c.keep.id} «${c.keep.title}» (${c.keep.reciter_name})`);
for (const c of copies.filter((x) => !crossReciter.includes(x)).slice(0, 200)) {
  console.log(`- remove ${c.t.id} «${c.t.title}» ${c.t.duration} (${c.t.listen_count || 0} listens) → keep ${c.keep.id} «${c.keep.title}» ${c.keep.duration} (${c.keep.listen_count || 0}) [${why.get(c.t.id)}]`);
}

console.log(`\n## Short duas kept: ${duas.length}`);
for (const t of duas) console.log(`- ${t.id} «${cleaned.get(t.id)}» ${t.duration}`);
console.log(`\n## Clips under ${SHORT} s: ${clips.length}`);
for (const t of clips) console.log(`- ${t.id} «${t.title}» ${t.reciter_name || ''} ${t.duration} (${t.listen_count || 0} listens) ${keyOf(t.file_url) || t.file_url}`);

// ─── Do it ───────────────────────────────────────────────────────────────────
if (MODE === 'tidy') {
  console.log('\n# Tidying');
  let retitled = 0;
  for (let i = 0; i < retitles.length; i += 20) {
    const res = await call({ action: 'retitle', changes: retitles.slice(i, i + 20).map((r) => ({ id: r.t.id, title: r.title })) });
    retitled += res.retitled.length;
  }
  console.log(`titles cleaned: ${retitled}`);

  const items = [
    ...copies.filter((c) => !crossReciter.includes(c)).map((c) => ({ id: c.t.id, keep: c.keep.id })),
    ...clips.map((t) => ({ id: t.id })),
  ];
  const gone = new Map(); // id -> kept instead (or null)
  const refused = [];
  let likes = 0;
  let files = 0;
  for (let i = 0; i < items.length; i += 2) {
    const res = await call({ action: 'remove', items: items.slice(i, i + 2) });
    for (const r of res.removed) { gone.set(r.id, r.keep); likes += r.likes; files += r.files; }
    refused.push(...res.refused);
  }
  console.log(`removed: ${gone.size} tracks (${[...gone.values()].filter((k) => k != null).length} copies, ${[...gone.values()].filter((k) => k == null).length} clips); likes moved or cleared: ${likes}; files deleted: ${files}`);
  for (const [id, reason] of refused) console.log(`- not removed ${id}: ${reason}`);

  // Playlists: a removed copy becomes the one kept; a removed clip leaves
  let changed = 0;
  for (const p of playlists) {
    if (!Array.isArray(p.tracks)) continue;
    const next = [];
    // the kept one written as the playlist writes its tracks ("cloud_12", "12" or 12)
    const as = (item, id) => (typeof item === 'number' ? id : String(item).startsWith('cloud_') ? `cloud_${id}` : String(id));
    const has = (id) => next.some((x) => Number(String(x).replace(/^cloud_/, '')) === id)
      || p.tracks.some((x) => Number(String(x).replace(/^cloud_/, '')) === id);
    for (const item of p.tracks) {
      const id = Number(String(item).replace(/^cloud_/, ''));
      if (!gone.has(id)) { next.push(item); continue; }
      const keep = gone.get(id);
      if (keep != null && !has(keep)) next.push(as(item, keep));
    }
    if (next.length !== p.tracks.length || next.some((x, i) => x !== p.tracks[i])) {
      await call({ action: 'playlist', id: p.id, tracks: next });
      changed++;
    }
  }
  console.log(`playlists updated: ${changed}`);
}
