// Songs credited to another reciter as well (run by .github/workflows/library.yml;
// MODE = reciter-plan | reciter, RECITER = whose they are, TITLES = their titles,
// one per line or separated by "|"):
//
// each title's tracks under another name that are the same recording as one of
// RECITER's (the same file, the same content, or the same length within 5 s or
// 3%) are given RECITER's name. "tidy" then finds them copies of the same
// reciter and keeps one, its likes, playlists and listens moved to it.
//
// "reciter-plan" only says what "reciter" would do. Through /api/admin/library,
// which keeps the rows as they were in the bucket (backups/reciters/).
import { call, bucket, rows, keyOf, words } from './upkeep.mjs';

const MODE = process.env.MODE || 'reciter-plan';
const RECITER = (process.env.RECITER || '').trim();
const TITLES = (process.env.TITLES || '').split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
if (!RECITER || !TITLES.length) throw new Error('RECITER and TITLES are needed');

const seconds = (d) => {
  if (d == null || d === '') return null;
  const parts = String(d).split(':').map(Number);
  return parts.some(Number.isNaN) ? null : parts.reduce((s, p) => s * 60 + p, 0);
};
const objects = await bucket();
const byKey = new Map(objects.map((o) => [o.key, o]));
const tracks = await rows('audio_library');
if (!tracks.some((t) => t.reciter_name === RECITER)) throw new Error(`no track of «${RECITER}»`);

const content = (t) => { const o = byKey.get(keyOf(t.file_url)); return o ? `${o.etag}:${o.size}` : null; };
const same = (a, b) => {
  if (keyOf(a.file_url) && keyOf(a.file_url) === keyOf(b.file_url)) return 'same file';
  if (content(a) && content(a) === content(b)) return 'same content';
  const x = seconds(a.duration);
  const y = seconds(b.duration);
  return x && y && Math.abs(x - y) <= Math.max(5, 0.03 * Math.max(x, y)) ? 'same length' : null;
};

const moves = []; // { t, like, why }
for (const title of TITLES) {
  const wanted = [...words(title)];
  const found = tracks.filter((t) => { const w = words(t.title); return wanted.every((x) => w.has(x)); });
  const theirs = found.filter((t) => t.reciter_name === RECITER);
  const others = found.filter((t) => t.reciter_name !== RECITER);
  console.log(`\n## «${title}»: ${theirs.length} of ${RECITER}, ${others.length} under another name`);
  for (const t of found) console.log(`- ${t.id} «${t.title}» ${t.reciter_name || ''} ${t.duration || ''} (${t.listen_count || 0} listens) ${keyOf(t.file_url) || t.file_url}`);
  for (const t of others) {
    const like = theirs.find((r) => same(t, r));
    if (like) moves.push({ t, like, why: same(t, like) });
    else console.log(`  - ${t.id} is not the same recording as any of ${RECITER}'s: left`);
  }
}

console.log(`\n# Plan: ${moves.length} tracks given ${RECITER}'s name`);
for (const m of moves) console.log(`- ${m.t.id} «${m.t.title}» ${m.t.reciter_name} → ${RECITER} (like ${m.like.id}: ${m.why})`);

if (MODE === 'reciter' && moves.length) {
  const byLike = new Map();
  for (const m of moves) byLike.set(m.like.id, [...(byLike.get(m.like.id) || []), m.t.id]);
  for (const [like, ids] of byLike) {
    const res = await call({ action: 'reciter', ids, like });
    console.log(`moved ${res.moved.join(', ')} → ${res.reciter}`);
  }
}
